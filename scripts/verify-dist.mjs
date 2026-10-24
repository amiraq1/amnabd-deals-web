// scripts/verify-dist.mjs
//
// Post-build gate: fails when `dist/` publishes a claim the source data does not
// prove. Runs after `npm run build` and before the artifact is uploaded, so a
// regression cannot ship silently (audit C-01 / H-03).
//
// Scope: every *text* artifact a crawler or a share preview can read —
//   dist/deal/<slug>/index.html, dist/og/<slug>.svg,
//   dist/<collection>/index.html, dist/index.html, dist/404.html,
//   dist/feed.xml, dist/sitemap.xml, dist/llms.txt
//
// Deliberately out of scope: dist/assets/*.js and *.css. Those are the running
// app, where "متاح للجميع" is the label of a filter option ("open to all —
// verified"), not a claim about any specific deal. The filter itself fails
// closed (isOpenToAll), so the string there is UI copy, not an assertion.
//
//   node scripts/verify-dist.mjs [--dist <dir>]
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  isStaticDealSlug,
  loadDealsCatalog,
  loadPublicDealRecords,
  STATIC_AGGREGATIONS,
  sharedSeo,
} from './generate-static-seo.mjs';
import { inspectDealDeadlineCoverage } from './deal-deadline-guard.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { dealFacts } = sharedSeo;

// Per-deal claims: each phrase is allowed only when its own explicit field holds.
const DEAL_CLAIMS = [
  {
    phrases: ['متاح للجميع'],
    allowed: (facts) => facts.openToAll,
    needs: 'open_to_all=yes + applicant_type=any + worldwide + بلا قائمة دول',
  },
  { phrases: ['مخصص للطلاب'], allowed: (facts) => facts.studentsOnly, needs: 'student_status=required' },
  { phrases: ['بدون بطاقة'], allowed: (facts) => facts.noCard, needs: 'card_required=not_required' },
  {
    phrases: ['موثّق', 'موثق', 'verified'],
    allowed: (facts) => facts.verified,
    needs: 'review.verification_status=verified',
  },
];

// Site-wide claims (homepage, 404, feed, llms.txt) speak about the whole
// directory, so they are allowed only when *every* published deal holds the fact.
const SITE_CLAIMS = [
  {
    phrases: ['موثّق', 'موثق', 'verified'],
    every: (facts) => facts.verified,
    needs: 'كل عرض منشور موثّق',
  },
  { phrases: ['متاح للجميع'], every: (facts) => facts.openToAll, needs: 'كل عرض منشور متاح للجميع' },
  { phrases: ['بدون بطاقة'], every: (facts) => facts.noCard, needs: 'كل عرض منشور بلا بطاقة' },
  // No field proves "free": a zero offer price is a recorded price, not a
  // promise that the whole offer costs nothing (Docker needs a card).
  {
    phrases: ['مجان', 'free', 'Free'],
    every: () => false,
    needs: 'لا يوجد حقل في المصدر يثبت المجانية',
  },
];

const SITE_FILES = ['index.html', '404.html', 'feed.xml', 'sitemap.xml', 'llms.txt'];

// Source text that sounds like a claim; reported as a warning, never a failure,
// because it is editorial content and a human has to decide.
const SUMMARY_HINTS = [
  'موثّق',
  'موثق',
  'verified',
  'متاح للجميع',
  'مجان',
  'بدون بطاقة',
  'no credit card',
  'free',
];

function readIfExists(path) {
  return existsSync(path) ? readFileSync(path, 'utf8') : null;
}

function metaContent(html, attr, key) {
  const re = new RegExp(`<meta\\s+${attr}=["']${key}["'][^>]*content=["']([^"']*)["']`, 'i');
  return re.exec(html)?.[1] ?? '';
}

function jsonLdOf(html) {
  const match =
    /<script\s+type=["']application\/ld\+json["'][^>]*data-deal-jsonld=["']true["'][^>]*>([\s\S]*?)<\/script>/i.exec(
      html
    );
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return 'invalid';
  }
}

function checkText(report, file, text, claims, allow) {
  for (const claim of claims) {
    const hit = claim.phrases.find((phrase) => text.includes(phrase));
    if (!hit) continue;
    if (!allow(claim)) {
      report(`${file}: ادعاء «${hit}» غير مثبت (يتطلب ${claim.needs})`);
    }
  }
}

function checkDealPage(report, distDir, slug, facts) {
  const rel = `deal/${slug}/index.html`;
  const html = readIfExists(join(distDir, rel));
  if (html === null) return;

  const allow = (claim) => claim.allowed(facts);
  checkText(report, rel, metaContent(html, 'name', 'description'), DEAL_CLAIMS, allow);
  checkText(report, rel, metaContent(html, 'property', 'og:description'), DEAL_CLAIMS, allow);

  const jsonLd = jsonLdOf(html);
  if (jsonLd === 'invalid') {
    report(`${rel}: JSON-LD غير قابل للتحليل`);
    return;
  }
  if (!jsonLd) return;

  if ('price' in jsonLd && !facts.price) report(`${rel}: حقل price بلا سعر صريح في المصدر`);
  if ('priceCurrency' in jsonLd && !facts.price)
    report(`${rel}: حقل priceCurrency بلا سعر صريح في المصدر`);
  if ('availability' in jsonLd && !facts.availability)
    report(`${rel}: حقل availability بلا حالة صريحة (status=${facts.status ?? 'غير معلوم'})`);
  if ('dateModified' in jsonLd && !facts.reviewedOn)
    report(`${rel}: حقل dateModified بلا تاريخ مراجعة صالح`);
}

function checkSiteFiles(report, distDir, deals) {
  const facts = deals.map((deal) => dealFacts(deal));
  for (const rel of SITE_FILES) {
    const raw = readIfExists(join(distDir, rel));
    if (raw === null) continue;
    const allow = (claim) => facts.length > 0 && facts.every(claim.every);
    checkText(report, rel, siteTextOf(rel, raw), SITE_CLAIMS, allow);
  }
}

function checkLlmsDealRoutes(report, distDir, deals) {
  const raw = readIfExists(join(distDir, 'llms.txt'));
  if (raw === null) return;

  const canonicalOrigin = new URL(sharedSeo.DEFAULT_SITE_URL).origin;
  const expected = new Set(deals.filter((deal) => isStaticDealSlug(deal?.slug)).map((deal) => deal.slug));
  const found = [];
  for (const match of raw.matchAll(/\]\(([^)\s]+)\)/g)) {
    const link = match[1];
    let parsed;
    try {
      parsed = new URL(link);
    } catch {
      report(`llms.txt: رابط عرض غير صالح (${link})`);
      continue;
    }
    const route = parsed.pathname.match(/^\/deal\/([^/]+)$/);
    if (parsed.origin !== canonicalOrigin || parsed.search || parsed.hash || !route) {
      report(`llms.txt: يجب أن يكون رابط العرض مسارًا canonical بلا query أو hash (${link})`);
      continue;
    }
    let slug;
    try {
      slug = decodeURIComponent(route[1]);
    } catch {
      report(`llms.txt: slug غير صالح (${link})`);
      continue;
    }
    if (!expected.has(slug)) report(`llms.txt: رابط لعرض غير موجود في كتالوج SEO (${slug})`);
    found.push(slug);
  }

  const seen = new Set();
  for (const slug of found) {
    if (seen.has(slug)) report(`llms.txt: رابط مكرر للعرض ${slug}`);
    seen.add(slug);
  }
  for (const slug of expected) {
    if (!seen.has(slug)) report(`llms.txt: رابط SEO مفقود للعرض ${slug}`);
  }
}

// Only the parts of a site file that speak about the directory as a whole.
// Per-deal text (feed items, llms.txt deal lines, JSON-LD ItemList entries) is
// source content and must not be judged by a site-wide rule.
function siteTextOf(rel, raw) {
  if (rel === 'feed.xml') return raw.split('<item>')[0];
  if (rel === 'llms.txt') return raw.split(/^- \[/m)[0];
  // A sitemap is identifiers only: "/deal/deepseek-flash-1017-free" is a slug,
  // not a claim that the offer is free.
  if (rel === 'sitemap.xml') return raw.replace(/<loc>[^<]*<\/loc>/g, '');

  const withoutJsonLd = raw.replace(
    /<script[^>]*application\/ld\+json[^>]*>[\s\S]*?<\/script>/gi,
    ''
  );
  const siteNodes = [...raw.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)]
    .flatMap((match) => {
      try {
        const doc = JSON.parse(match[1]);
        return doc['@graph'] ?? [doc];
      } catch {
        return [];
      }
    })
    .filter((node) => node && (node['@type'] === 'WebSite' || node['@type'] === 'Organization'))
    .map((node) => `${node.name ?? ''} ${node.description ?? ''}`)
    .join(' ');

  return `${withoutJsonLd} ${siteNodes}`;
}

function listSlugs(distDir, sub) {
  const dir = join(distDir, sub);
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

function summaryWarnings(deals) {
  const warnings = [];
  for (const deal of deals) {
    const text = [deal.name, deal.summary]
      .filter((value) => typeof value === 'string')
      .join(' ')
      .trim();
    if (!text) continue;
    const lower = text.toLowerCase();
    const hit = SUMMARY_HINTS.find((word) => lower.includes(word.toLowerCase()));
    if (!hit) continue;
    const at = lower.indexOf(hit.toLowerCase());
    const excerpt = text
      .slice(Math.max(0, at - 30), at + hit.length + 30)
      .replace(/\s+/g, ' ')
      .trim();
    warnings.push({ slug: deal.slug, word: hit, excerpt });
  }
  return warnings;
}

export function verifyDist({ rootDir = ROOT, distDir = join(ROOT, 'dist'), liveDeals } = {}) {
  if (!existsSync(distDir)) {
    return { violations: [`${distDir}: مجلد البناء غير موجود`], warnings: [] };
  }

  const violations = [];
  const report = (message) => violations.push(message);

  const deals = loadDealsCatalog(rootDir);
  const bySlug = new Map(deals.map((deal) => [deal.slug, deal]));
  const genericAppShell = readIfExists(join(distDir, 'index.html'));
  let deadlineWarnings = [];
  let deadlineCoverage = [];

  if (Array.isArray(liveDeals)) {
    const recordsWithSeoText = liveDeals.map((deal) => {
      const seoDeal = bySlug.get(deal?.slug);
      return {
        ...deal,
        name: deal?.name ?? seoDeal?.name,
        summary: seoDeal?.summary,
      };
    });
    const coverage = inspectDealDeadlineCoverage(recordsWithSeoText, {
      timestampInstant: sharedSeo.timestampInstant,
    });
    deadlineWarnings = coverage.warnings;
    deadlineCoverage = coverage.covered;
    for (const issue of coverage.violations) {
      report(
        `F-04: deal/${issue.slug}: explicit closing date/time in ${issue.paths.join(', ')} requires a valid ends_at`
      );
    }
  }

  for (const slug of listSlugs(distDir, 'deal')) {
    const deal = bySlug.get(slug);
    if (!deal) {
      const routeHtml = readIfExists(join(distDir, 'deal', slug, 'index.html'));
      if (genericAppShell !== null && routeHtml === genericAppShell) continue;
      report(`deal/${slug}: صفحة لعرض غير موجود في المصدر`);
      continue;
    }
    checkDealPage(report, distDir, slug, dealFacts(deal));
  }

  const ogDir = join(distDir, 'og');
  if (existsSync(ogDir)) {
    for (const file of readdirSync(ogDir)) {
      if (!file.endsWith('.svg')) continue;
      const slug = file.slice(0, -4);
      const deal = bySlug.get(slug);
      if (!deal) {
        report(`og/${file}: بطاقة لعرض غير موجود في المصدر`);
        continue;
      }
      const svg = readIfExists(join(ogDir, file));
      if (svg !== null) {
        const facts = dealFacts(deal);
        checkText(report, `og/${file}`, svg, DEAL_CLAIMS, (claim) => claim.allowed(facts));
      }
    }
  }

  checkSiteFiles(report, distDir, deals);
  checkLlmsDealRoutes(report, distDir, deals);

  // An empty collection page advertises deals that were never established.
  for (const agg of STATIC_AGGREGATIONS) {
    const matches = deals.filter((deal) => agg.filter(deal));
    const rel = `${agg.slug}/index.html`;
    const html = readIfExists(join(distDir, rel));
    if (matches.length === 0) {
      if (html !== null && html !== genericAppShell)
        report(`${rel}: صفحة مجموعة بلا أي عرض يثبتها المصدر`);
      continue;
    }
    if (html === null) continue;
    const allVerified = matches.every((deal) => dealFacts(deal).verified);
    if (html.includes('موثّق') && !allVerified) {
      report(`${rel}: وصف المجموعة يدّعي التوثيق وليس كل أعضائها موثّقين`);
    }
  }

  return { violations, warnings: summaryWarnings(deals), deadlineWarnings, deadlineCoverage };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (isMain) {
  try {
    const index = process.argv.indexOf('--dist');
    const distDir = index > -1 && process.argv[index + 1] ? resolve(process.argv[index + 1]) : undefined;
    const source = process.env.SEO_PARITY_SOURCE || 'live';
    let liveDeals;
    if (source === 'live') {
      liveDeals = await loadPublicDealRecords({ rootDir: ROOT });
    } else if (source === 'snapshot') {
      console.warn('verify-dist: F-04 live-data guard skipped (snapshot build has no live ends_at fields).');
    } else {
      throw new Error(`SEO_PARITY_SOURCE must be "live" or "snapshot" (received "${source}").`);
    }

    const { violations, warnings, deadlineWarnings, deadlineCoverage } = verifyDist({
      ...(distDir ? { distDir } : {}),
      ...(liveDeals ? { liveDeals } : {}),
    });
    if (warnings.length > 0) {
      // Written outside the repo so the list is reviewable without being committed.
      const warningFile = join(tmpdir(), 'amnabd-verify-dist-warnings.txt');
      writeFileSync(
        warningFile,
        warnings.map((w) => `${w.slug}\t${w.word}\t${w.excerpt}`).join('\n') + '\n',
        'utf8'
      );
      console.warn(
        `verify-dist: ${warnings.length} تحذير محتوى (لا يوقف البناء) — ${warningFile}`
      );
      for (const warning of warnings) {
        console.warn(`  ! deal/${warning.slug}: نص المصدر يحوي «${warning.word}»`);
      }
    }
    if (deadlineWarnings.length > 0) {
      console.warn(
        `verify-dist: ${deadlineWarnings.length} موعدًا يوميًا بلا ends_at صالح؛ مستبعد من احتساب الانتهاء دون اختراع وقت.`
      );
      for (const warning of deadlineWarnings) {
        console.warn(
          `  ! deal/${warning.slug}: موعد إغلاق يومي في ${warning.paths.join(', ')} غير مؤهل لمعالجة الانتهاء.`
        );
      }
    }
    if (deadlineCoverage.length > 0) {
      console.log(
        `verify-dist: F-04 ends_at verified for ${deadlineCoverage.length} deadline-bearing deal(s): ${deadlineCoverage
          .map((deal) => deal.slug)
          .join(', ')}`
      );
    }
    if (violations.length > 0) {
      console.error('verify-dist: FAIL');
      for (const violation of violations) console.error(`  - ${violation}`);
      process.exit(1);
    }
    console.log('verify-dist: OK');
  } catch (error) {
    console.error('[verify-dist] error:', error instanceof Error ? error.message : 'unknown error');
    process.exit(1);
  }
}

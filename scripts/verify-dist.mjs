// scripts/verify-dist.mjs
//
// Post-build gate: fails when `dist/` publishes a claim the source data does not
// prove. Runs after `npm run build` and before the artifact is uploaded, so a
// regression cannot ship silently (audit C-01 / H-03).
//
//   node scripts/verify-dist.mjs [--dist <dir>]
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDealsCatalog, STATIC_AGGREGATIONS, sharedSeo } from './generate-static-seo.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { dealFacts } = sharedSeo;

const CLAIMS = [
  {
    phrase: 'متاح للجميع',
    allowed: (facts) => facts.openToAll,
    needs: 'open_to_all=yes + applicant_type=any + worldwide + بلا قائمة دول',
  },
  { phrase: 'مخصص للطلاب', allowed: (facts) => facts.studentsOnly, needs: 'student_status=required' },
  { phrase: 'بدون بطاقة', allowed: (facts) => facts.noCard, needs: 'card_required=not_required' },
  {
    phrase: 'موثّق',
    allowed: (facts) => facts.verified,
    needs: 'review.verification_status=verified',
  },
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

function checkText(report, file, text, facts) {
  for (const claim of CLAIMS) {
    if (!text.includes(claim.phrase)) continue;
    if (!claim.allowed(facts)) {
      report(`${file}: ادعاء «${claim.phrase}» غير مثبت (يتطلب ${claim.needs})`);
    }
  }
}

function checkDealPage(report, distDir, slug, facts) {
  const rel = `deal/${slug}/index.html`;
  const html = readIfExists(join(distDir, rel));
  if (html === null) return;

  checkText(report, rel, metaContent(html, 'name', 'description'), facts);
  checkText(report, rel, metaContent(html, 'property', 'og:description'), facts);

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

function listSlugs(distDir, sub) {
  const dir = join(distDir, sub);
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

export function verifyDist({ rootDir = ROOT, distDir = join(ROOT, 'dist') } = {}) {
  if (!existsSync(distDir)) return [`${distDir}: مجلد البناء غير موجود`];

  const found = [];
  const report = (message) => found.push(message);

  const deals = loadDealsCatalog(rootDir);
  const bySlug = new Map(deals.map((deal) => [deal.slug, deal]));

  for (const slug of listSlugs(distDir, 'deal')) {
    const deal = bySlug.get(slug);
    if (!deal) {
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
      if (svg !== null) checkText(report, `og/${file}`, svg, dealFacts(deal));
    }
  }

  // An empty collection page advertises deals that were never established.
  for (const agg of STATIC_AGGREGATIONS) {
    const matches = deals.filter((deal) => agg.filter(deal));
    const rel = `${agg.slug}/index.html`;
    const html = readIfExists(join(distDir, rel));
    if (matches.length === 0) {
      if (html !== null) report(`${rel}: صفحة مجموعة بلا أي عرض يثبتها المصدر`);
      continue;
    }
    if (html === null) continue;
    const allVerified = matches.every((deal) => dealFacts(deal).verified);
    if (html.includes('موثّق') && !allVerified) {
      report(`${rel}: وصف المجموعة يدّعي التوثيق وليس كل أعضائها موثّقين`);
    }
  }

  return found;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (isMain) {
  const index = process.argv.indexOf('--dist');
  const distDir = index > -1 && process.argv[index + 1] ? resolve(process.argv[index + 1]) : undefined;
  const problems = verifyDist(distDir ? { distDir } : {});
  if (problems.length > 0) {
    console.error('verify-dist: FAIL');
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exit(1);
  }
  console.log('verify-dist: OK');
}

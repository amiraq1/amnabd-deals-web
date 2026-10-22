// scripts/generate-static-seo.mjs
//
// Bakes per-deal HTML, OG cards, sitemap, robots and RSS into `dist/`.
//
// Every published claim comes from `src/lib/seoFacts.ts` — the same module the
// browser uses — and only from fields that exist verbatim in the catalog. This
// file must not derive eligibility, verification, price, availability or dates
// on its own (audit C-01 / H-03).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSharedSeo } from './load-shared.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Compiles the shared TS modules once per process; the app imports the same ones.
const shared = await loadSharedSeo(ROOT);
const { AGGREGATIONS, dealDisplayName, dealFacts } = shared;

// Re-exported so `verify-dist.mjs` reuses the already-compiled copy.
export { shared as sharedSeo };

export const buildDealSeo = shared.buildDealSeo;
export const generateSitemapXml = shared.generateSitemapXml;

export const DEFAULT_SITE_URL =
  process.env.SITE_URL || process.env.VITE_SITE_URL || shared.DEFAULT_SITE_URL;

export function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function explicitText(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function wrapLines(text, max) {
  const lines = [];
  let line = '';
  for (const word of String(text).split(/\s+/).filter(Boolean)) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && Array.from(candidate).length > max) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// The OG card may only state what `facts` proves. With no explicit data it
// renders the name alone — no "verified" badge, no eligibility tag, no value.
export function buildDealOgSvg(deal, facts = dealFacts(deal)) {
  const name = dealDisplayName(deal, 'عرض ذكاء اصطناعي');
  const headline = explicitText(deal?.headline_value);
  const titleLines = wrapLines(name, 30).slice(0, 2).map(escapeHtml);

  const tags = [];
  if (facts.studentsOnly) tags.push('مخصص للطلاب');
  if (facts.noCard) tags.push('بدون بطاقة بنكية');
  if (facts.openToAll) tags.push('متاح للجميع');
  // Eligibility is never assumed. When the record does not prove open access,
  // the card sends the reader to the terms instead of implying everyone
  // qualifies — the C-01 failure was exactly this assumption.
  if (!facts.openToAll && !facts.studentsOnly) tags.push('الأهلية: راجع الشروط');

  const verifiedText = facts.verified
    ? `موثّق من المصدر${facts.reviewedOn ? ` · آخر مراجعة ${facts.reviewedOn}` : ''}`
    : '';

  const titleY = headline ? 250 : 300;
  const titleSvg = titleLines
    .map(
      (line, index) =>
        `  <text x="1096" y="${titleY + index * 62}" fill="#f8fafc" font-family="Cairo, Tajawal, sans-serif" font-size="40" font-weight="700" text-anchor="end" direction="rtl">${line}</text>`
    )
    .join('\n');

  const headlineSvg = headline
    ? `  <g transform="translate(104, 380)">
    <rect x="0" y="0" width="992" height="96" rx="20" fill="#064e3b" fill-opacity="0.35" stroke="#10b981" stroke-opacity="0.5" stroke-width="2" />
    <text x="956" y="62" fill="#34d399" font-family="Cairo, Tajawal, Inter, sans-serif" font-size="40" font-weight="800" text-anchor="end" direction="rtl">${escapeHtml(headline)}</text>
  </g>`
    : '';

  const tagsSvg =
    tags.length > 0
      ? `  <text x="1096" y="520" fill="#cbd5e1" font-family="Cairo, Tajawal, sans-serif" font-size="24" font-weight="500" text-anchor="end" direction="rtl">${escapeHtml(
          tags.join('  •  ')
        )}</text>`
      : '';

  const verifiedSvg = facts.verified
    ? `  <g transform="translate(820, 96)">
    <rect x="0" y="0" width="276" height="46" rx="23" fill="#064e3b" stroke="#10b981" stroke-width="1.5" />
    <text x="138" y="30" fill="#6ee7b7" font-family="Cairo, Tajawal, sans-serif" font-size="18" font-weight="700" text-anchor="middle" direction="rtl">✓ عرض موثّق</text>
  </g>`
    : '';

  const footerRightSvg = verifiedText
    ? `  <text x="1096" y="570" fill="#64748b" font-family="Cairo, Tajawal, sans-serif" font-size="20" text-anchor="end" direction="rtl">${escapeHtml(
        verifiedText
      )}</text>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)" />
  <rect x="48" y="48" width="1104" height="534" rx="28" fill="#0f172a" stroke="#1e293b" stroke-width="3" />
  <rect x="48" y="48" width="1104" height="8" rx="4" fill="url(#accent)" />

${verifiedSvg}
${titleSvg}
${headlineSvg}
${tagsSvg}

  <line x1="104" y1="548" x2="1096" y2="548" stroke="#1e293b" stroke-width="2" />
${footerRightSvg}
  <text x="104" y="570" fill="#10b981" font-family="Inter, Cairo, sans-serif" font-size="20" font-weight="700" text-anchor="start">AMNABD Deals Directory</text>
</svg>`;
}

// Derived from the app's own collection config so slugs, filters and copy exist
// in exactly one place (src/lib/aggregations.ts).
export const STATIC_AGGREGATIONS = Object.values(AGGREGATIONS).map((agg) => ({
  slug: agg.slug,
  title: agg.titleAr,
  description: agg.metaDescriptionAr,
  heading: agg.headingAr,
  filter: agg.filter,
}));

export function buildAggregationSeo(agg, matchingDeals, baseUrl = DEFAULT_SITE_URL) {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const canonicalUrl = `${cleanBase}/${agg.slug}`;

  const itemListElements = matchingDeals.slice(0, 20).map((deal, index) => {
    // Arabic listing page: prefer the Arabic name when the source has one.
    const dealName = explicitText(deal?.name_ar) || dealDisplayName(deal, deal?.slug ?? '');
    const headline = explicitText(deal?.headline_value);
    return {
      '@type': 'ListItem',
      position: index + 1,
      name: dealName,
      url: `${cleanBase}/deal/${deal.slug}`,
      description: headline ? `${dealName} (${headline})` : dealName,
    };
  });

  return {
    title: `${agg.title} — AMNABD Deals`,
    description: agg.description,
    canonicalUrl,
    ogImageUrl: `${cleanBase}/og-image.png`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: agg.heading,
      description: agg.description,
      url: canonicalUrl,
      numberOfItems: matchingDeals.length,
      itemListElement: itemListElements,
    },
  };
}

export function generateRobotsTxt(baseUrl = DEFAULT_SITE_URL) {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  return `User-agent: *\nAllow: /\n\nSitemap: ${cleanBase}/sitemap.xml\n`;
}

export function toRfc822Date(dateStr) {
  if (!dateStr) return new Date().toUTCString();
  const parsed = new Date(dateStr);
  return Number.isNaN(parsed.getTime()) ? new Date().toUTCString() : parsed.toUTCString();
}

export function generateRssFeedXml(deals, baseUrl = DEFAULT_SITE_URL) {
  const cleanBase = baseUrl.replace(/\/+$/, '');

  // Include active or ending_soon deals only, sorted by newest review.
  const feedDeals = [...deals]
    .filter((deal) => deal?.slug && deal.status !== 'expired')
    .sort((a, b) => {
      const aTime = a.review?.reviewed_on ? new Date(a.review.reviewed_on).getTime() : 0;
      const bTime = b.review?.reviewed_on ? new Date(b.review.reviewed_on).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 30);

  const lastBuildDate =
    feedDeals[0]?.review?.reviewed_on
      ? toRfc822Date(feedDeals[0].review.reviewed_on)
      : new Date().toUTCString();

  const itemsXml = feedDeals
    .map((deal) => {
      const dealUrl = `${cleanBase}/deal/${deal.slug}`;
      const prefix = deal.status === 'ending_soon' ? '⏳ ينتهي قريبًا: ' : '';
      const headline = explicitText(deal.headline_value);
      const title = dealDisplayName(deal, deal.slug);
      const itemTitle = escapeHtml(`${prefix}${title}${headline ? ` (${headline})` : ''}`);

      const descParts = [
        explicitText(deal.summary) ||
          explicitText(deal.description_ar) ||
          explicitText(deal.description_en) ||
          title,
        deal.eligibility?.student_status === 'required' ? '• مخصص للطلاب' : '',
        deal.eligibility?.card_required === 'not_required' ? '• بدون بطاقة بنكية' : '',
        deal.ends_at ? `• ينتهي في: ${deal.ends_at}` : '',
      ].filter(Boolean);

      // No review date means no pubDate: a fabricated "now" would make every
      // build look like a new item to feed readers.
      const pubDate = deal.review?.reviewed_on
        ? `\n      <pubDate>${toRfc822Date(deal.review.reviewed_on)}</pubDate>`
        : '';
      const guid = escapeHtml(
        `${deal.slug}:${deal.status ?? 'unknown'}:${deal.review?.reviewed_on ?? 'v1'}`
      );

      return `    <item>
      <title>${itemTitle}</title>
      <link>${escapeHtml(dealUrl)}</link>
      <guid isPermaLink="false">${guid}</guid>${pubDate}
      <description>${escapeHtml(descParts.join(' '))}</description>
    </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>عروض وأرصدة الذكاء الاصطناعي — AMNABD Deals</title>
    <link>${escapeHtml(cleanBase)}/</link>
    <description>أحدث عروض وأرصدة أدوات الذكاء الاصطناعي مع روابط مصادرها</description>
    <language>ar</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${escapeHtml(cleanBase)}/feed.xml" rel="self" type="application/rss+xml" />
${itemsXml}
  </channel>
</rss>\n`;
}

export function injectSeoIntoHtml(baseHtml, seo) {
  let html = baseHtml;

  const safeTitle = escapeHtml(seo.title);
  const safeDesc = escapeHtml(seo.description);
  const safeUrl = escapeHtml(seo.canonicalUrl);
  const safeImage = escapeHtml(seo.ogImageUrl);
  const safeJsonLd = JSON.stringify(seo.jsonLd).replace(/</g, '\\u003c');
  let cleanBase = DEFAULT_SITE_URL.replace(/\/+$/, '');
  if (seo.canonicalUrl) {
    try {
      cleanBase = new URL(seo.canonicalUrl).origin;
    } catch {
      cleanBase = DEFAULT_SITE_URL.replace(/\/+$/, '');
    }
  }

  if (/<title>[\s\S]*?<\/title>/i.test(html)) {
    html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${safeTitle}</title>`);
  } else {
    html = html.replace('</head>', `  <title>${safeTitle}</title>\n</head>`);
  }

  const upsertTag = (regex, newTag) => {
    if (regex.test(html)) {
      html = html.replace(regex, newTag);
    } else {
      html = html.replace('</head>', `  ${newTag}\n</head>`);
    }
  };

  upsertTag(
    /<meta\s+name=["']description["'][^>]*>/i,
    `<meta name="description" content="${safeDesc}">`
  );
  upsertTag(
    /<meta\s+property=["']og:title["'][^>]*>/i,
    `<meta property="og:title" content="${safeTitle}">`
  );
  upsertTag(
    /<meta\s+property=["']og:description["'][^>]*>/i,
    `<meta property="og:description" content="${safeDesc}">`
  );
  upsertTag(
    /<meta\s+property=["']og:image["'][^>]*>/i,
    `<meta property="og:image" content="${safeImage}">`
  );
  upsertTag(
    /<meta\s+property=["']og:image:width["'][^>]*>/i,
    `<meta property="og:image:width" content="1200">`
  );
  upsertTag(
    /<meta\s+property=["']og:image:height["'][^>]*>/i,
    `<meta property="og:image:height" content="630">`
  );
  upsertTag(
    /<meta\s+property=["']og:url["'][^>]*>/i,
    `<meta property="og:url" content="${safeUrl}">`
  );
  upsertTag(
    /<meta\s+property=["']og:type["'][^>]*>/i,
    `<meta property="og:type" content="website">`
  );
  upsertTag(
    /<meta\s+name=["']twitter:card["'][^>]*>/i,
    `<meta name="twitter:card" content="summary_large_image">`
  );
  upsertTag(
    /<meta\s+name=["']twitter:title["'][^>]*>/i,
    `<meta name="twitter:title" content="${safeTitle}">`
  );
  upsertTag(
    /<meta\s+name=["']twitter:description["'][^>]*>/i,
    `<meta name="twitter:description" content="${safeDesc}">`
  );
  upsertTag(
    /<meta\s+name=["']twitter:image["'][^>]*>/i,
    `<meta name="twitter:image" content="${safeImage}">`
  );
  upsertTag(
    /<link\s+rel=["']canonical["'][^>]*>/i,
    `<link rel="canonical" href="${safeUrl}">`
  );
  upsertTag(
    /<link\s+rel=["']alternate["'][^>]*type=["']application\/rss\+xml["'][^>]*>/i,
    `<link rel="alternate" type="application/rss+xml" title="عروض وأرصدة الذكاء الاصطناعي — RSS Feed" href="${escapeHtml(cleanBase)}/feed.xml">`
  );
  upsertTag(
    /<script\s+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/i,
    `<script type="application/ld+json" data-deal-jsonld="true">${safeJsonLd}</script>`
  );

  return html;
}

function toCatalogRow(item) {
  const url = typeof item?.url === 'string' ? item.url : '';
  const match = url.match(/deal\/([^/?#]+)/);
  if (!match) return [];
  let slug = match[1];
  try {
    slug = decodeURIComponent(slug);
  } catch {
    /* keep the raw segment */
  }
  if (!slug) return [];
  // Only fields present verbatim in the source. Status, eligibility, pricing,
  // review dates and use cases are intentionally left undefined: the catalog
  // never stated them, so no generator may publish them.
  return [
    {
      slug,
      name: explicitText(item.name) || undefined,
      summary: explicitText(item.description) || undefined,
      url,
    },
  ];
}

export function loadDealsCatalog(rootDir) {
  const candidates = [
    join(rootDir, 'public', 'deals-catalog.json'),
    join(rootDir, 'dist', 'deals-catalog.json'),
    join(rootDir, 'src', 'data', 'deals.json'),
    join(rootDir, 'scripts', 'deals-catalog.json'),
  ];

  for (const filePath of candidates) {
    if (!existsSync(filePath)) continue;
    const raw = JSON.parse(readFileSync(filePath, 'utf8'));
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw.deals)) return raw.deals;
    const items = raw['@graph']?.[1]?.itemListElement;
    if (Array.isArray(items)) return items.flatMap(toCatalogRow);
  }

  throw new Error(
    `لم يتم العثور على ملف بيانات العروض في المسارات المتوقعة: ${candidates.join(', ')}`
  );
}

export async function tryLoadResvg() {
  try {
    const mod = await import('@resvg/resvg-js');
    return mod.Resvg;
  } catch {
    return null;
  }
}

export async function runStaticSeoGeneration({
  rootDir = ROOT,
  distDir = join(ROOT, 'dist'),
  baseUrl = DEFAULT_SITE_URL,
} = {}) {
  const indexHtmlPath = join(distDir, 'index.html');
  if (!existsSync(indexHtmlPath)) {
    console.warn(
      `[SEO Warning] ملف البناء الأساسي غير موجود: ${indexHtmlPath}. سيتم تخطي التوليد الثابت.`
    );
    return;
  }

  const baseHtml = readFileSync(indexHtmlPath, 'utf8');
  const deals = loadDealsCatalog(rootDir);

  writeFileSync(join(distDir, 'sitemap.xml'), generateSitemapXml(deals, baseUrl), 'utf8');
  writeFileSync(join(distDir, 'robots.txt'), generateRobotsTxt(baseUrl), 'utf8');
  writeFileSync(join(distDir, 'feed.xml'), generateRssFeedXml(deals, baseUrl), 'utf8');
  writeFileSync(join(distDir, '404.html'), baseHtml, 'utf8');

  const changelogDir = join(distDir, 'changelog');
  mkdirSync(changelogDir, { recursive: true });
  const changelogSeo = {
    title: 'سجل التغييرات وتحديثات العروض — عروض وأرصدة الذكاء الاصطناعي',
    description:
      'تابع أحدث العروض المضافة، المراجعات الدورية، والتنبيهات قبل انتهاء صلاحية أرصدة الذكاء الاصطناعي.',
    canonicalUrl: `${baseUrl.replace(/\/+$/, '')}/changelog`,
    ogImageUrl: `${baseUrl.replace(/\/+$/, '')}/og-image.png`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'سجل التغييرات وتحديثات العروض',
      url: `${baseUrl.replace(/\/+$/, '')}/changelog`,
    },
  };
  writeFileSync(join(changelogDir, 'index.html'), injectSeoIntoHtml(baseHtml, changelogSeo), 'utf8');

  // A collection page is only published when it can list at least one deal.
  // An empty "best deals for students" page would be a claim with no evidence.
  let publishedAggregations = 0;
  const skippedAggregations = [];
  for (const agg of STATIC_AGGREGATIONS) {
    const matching = deals.filter((deal) => agg.filter(deal));
    if (matching.length === 0) {
      skippedAggregations.push(agg.slug);
      continue;
    }
    const aggDir = join(distDir, agg.slug);
    mkdirSync(aggDir, { recursive: true });
    const aggSeo = buildAggregationSeo(agg, matching, baseUrl);
    writeFileSync(join(aggDir, 'index.html'), injectSeoIntoHtml(baseHtml, aggSeo), 'utf8');
    publishedAggregations += 1;
  }
  if (skippedAggregations.length > 0) {
    console.log(
      `[SEO] صفحات مجموعات لم تُنشر (لا عروض يثبتها المصدر): ${skippedAggregations.join(', ')}`
    );
  }

  const ogDir = join(distDir, 'og');
  mkdirSync(ogDir, { recursive: true });
  const Resvg = await tryLoadResvg();

  let generatedHtmlCount = 0;
  let generatedPngCount = 0;

  for (const deal of deals) {
    if (!deal?.slug || !/^[a-zA-Z0-9_\-\u0600-\u06FF]+$/i.test(deal.slug)) continue;

    const facts = dealFacts(deal);
    const seo = buildDealSeo(deal, baseUrl);
    const dealDir = join(distDir, 'deal', deal.slug);
    mkdirSync(dealDir, { recursive: true });
    writeFileSync(join(dealDir, 'index.html'), injectSeoIntoHtml(baseHtml, seo), 'utf8');
    generatedHtmlCount += 1;

    const svgContent = buildDealOgSvg(deal, facts);
    writeFileSync(join(ogDir, `${deal.slug}.svg`), svgContent, 'utf8');

    if (Resvg) {
      try {
        const resvg = new Resvg(svgContent, { fitTo: { mode: 'width', value: 1200 } });
        writeFileSync(join(ogDir, `${deal.slug}.png`), resvg.render().asPng());
        generatedPngCount += 1;
      } catch (err) {
        console.warn(`[SEO Warning] تعذر تحويل صورة ${deal.slug} إلى PNG:`, err);
      }
    }
  }

  console.log(
    `[SEO] sitemap/robots/feed + ${generatedHtmlCount} صفحة عرض + ${publishedAggregations} صفحة مجموعة` +
      (generatedPngCount > 0 ? ` + ${generatedPngCount} صورة OG.` : ' (OG بصيغة SVG).')
  );
}

const isMain =
  process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (isMain) {
  runStaticSeoGeneration().catch((err) => {
    console.error('[SEO Error]', err);
    process.exit(1);
  });
}

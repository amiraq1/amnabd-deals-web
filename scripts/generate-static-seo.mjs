// scripts/generate-static-seo.mjs
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_SITE_URL =
  process.env.SITE_URL ||
  process.env.VITE_SITE_URL ||
  'https://amnabd.com';

export function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function getDealNumericValue(deal) {
  const benefitValue = deal?.benefits?.[0]?.amount?.value;
  if (typeof benefitValue === 'number' && benefitValue > 0) {
    return benefitValue;
  }

  if (deal?.headline_value) {
    const match = String(deal.headline_value).match(
      /(?:\$|USD|رصيد|بقيمة)\s*(\d[\d,.]*)\s*([kKmM])?|(\d[\d,.]*)\s*([kKmM])?\s*(?:\$|دولار|USD)/i
    );
    if (match) {
      const rawNumber = match[1] ?? match[3];
      const suffix = (match[2] ?? match[4] ?? '').toLowerCase();
      const parsed = parseFloat(rawNumber.replace(/,/g, ''));
      if (!Number.isNaN(parsed)) {
        if (suffix === 'k') return parsed * 1_000;
        if (suffix === 'm') return parsed * 1_000_000;
        return parsed;
      }
    }
  }

  const regular = deal?.pricing?.regular_price ?? deal?.pricing?.original_price;
  const offer = deal?.pricing?.offer_price;
  if (typeof regular === 'number' && regular > 0) {
    return typeof offer === 'number' ? Math.max(0, regular - offer) : regular;
  }

  return 0;
}

export function getAvailabilitySchema(status) {
  switch (status) {
    case 'ending_soon':
      return 'https://schema.org/LimitedAvailability';
    case 'expired':
      return 'https://schema.org/SoldOut';
    case 'active':
    default:
      return 'https://schema.org/InStock';
  }
}

export function buildDealSeo(deal, baseUrl = DEFAULT_SITE_URL) {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const canonicalUrl = `${cleanBase}/deal/${deal.slug}`;
  const ogImageUrl = `${cleanBase}/og/${deal.slug}.png`;

  const displayName = deal.name || deal.title || deal.name_ar || deal.slug;
  const valueText = deal.headline_value ? ` (${deal.headline_value})` : '';
  const title = `${displayName}${valueText} — عروض وأرصدة الذكاء الاصطناعي`;

  const eligibilityNote =
    deal.eligibility?.student_status === 'required' ? ' مخصص للطلاب.' : '';
  const cardNote =
    deal.eligibility?.card_required === 'not_required' ? ' بدون بطاقة ائتمانية.' : '';

  const summary = deal.summary || deal.description_ar || deal.description_en || displayName;
  const description = `${summary}${eligibilityNote}${cardNote} موثّق ومُراجَع من المصدر الرسمي.`;
  const numericValue = getDealNumericValue(deal);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Offer',
    name: displayName,
    description,
    url: canonicalUrl,
    availability: getAvailabilitySchema(deal.status),
    price: deal.pricing?.offer_price ?? 0,
    priceCurrency: deal.pricing?.currency ?? 'USD',
    ...(deal.ends_at ? { priceValidUntil: deal.ends_at } : {}),
    ...(deal.review?.reviewed_on ? { dateModified: deal.review.reviewed_on } : {}),
    ...(deal.provider?.name
      ? {
          offeredBy: {
            '@type': 'Organization',
            name: deal.provider.name,
            ...(deal.provider.url ? { url: deal.provider.url } : {}),
          },
        }
      : {}),
    itemOffered: {
      '@type': 'SoftwareApplication',
      name: deal.provider?.name ?? displayName,
      applicationCategory: 'DeveloperApplication',
      ...(numericValue > 0
        ? {
            offers: {
              '@type': 'Offer',
              description: deal.headline_value ?? `Value up to $${numericValue}`,
            },
          }
        : {}),
    },
  };

  return {
    title,
    description,
    canonicalUrl,
    ogImageUrl,
    jsonLd,
  };
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

  // 1. استبدال أو إضافة <title>
  if (/<title>[\s\S]*?<\/title>/i.test(html)) {
    html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${safeTitle}</title>`);
  } else {
    html = html.replace('</head>', `  <title>${safeTitle}</title>\n</head>`);
  }

  // دالة مساعدة لاستبدال الوسم إن وجد أو إضافته قبل </head> لمنع التكرار
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

export const STATIC_AGGREGATIONS = [
  {
    slug: 'for-students',
    title: 'أفضل عروض وأرصدة الذكاء الاصطناعي للطلاب — موثّقة ومجانية',
    description: 'دليل موثّق بأفضل أرصدة وأدوات الذكاء الاصطناعي المجانية المتاحة رسميًا لطلاب الجامعات والمدارس.',
    heading: 'عروض ومنافع الذكاء الاصطناعي للطلاب',
    filter: (deal) => deal.eligibility?.student_status === 'required',
  },
  {
    slug: 'no-credit-card',
    title: 'عروض ذكاء اصطناعي مجانية بدون بطاقة بنكية (No Credit Card)',
    description: 'تصفح أدوات الذكاء الاصطناعي والأرصدة السحابية المجانية بالكامل التي لا تتطلب بطاقة بنكية للتفعيل.',
    heading: 'أدوات وأرصدة ذكاء اصطناعي بدون بطاقة بنكية',
    filter: (deal) => deal.eligibility?.card_required === 'not_required',
  },
  {
    slug: 'coding',
    title: 'أفضل أدوات ووكلاء الذكاء الاصطناعي للبرمجة والتطوير',
    description: 'دليل عروض وأرصدة أدوات البرمجة بالذكاء الاصطناعي ووكلاء الكود الموثّقة مع روابط التفعيل المباشرة.',
    heading: 'أدوات ومحررات ووكلاء البرمجة بالذكاء الاصطناعي',
    filter: (deal) => {
      const uses = (deal.use_cases || []).map((u) => u.toLowerCase());
      return Boolean(
        uses.includes('برمجة') ||
          uses.includes('coding') ||
          uses.includes('وكلاء ذكاء اصطناعي') ||
          uses.includes('agents') ||
          uses.includes('استضافة') ||
          uses.includes('deployment') ||
          deal.category?.value?.toLowerCase()?.includes('code') ||
          deal.category?.value?.toLowerCase()?.includes('developer')
      );
    },
  },
  {
    slug: 'ending-soon',
    title: 'عروض ذكاء اصطناعي تنتهي قريباً — سارع بالتفعيل قبل الإغلاق',
    description: 'تنبيهات فورية بالعروض والأرصدة المجانية للذكاء الاصطناعي التي تقترب من موعد انتهائها الرسمي.',
    heading: 'عروض ذكاء اصطناعي تنتهي قريباً',
    filter: (deal) => deal.status === 'ending_soon',
  },
];

export function buildAggregationSeo(agg, matchingDeals, baseUrl = DEFAULT_SITE_URL) {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const canonicalUrl = `${cleanBase}/${agg.slug}`;

  const itemListElements = matchingDeals.slice(0, 20).map((deal, index) => {
    const dealName = deal.name_ar || deal.name || deal.slug;
    return {
      '@type': 'ListItem',
      position: index + 1,
      name: dealName,
      url: `${cleanBase}/deal/${deal.slug}`,
      description: deal.headline_value ? `${dealName} (${deal.headline_value})` : dealName,
    };
  });

  return {
    title: `${agg.title} — AMNABD Deals`,
    description: agg.description,
    canonicalUrl,
    ogImageUrl: `${cleanBase}/og-default.png`,
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

export function generateSitemapXml(deals, baseUrl = DEFAULT_SITE_URL) {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const latestReview = deals
    .map((d) => d.review?.reviewed_on)
    .filter(Boolean)
    .sort()
    .reverse()[0];

  const aggregationUrls = STATIC_AGGREGATIONS.map(
    (agg) => `  <url>
    <loc>${escapeHtml(cleanBase)}/${agg.slug}</loc>${
      latestReview ? `\n    <lastmod>${escapeHtml(latestReview)}</lastmod>` : ''
    }
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`
  );

  const urls = [
    `  <url>
    <loc>${escapeHtml(cleanBase)}/</loc>${
      latestReview ? `\n    <lastmod>${escapeHtml(latestReview)}</lastmod>` : ''
    }
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`,
    `  <url>
    <loc>${escapeHtml(cleanBase)}/changelog</loc>${
      latestReview ? `\n    <lastmod>${escapeHtml(latestReview)}</lastmod>` : ''
    }
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`,
    ...aggregationUrls,
  ];

  for (const deal of deals) {
    if (!deal?.slug) continue;
    const priority = deal.status === 'expired' ? '0.4' : '0.8';
    const lastmod = deal.review?.reviewed_on
      ? `\n    <lastmod>${escapeHtml(deal.review.reviewed_on)}</lastmod>`
      : '';

    urls.push(`  <url>
    <loc>${escapeHtml(`${cleanBase}/deal/${deal.slug}`)}</loc>${lastmod}
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>\n`;
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

  // Include active or ending_soon deals only, sorted by newest review
  const feedDeals = [...deals]
    .filter((d) => d?.slug && d.status !== 'expired')
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
      const val = deal.headline_value ? ` (${deal.headline_value})` : '';
      const title = deal.title || deal.name_ar || deal.name || deal.slug;
      const itemTitle = escapeHtml(`${prefix}${title}${val}`);

      const descParts = [
        deal.summary || deal.description_ar || deal.description_en || title,
        deal.eligibility?.student_status === 'required' ? '• مخصص للطلاب' : '',
        deal.eligibility?.card_required === 'not_required' ? '• بدون بطاقة بنكية' : '',
        deal.ends_at ? `• ينتهي في: ${deal.ends_at}` : '',
      ].filter(Boolean);

      const itemDesc = escapeHtml(descParts.join(' '));
      // Composite GUID ensures Telegram RSS bots notify when status changes to ending_soon or review updates
      const guid = escapeHtml(
        `${deal.slug}:${deal.status || 'active'}:${deal.review?.reviewed_on || 'v1'}`
      );
      const pubDate = toRfc822Date(deal.review?.reviewed_on);

      return `    <item>
      <title>${itemTitle}</title>
      <link>${escapeHtml(dealUrl)}</link>
      <guid isPermaLink="false">${guid}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${itemDesc}</description>
    </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>عروض وأرصدة الذكاء الاصطناعي الموثّقة — AMNABD Deals</title>
    <link>${escapeHtml(cleanBase)}/</link>
    <description>أحدث الأرصدة المجانية وأدوات الذكاء الاصطناعي الموثّقة من مصادرها الرسمية</description>
    <language>ar</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${escapeHtml(cleanBase)}/feed.xml" rel="self" type="application/rss+xml" />
${itemsXml}
  </channel>
</rss>\n`;
}

// بناء قالب SVG (1200x630) داعم للعربية (RTL) لتحويله إلى PNG
export function buildDealOgSvg(deal) {
  const provider = escapeHtml(deal.provider?.name || deal.name || 'عرض ذكاء اصطناعي');
  const title = escapeHtml(
    (deal.title || deal.name_ar || deal.name || '').length > 58
      ? `${(deal.title || deal.name_ar || deal.name).slice(0, 55)}...`
      : deal.title || deal.name_ar || deal.name || ''
  );
  const valueBadge = escapeHtml(deal.headline_value || 'عرض مجاني وموثّق');
  const verifiedText = deal.review?.reviewed_on
    ? `موثّق من المصدر الرسمي · آخر مراجعة ${escapeHtml(deal.review.reviewed_on)}`
    : 'موثّق من المصدر الرسمي';

  const studentTag =
    deal.eligibility?.student_status === 'required' ? 'مخصص للطلاب' : 'متاح للجميع';
  const cardTag =
    deal.eligibility?.card_required === 'not_required'
      ? 'بدون بطاقة بنكية'
      : 'يتطلب وسيلة دفع للتفعيل';

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

  <!-- شارة التوثيق أعلى اليمين -->
  <g transform="translate(820, 96)">
    <rect x="0" y="0" width="276" height="46" rx="23" fill="#064e3b" stroke="#10b981" stroke-width="1.5" />
    <text x="138" y="30" fill="#6ee7b7" font-family="Cairo, Tajawal, sans-serif" font-size="18" font-weight="700" text-anchor="middle" direction="rtl">
      ✓ عرض موثّق رسميًا
    </text>
  </g>

  <!-- اسم المزوّد -->
  <text x="1096" y="130" fill="#94a3b8" font-family="Cairo, Tajawal, Inter, sans-serif" font-size="26" font-weight="600" text-anchor="end">
    ${provider}
  </text>

  <!-- القيمة البارزة -->
  <g transform="translate(104, 180)">
    <rect x="0" y="0" width="992" height="110" rx="20" fill="#064e3b" fill-opacity="0.35" stroke="#10b981" stroke-opacity="0.5" stroke-width="2" />
    <text x="956" y="72" fill="#34d399" font-family="Cairo, Tajawal, Inter, sans-serif" font-size="48" font-weight="800" text-anchor="end" direction="rtl">
      ${valueBadge}
    </text>
  </g>

  <!-- عنوان العرض -->
  <text x="1096" y="365" fill="#f8fafc" font-family="Cairo, Tajawal, sans-serif" font-size="40" font-weight="700" text-anchor="end" direction="rtl">
    ${title}
  </text>

  <!-- شروط الأهلية السريعة -->
  <g transform="translate(104, 425)">
    <text x="992" y="32" fill="#cbd5e1" font-family="Cairo, Tajawal, sans-serif" font-size="24" font-weight="500" text-anchor="end" direction="rtl">
      ${escapeHtml(studentTag)}  •  ${escapeHtml(cardTag)}
    </text>
  </g>

  <!-- تذييل البطاقة -->
  <line x1="104" y1="500" x2="1096" y2="500" stroke="#1e293b" stroke-width="2" />
  <text x="1096" y="545" fill="#64748b" font-family="Cairo, Tajawal, sans-serif" font-size="20" text-anchor="end" direction="rtl">
    ${verifiedText}
  </text>
  <text x="104" y="545" fill="#10b981" font-family="Inter, Cairo, sans-serif" font-size="20" font-weight="700" text-anchor="start">
    AMNABD Deals Directory
  </text>
</svg>`;
}

export function loadDealsCatalog(rootDir) {
  const candidates = [
    join(rootDir, 'public', 'deals-catalog.json'),
    join(rootDir, 'dist', 'deals-catalog.json'),
    join(rootDir, 'src', 'data', 'deals.json'),
    join(rootDir, 'scripts', 'deals-catalog.json'),
  ];

  for (const filePath of candidates) {
    if (existsSync(filePath)) {
      const raw = JSON.parse(readFileSync(filePath, 'utf8'));
      if (Array.isArray(raw)) return raw;
      if (Array.isArray(raw.deals)) return raw.deals;
      if (Array.isArray(raw['@graph']?.[1]?.itemListElement)) {
        return raw['@graph'][1].itemListElement.map((item) => {
          const slugMatch = item.url?.match(/deal\/([^/?#]+)/);
          const slug = slugMatch ? slugMatch[1] : '';
          const desc = `${slug} ${item.name || ''} ${item.alternateName || ''} ${item.description || ''}`.toLowerCase();

          const isStudent =
            slug.includes('copilot') ||
            slug.includes('figma') ||
            desc.includes('student') ||
            desc.includes('طالب') ||
            desc.includes('طلاب') ||
            desc.includes('أكاديمي');

          const isNoCard =
            desc.includes('no credit card') ||
            desc.includes('no card') ||
            desc.includes('بدون بطاقة') ||
            desc.includes('بلا بطاقة') ||
            !desc.includes('card is required');

          const isCoding =
            slug.includes('code') ||
            slug.includes('codex') ||
            slug.includes('copilot') ||
            slug.includes('bolt') ||
            slug.includes('docker') ||
            slug.includes('zed') ||
            desc.includes('code') ||
            desc.includes('coding') ||
            desc.includes('developer') ||
            desc.includes('برمج') ||
            desc.includes('api');

          const isEndingSoon = slug === 'beam-vercel-gateway';
          const isExpired = slug === 'bolt-builders-week';
          const status = isExpired ? 'expired' : isEndingSoon ? 'ending_soon' : 'active';

          return {
            slug,
            title: item.name || item.alternateName || slug,
            name: item.name,
            summary: item.description || '',
            description_ar: item.description || '',
            headline_value: item.alternateName?.split('—')?.[1]?.trim() || '',
            status,
            use_cases: isCoding ? ['برمجة', 'coding'] : [],
            review: { reviewed_on: '2026-10-18' },
            eligibility: {
              student_status: isStudent ? 'required' : 'not_required',
              card_required: isNoCard ? 'not_required' : 'required',
            },
            pricing: { offer_price: 0, currency: 'USD' },
          };
        });
      }
    }
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
  rootDir = process.cwd(),
  distDir = join(process.cwd(), 'dist'),
  baseUrl = DEFAULT_SITE_URL,
} = {}) {
  const indexHtmlPath = join(distDir, 'index.html');
  if (!existsSync(indexHtmlPath)) {
    console.warn(`[SEO Warning] ملف البناء الأساسي غير موجود: ${indexHtmlPath}. سيتم تخطي التوليد الثابت.`);
    return;
  }

  const baseHtml = readFileSync(indexHtmlPath, 'utf8');
  const deals = loadDealsCatalog(rootDir);

  // 1. توليد sitemap.xml و robots.txt و feed.xml و 404.html (لدعم GitHub Pages SPA Fallback)
  writeFileSync(join(distDir, 'sitemap.xml'), generateSitemapXml(deals, baseUrl), 'utf8');
  writeFileSync(join(distDir, 'robots.txt'), generateRobotsTxt(baseUrl), 'utf8');
  writeFileSync(join(distDir, 'feed.xml'), generateRssFeedXml(deals, baseUrl), 'utf8');
  writeFileSync(join(distDir, '404.html'), baseHtml, 'utf8');

  // توليد صفحة HTML ثابتة لمسار /changelog
  const changelogDir = join(distDir, 'changelog');
  mkdirSync(changelogDir, { recursive: true });
  const changelogSeo = {
    title: 'سجل التغييرات وتحديثات العروض — عروض وأرصدة الذكاء الاصطناعي',
    description: 'تابع أحدث العروض المضافة، المراجعات الدورية، والتنبيهات قبل انتهاء صلاحية أرصدة الذكاء الاصطناعي.',
    canonicalUrl: `${baseUrl.replace(/\/+$/, '')}/changelog`,
    ogImageUrl: `${baseUrl.replace(/\/+$/, '')}/og-default.png`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'سجل التغييرات وتحديثات العروض',
      url: `${baseUrl.replace(/\/+$/, '')}/changelog`,
    },
  };
  writeFileSync(
    join(changelogDir, 'index.html'),
    injectSeoIntoHtml(baseHtml, changelogSeo),
    'utf8'
  );

  // توليد الصفحات التجميعية الثابتة (/for-students, /no-credit-card, /coding, /ending-soon)
  let generatedAggCount = 0;
  for (const agg of STATIC_AGGREGATIONS) {
    const matching = deals.filter(agg.filter);
    const aggDir = join(distDir, agg.slug);
    mkdirSync(aggDir, { recursive: true });
    const aggSeo = buildAggregationSeo(agg, matching, baseUrl);
    writeFileSync(join(aggDir, 'index.html'), injectSeoIntoHtml(baseHtml, aggSeo), 'utf8');
    generatedAggCount += 1;
  }
  console.log(`[SEO] صفحات المجموعات الثابتة: ${generatedAggCount}`);

  // 2. تجهيز مجلد صور OG ومحرّك التحويل
  const ogDir = join(distDir, 'og');
  mkdirSync(ogDir, { recursive: true });
  const Resvg = await tryLoadResvg();

  let generatedHtmlCount = 0;
  let generatedPngCount = 0;

  for (const deal of deals) {
    if (!deal?.slug || !/^[a-zA-Z0-9_\-\u0600-\u06FF]+$/i.test(deal.slug)) continue;

    // إنشاء صفحة HTML ثابتة للعرض
    const seo = buildDealSeo(deal, baseUrl);
    const dealDir = join(distDir, 'deal', deal.slug);
    mkdirSync(dealDir, { recursive: true });

    const dealHtml = injectSeoIntoHtml(baseHtml, seo);
    writeFileSync(join(dealDir, 'index.html'), dealHtml, 'utf8');
    generatedHtmlCount += 1;

    // إنشاء صورة OG (SVG + PNG)
    const svgContent = buildDealOgSvg(deal);
    writeFileSync(join(ogDir, `${deal.slug}.svg`), svgContent, 'utf8');

    if (Resvg) {
      try {
        const resvg = new Resvg(svgContent, {
          fitTo: { mode: 'width', value: 1200 },
        });
        const pngBuffer = resvg.render().asPng();
        writeFileSync(join(ogDir, `${deal.slug}.png`), pngBuffer);
        generatedPngCount += 1;
      } catch (err) {
        console.warn(`[SEO Warning] تعذر تحويل صورة ${deal.slug} إلى PNG:`, err);
      }
    }
  }

  console.log(
    `[SEO] تم توليد sitemap.xml و robots.txt و ${generatedHtmlCount} صفحة عرض ثابتة` +
      (generatedPngCount > 0
        ? ` و ${generatedPngCount} صورة OG بصيغة PNG.`
        : ` و ${generatedHtmlCount} بطاقة OG بصيغة SVG.`)
  );
}

// تشغيل السكربت عند استدعائه مباشرة من سطر الأوامر
const isMain =
  process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (isMain) {
  runStaticSeoGeneration().catch((err) => {
    console.error('[SEO Error]', err);
    process.exit(1);
  });
}

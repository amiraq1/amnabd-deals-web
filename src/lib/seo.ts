import type { Deal } from '@/types';
import { getDealDisplayName } from './dealMetadata.js';
import { getDealNumericValue } from './dealSort.js';

export interface DealSeoMetadata {
  title: string;
  description: string;
  canonicalUrl: string;
  ogImageUrl: string;
  jsonLd: Record<string, unknown>;
}

export const DEFAULT_SITE_URL = 'https://amnabd.com';

export function getAvailabilitySchema(status?: Deal['status']): string {
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

export function buildDealSeo(deal: Deal, baseUrl = DEFAULT_SITE_URL): DealSeoMetadata {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const canonicalUrl = `${cleanBase}/deal/${deal.slug}`;
  const ogImageUrl = `${cleanBase}/og/${deal.slug}.png`;

  const displayName = getDealDisplayName(deal);
  const valueText = deal.headline_value ? ` (${deal.headline_value})` : '';
  const title = `${displayName}${valueText} — عروض وأرصدة الذكاء الاصطناعي`;

  const eligibilityNote =
    deal.eligibility?.student_status === 'required' ? ' مخصص للطلاب.' : '';
  const cardNote =
    deal.eligibility?.card_required === 'not_required' ? ' بدون بطاقة ائتمانية.' : '';

  const summary = deal.description_ar || deal.description_en || displayName;
  const description = `${summary}${eligibilityNote}${cardNote} موثّق ومُراجَع من المصدر الرسمي.`;

  const numericValue = getDealNumericValue(deal);

  const jsonLd: Record<string, unknown> = {
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
    itemOffered: {
      '@type': 'SoftwareApplication',
      name: displayName,
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

export function generateSitemapXml(deals: Deal[], baseUrl = DEFAULT_SITE_URL): string {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const latestReview = deals
    .map((d) => d.review?.reviewed_on)
    .filter((d): d is string => typeof d === 'string' && d.length > 0)
    .sort()
    .reverse()[0];

  const urls: string[] = [
    `  <url>
    <loc>${cleanBase}/</loc>${latestReview ? `\n    <lastmod>${latestReview}</lastmod>` : ''}
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`,
  ];

  for (const deal of deals) {
    const priority = deal.status === 'expired' ? '0.4' : '0.8';
    const lastmod = deal.review?.reviewed_on
      ? `\n    <lastmod>${deal.review.reviewed_on}</lastmod>`
      : '';

    urls.push(`  <url>
    <loc>${cleanBase}/deal/${deal.slug}</loc>${lastmod}
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
}

function upsertMeta(
  selector: string,
  attrName: 'name' | 'property',
  attrValue: string,
  content: string
): void {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function applyDealSeoToDocument(seo: DealSeoMetadata): void {
  if (typeof document === 'undefined') return;

  document.title = seo.title;
  upsertMeta('meta[name="description"]', 'name', 'description', seo.description);
  upsertMeta('meta[property="og:title"]', 'property', 'og:title', seo.title);
  upsertMeta('meta[property="og:description"]', 'property', 'og:description', seo.description);
  upsertMeta('meta[property="og:url"]', 'property', 'og:url', seo.canonicalUrl);
  upsertMeta('meta[property="og:image"]', 'property', 'og:image', seo.ogImageUrl);
  upsertMeta('meta[property="og:type"]', 'property', 'og:type', 'website');
  upsertMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
  upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', seo.title);
  upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', seo.description);
  upsertMeta('meta[name="twitter:image"]', 'name', 'twitter:image', seo.ogImageUrl);

  // Update or insert canonical link
  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', seo.canonicalUrl);

  // Update or insert JSON-LD
  let script = document.head.querySelector<HTMLScriptElement>('script[data-deal-jsonld="true"]');
  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-deal-jsonld', 'true');
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(seo.jsonLd);
}

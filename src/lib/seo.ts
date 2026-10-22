import type { DealSeoMetadata } from './seoFacts.js';

// The claim logic itself lives in `seoFacts.ts` so the build-time generator and
// the browser cannot drift apart. This module only applies it to the document.
export {
  DEFAULT_SITE_URL,
  buildDealSeo,
  dealFacts,
  dealDisplayName,
  getAvailabilitySchema,
  generateSitemapXml,
  nonEmptyAggregations,
} from './seoFacts.js';
export type { DealFacts, DealSeoMetadata } from './seoFacts.js';

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

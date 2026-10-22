import assert from 'node:assert/strict';
import { test } from 'node:test';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const { buildDealSeo, getAvailabilitySchema, generateSitemapXml } = await import(
  pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, 'src/lib/seo.js'))
);

const { routePath, parseLocationRoute, parseHash, routeHash } = await import(
  pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, 'src/lib/routes.js'))
);

test('getAvailabilitySchema maps deal statuses correctly to schema.org', () => {
  assert.equal(getAvailabilitySchema('active'), 'https://schema.org/InStock');
  assert.equal(getAvailabilitySchema('ending_soon'), 'https://schema.org/LimitedAvailability');
  assert.equal(getAvailabilitySchema('expired'), 'https://schema.org/SoldOut');
  // L-04: a missing or unverified status is not an availability claim.
  assert.equal(getAvailabilitySchema(undefined), null);
  assert.equal(getAvailabilitySchema('verifying'), null);
});

test('buildDealSeo produces valid metadata, canonical URL, and JSON-LD schema', () => {
  const deal = {
    id: 'test-1',
    slug: 'cursor-pro',
    name: 'Cursor',
    name_ar: 'كيرسور',
    name_en: 'Cursor',
    description_ar: 'محرر برمجة ذكي يدعم وكلاء الذكاء الاصطناعي.',
    description_en: 'AI code editor with smart agents.',
    headline_value: '$100 رصيد',
    status: 'ending_soon',
    ends_at: '2026-10-31T23:59:59Z',
    eligibility: {
      student_status: 'required',
      card_required: 'not_required',
    },
    pricing: {
      offer_price: 0,
      currency: 'USD',
    },
    review: {
      reviewed_on: '2026-10-18',
    },
  };

  const seo = buildDealSeo(deal, 'https://amnabd.com');

  assert.equal(seo.canonicalUrl, 'https://amnabd.com/deal/cursor-pro');
  assert.equal(seo.ogImageUrl, 'https://amnabd.com/og/cursor-pro.png');
  assert.match(seo.title, /Cursor/);
  assert.match(seo.title, /\(\$100 رصيد\)/);
  assert.match(seo.description, /محرر برمجة ذكي/);
  assert.match(seo.description, /مخصص للطلاب/);
  assert.match(seo.description, /بدون بطاقة ائتمانية/);

  // Check JSON-LD
  assert.equal(seo.jsonLd['@context'], 'https://schema.org');
  assert.equal(seo.jsonLd['@type'], 'Offer');
  assert.equal(seo.jsonLd['availability'], 'https://schema.org/LimitedAvailability');
  assert.equal(seo.jsonLd['price'], 0);
  assert.equal(seo.jsonLd['priceCurrency'], 'USD');
  assert.equal(seo.jsonLd['priceValidUntil'], '2026-10-31T23:59:59Z');
  assert.equal(seo.jsonLd['dateModified'], '2026-10-18');
  assert.equal(seo.jsonLd['itemOffered']?.['@type'], 'SoftwareApplication');
  assert.equal(seo.jsonLd['itemOffered']?.['name'], 'Cursor');
});

test('generateSitemapXml builds valid XML with prioritization and dates', () => {
  const deals = [
    {
      slug: 'active-deal',
      status: 'active',
      review: { reviewed_on: '2026-10-19' },
    },
    {
      slug: 'expired-deal',
      status: 'expired',
      review: { reviewed_on: '2026-10-10' },
    },
  ];

  const xml = generateSitemapXml(deals, 'https://amnabd.com');

  assert.match(xml, /<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(xml, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  assert.match(xml, /<loc>https:\/\/amnabd\.com\/<\/loc>/);
  assert.match(xml, /<lastmod>2026-10-19<\/lastmod>/);
  assert.match(xml, /<priority>1\.0<\/priority>/);

  // Active deal
  assert.match(xml, /<loc>https:\/\/amnabd\.com\/deal\/active-deal<\/loc>/);
  assert.match(xml, /<priority>0\.8<\/priority>/);

  // Expired deal has reduced priority
  assert.match(xml, /<loc>https:\/\/amnabd\.com\/deal\/expired-deal<\/loc>/);
  assert.match(xml, /<priority>0\.4<\/priority>/);
});

test('routes.ts supports both clean paths and legacy hash routes', () => {
  assert.equal(routePath({ name: 'home' }), '/');
  assert.equal(routePath({ name: 'deal', slug: 'bolt' }), '/deal/bolt');
  assert.equal(routePath({ name: 'guide' }), '/guide');
  assert.equal(routePath({ name: 'favorites' }), '/favorites');

  assert.deepEqual(parseLocationRoute('/deal/bolt'), { name: 'deal', slug: 'bolt' });
  assert.deepEqual(parseLocationRoute('/', '#/deal/bolt'), { name: 'deal', slug: 'bolt' });
  assert.deepEqual(parseLocationRoute('/guide'), { name: 'guide' });
  assert.deepEqual(parseLocationRoute('/favorites'), { name: 'favorites' });
  assert.deepEqual(parseLocationRoute('/'), { name: 'home' });

  // Legacy routeHash & parseHash still 100% functional
  assert.equal(routeHash({ name: 'deal', slug: 'bolt' }), '#/deal/bolt');
  assert.deepEqual(parseHash('#/deal/bolt'), { name: 'deal', slug: 'bolt' });
});

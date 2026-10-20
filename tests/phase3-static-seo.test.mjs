import assert from 'node:assert/strict';
import { test } from 'node:test';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const {
  buildDealSeo,
  buildDealOgSvg,
  generateSitemapXml,
  generateRobotsTxt,
  injectSeoIntoHtml,
  escapeHtml,
  loadDealsCatalog,
} = await import(pathToFileURL(join(process.cwd(), 'scripts/generate-static-seo.mjs')));

const sampleBaseHtml = `<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <title>العنوان العام للموقع</title>
    <meta name="description" content="الوصف العام للموقع">
    <meta property="og:title" content="العنوان العام">
  </head>
  <body><div id="root"></div></body>
</html>`;

const sampleDeal = {
  slug: 'bolt-builders-week',
  title: 'رصيد مجاني من Bolt "للمطورين"',
  summary: 'احصل على رصيد سحابي لبناء التطبيقات.',
  headline_value: '$100k',
  status: 'active',
  review: { reviewed_on: '2026-10-18' },
  eligibility: { student_status: 'not_required', card_required: 'not_required' },
  provider: { name: 'Bolt', url: 'https://bolt.new' },
};

test('escapeHtml properly escapes special HTML characters', () => {
  assert.equal(escapeHtml('<script>"alert(\'xss\') & check"</script>'), '&lt;script&gt;&quot;alert(&#39;xss&#39;) &amp; check&quot;&lt;/script&gt;');
});

test('injectSeoIntoHtml replaces existing title and meta tags without duplication', () => {
  const seo = buildDealSeo(sampleDeal, 'https://deals.example.com');
  const output = injectSeoIntoHtml(sampleBaseHtml, seo);

  // Assert single instances (no duplication)
  const titleMatches = output.match(/<title>[\s\S]*?<\/title>/g);
  assert.equal(titleMatches?.length, 1);

  const descMatches = output.match(/name=["']description["']/g);
  assert.equal(descMatches?.length, 1);

  const ogTitleMatches = output.match(/property=["']og:title["']/g);
  assert.equal(ogTitleMatches?.length, 1);

  // Assert escaped quotes
  assert.ok(output.includes('&quot;للمطورين&quot;'));
  assert.ok(output.includes('https://deals.example.com/og/bolt-builders-week.png'));
  assert.ok(output.includes('application/ld+json'));
  assert.ok(output.includes('data-deal-jsonld="true"'));
});

test('generateSitemapXml builds valid XML with clean URLs and lastmod', () => {
  const sitemap = generateSitemapXml([sampleDeal], 'https://deals.example.com');
  assert.ok(sitemap.includes('<loc>https://deals.example.com/deal/bolt-builders-week</loc>'));
  assert.ok(sitemap.includes('<lastmod>2026-10-18</lastmod>'));
  assert.ok(sitemap.includes('<priority>0.8</priority>'));
});

test('generateRobotsTxt outputs valid robots.txt referencing sitemap', () => {
  const robots = generateRobotsTxt('https://deals.example.com');
  assert.ok(robots.includes('User-agent: *'));
  assert.ok(robots.includes('Allow: /'));
  assert.ok(robots.includes('Sitemap: https://deals.example.com/sitemap.xml'));
});

test('buildDealOgSvg outputs 1200x630 SVG with RTL and deal values', () => {
  const svg = buildDealOgSvg(sampleDeal);
  assert.ok(svg.includes('width="1200" height="630"'));
  assert.ok(svg.includes('viewBox="0 0 1200 630"'));
  assert.ok(svg.includes('$100k'));
  assert.ok(svg.includes('direction="rtl"'));
});

test('loadDealsCatalog successfully parses deals from scripts/deals-catalog.json', () => {
  const catalog = loadDealsCatalog(process.cwd());
  assert.ok(Array.isArray(catalog));
  assert.ok(catalog.length >= 27);
  const bolt = catalog.find((d) => d.slug.includes('bolt'));
  assert.ok(bolt);
  assert.ok(bolt.slug);
});

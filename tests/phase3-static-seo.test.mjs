import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { test } from 'node:test';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const {
  buildDealSeo,
  buildDealOgSvg,
  generateSitemapXml,
  generateRobotsTxt,
  generateLlmsTxt,
  runStaticSeoGeneration,
  injectSeoIntoHtml,
  buildNoIndexAppShell,
  buildNotFoundPage,
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

const sampleHomepageHtml = sampleBaseHtml.replace(
  '</head>',
  `  <link rel="canonical" href="https://deals.example.com/">
  <script type="application/ld+json">{"@type":"ItemList","itemListElement":[{"position":1}]}</script>
</head>`
);

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

test('comparison app shell returns a noindex route without homepage SEO claims', () => {
  const homepageHtml = sampleBaseHtml.replace(
    '</head>',
    '<link rel="canonical" href="https://amnabd.com/">' +
      '<meta property="og:description" content="homepage claim">' +
      '<meta name="twitter:title" content="homepage title">' +
      '<script type="application/ld+json">{"@type":"ItemList"}</script></head>'
  );
  const shell = buildNoIndexAppShell(homepageHtml);
  assert.match(shell, /<meta name="robots" content="noindex,follow">/);
  assert.match(shell, /<title>AMNABD Deals<\/title>/);
  assert.match(shell, /<div id="root"><\/div>/);
  assert.doesNotMatch(shell, /name="description"|rel="canonical"|property="og:|name="twitter:|application\/ld\+json|homepage claim|homepage title/);
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

test('F-05: postbuild generates llms.txt from exactly the static deal pages', async () => {
  const deals = [
    sampleDeal,
    { slug: 'second-deal', name_ar: 'العرض الثاني', description_ar: 'وصف متاح من المصدر.' },
  ];
  const direct = generateLlmsTxt(
    [...deals, { slug: 'invalid/slug', name_ar: 'مسار غير صالح' }],
    'https://deals.example.com'
  );
  assert.match(direct, /https:\/\/deals\.example\.com\/deal\/bolt-builders-week/);
  assert.match(direct, /https:\/\/deals\.example\.com\/deal\/second-deal/);
  assert.doesNotMatch(direct, /invalid\/slug|#\/deal|\]\([^)]*[?#]/);

  const rootDir = mkdtempSync(join(tmpdir(), 'amnabd-llms-'));
  const distDir = join(rootDir, 'dist');
  try {
    mkdirSync(join(rootDir, 'scripts'), { recursive: true });
    mkdirSync(distDir, { recursive: true });
    writeFileSync(join(rootDir, 'scripts', 'deals-catalog.json'), JSON.stringify(deals));
    writeFileSync(join(distDir, 'index.html'), sampleHomepageHtml);
    writeFileSync(join(distDir, 'llms.txt'), 'stale hash route');

    await runStaticSeoGeneration({
      rootDir,
      distDir,
      baseUrl: 'https://deals.example.com',
      databaseSlugs: deals.map((deal) => deal.slug),
      databaseDealStates: [
        { slug: 'bolt-builders-week', status: 'expired', ends_at: '2026-10-19T06:59:00Z' },
        { slug: 'second-deal', status: null, ends_at: null },
      ],
    });

    const generated = readFileSync(join(distDir, 'llms.txt'), 'utf8');
    const pageSlugs = readdirSync(join(distDir, 'deal'));
    const llmsSlugs = [...generated.matchAll(/\]\(https:\/\/deals\.example\.com\/deal\/([^)?#]+)\)/g)].map(
      (match) => match[1]
    );
    assert.deepEqual(llmsSlugs.sort(), pageSlugs.sort());
    assert.equal(llmsSlugs.length, 2);
    assert.doesNotMatch(generated, /#\/deal|stale hash route/);
    const feed = readFileSync(join(distDir, 'feed.xml'), 'utf8');
    assert.doesNotMatch(feed, /bolt-builders-week/);
    assert.match(feed, /second-deal/);
    assert.equal(readFileSync(join(distDir, 'ending-soon', 'index.html'), 'utf8'), sampleHomepageHtml);
    const comparisonShell = readFileSync(join(distDir, 'compare', 'index.html'), 'utf8');
    assert.equal(comparisonShell, buildNoIndexAppShell(sampleHomepageHtml));
    assert.match(comparisonShell, /name="robots" content="noindex,follow"/);
    assert.doesNotMatch(comparisonShell, /name="description"|property="og:|application\/ld\+json/);
    const notFoundHtml = readFileSync(join(distDir, '404.html'), 'utf8');
    assert.equal(notFoundHtml, buildNotFoundPage(sampleHomepageHtml, 'https://deals.example.com'));
    assert.match(notFoundHtml, /<meta name="robots" content="noindex,follow">/);
    assert.match(notFoundHtml, /<link rel="canonical" href="https:\/\/deals\.example\.com\/404">/);
    assert.equal((notFoundHtml.match(/<link\s+rel=["']canonical["']/gi) ?? []).length, 1);
    assert.doesNotMatch(notFoundHtml, /href="https:\/\/deals\.example\.com\/"/);
    assert.doesNotMatch(notFoundHtml, /ItemList|application\/ld\+json/i);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

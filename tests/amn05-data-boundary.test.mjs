import assert from 'node:assert/strict';
import { test } from 'node:test';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const { validateDeals } = await import(
  pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, 'src/lib/validate.js'))
);
const { generateSitemapXml } = await import(
  pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, 'src/lib/seoFacts.js'))
);

const deal = (changes = {}) => ({
  id: 'real-id',
  slug: 'real-slug',
  name_ar: 'اسم حقيقي',
  name_en: 'Actual name',
  ...changes,
});

test('unsafe official source URLs are dropped at the data boundary', () => {
  const report = validateDeals([
    deal({
      official_sources: [
        { url: 'https://user:pass@evil.example/x', title: 'credentials', claims: [] },
        { url: 'https://127.0.0.1/x', title: 'loopback', claims: [] },
        { url: 'http://insecure.example/x', title: 'plain http', claims: [] },
        { url: 'https://official.example/deal', title: 'valid', claims: [] },
      ],
    }),
  ]);
  assert.equal(report.values.length, 1);
  const sources = report.values[0].official_sources;
  assert.deepEqual(
    sources.map((source) => source.url),
    ['https://official.example/deal']
  );
});

test('sitemap escapes XML special characters in loc and lastmod', () => {
  const xml = generateSitemapXml(
    [
      deal({
        slug: 'a&b<c>',
        status: 'active',
        review: { reviewed_on: '2026-01-01<&>' },
      }),
    ],
    'https://amnabd.com'
  );
  assert.doesNotMatch(xml, /a&b<c>/);
  assert.match(xml, /a&amp;b&lt;c&gt;/);
  assert.match(xml, /2026-01-01&lt;&amp;&gt;/);
});

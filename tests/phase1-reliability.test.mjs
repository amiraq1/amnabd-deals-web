import assert from 'node:assert/strict';
import { test } from 'node:test';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

const load = (name) => import(pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, `src/lib/${name}.js`)).href);
const { getTimingState } = await load('dealTiming');
const { isVerifiedReview } = await load('verification');
const { evidenceStatus } = await load('evidence');
const { buildDealSeo } = await load('seoFacts');
const { AGGREGATIONS } = await load('aggregations');
const { runStaticSeoGeneration, generateRssFeedXml, buildHomeItemList, buildDealOgSvg } = await import(pathToFileURL(join(process.cwd(), 'scripts/generate-static-seo.mjs')).href);

const now = new Date('2026-11-15T12:00:00Z');

test('review and evidence are independent, including legacy and conflicting values', () => {
  const reviews = [
    [{ verdict: 'verified', verification_status: 'partial' }, true, 'partial'],
    [{ verdict: 'verified', verification_status: 'unsupported' }, true, 'unsupported'],
    [{ verification_status: 'verified' }, true, 'unknown'],
    [{ verification_status: 'supported', verified_on: '2026-11-01' }, true, 'supported'],
    [{ verdict: 'needs_review', verification_status: 'supported', verified_on: '2026-11-01' }, false, 'supported'],
    [{ verified_on: '2026-02-30' }, false, 'unknown'],
  ];
  for (const [review, reviewed, support] of reviews) {
    assert.equal(isVerifiedReview(review), reviewed);
    assert.equal(evidenceStatus(review.verification_status), support);
    const seo = buildDealSeo({ slug: 'test', review }, 'https://example.com', now);
    assert.equal(seo.description.includes('تمت مراجعة السجل'), reviewed);
    assert.equal(buildDealOgSvg({ slug: 'test', review }).includes('تمت مراجعة السجل'), reviewed);
    assert.doesNotMatch(seo.description, /موثّق من المصدر/);
  }
});

test('coding uses explicit normalized aliases without substring false positives', () => {
  for (const value of ['coding', 'CODE', 'developer', ' برمجة وتطوير '])
    assert.equal(AGGREGATIONS.coding.filter({ category: { value }, use_cases: [] }), true, value);
  for (const value of ['برمجة', 'تطوير', 'coding', 'agents', 'استضافة'])
    assert.equal(AGGREGATIONS.coding.filter({ category: { value: 'other' }, use_cases: [value] }), true, value);
  for (const value of ['barcode', 'decoder', 'unknown'])
    assert.equal(AGGREGATIONS.coding.filter({ category: { value }, use_cases: [] }), false, value);
});

test('time boundaries agree between UI timing, JSON-LD, RSS and the home list', () => {
  const ended = { slug: 'ended', status: 'active', ends_at: '2026-11-15T11:59:00Z' };
  const soon = { slug: 'soon', status: 'active', ends_at: '2026-11-16T12:00:00Z' };
  assert.equal(getTimingState(ended, now).offer.state, 'expired');
  assert.equal(buildDealSeo(ended, 'https://example.com', now).jsonLd.availability, 'https://schema.org/SoldOut');
  assert.equal(buildDealSeo({ slug: 'unknown', status: 'verifying' }, 'https://example.com', now).jsonLd.availability, undefined);
  assert.equal(buildDealSeo(soon, 'https://example.com', now).jsonLd.availability, 'https://schema.org/LimitedAvailability');
  assert.equal(buildDealSeo({ status: 'active', ends_at: 'invalid' }, 'https://example.com', now).jsonLd.availability, undefined);
  const feed = generateRssFeedXml([ended, soon], 'https://example.com', now);
  assert.doesNotMatch(feed, /\/deal\/ended/);
  assert.match(feed, /ينتهي قريبًا/);
  assert.deepEqual(buildHomeItemList([ended, soon], 'https://example.com', now).itemListElement.map((item) => item.url), ['https://example.com/deal/soon']);
  assert.equal(getTimingState({ status: 'active', ends_at: '2026-11-14' }, new Date('2026-11-15T11:59:59Z')).offer.state, 'ending_soon');
  assert.equal(buildDealSeo({ status: 'active', ends_at: '2026-11-14' }, 'https://example.com', now).jsonLd.availability, 'https://schema.org/SoldOut');
});

test('build uses live expiry for HTML, RSS, sitemap and static collections; route shells carry their own metadata', async () => {
  const rootDir = mkdtempSync(join(tmpdir(), 'amn-phase1-'));
  const distDir = join(rootDir, 'dist');
  try {
    mkdirSync(join(rootDir, 'scripts'), { recursive: true });
    mkdirSync(distDir);
    const rows = [{ slug: 'ended', name: 'Ended', status: 'active', category: { value: 'coding' }, ends_at: '2027-01-01T00:00:00Z' }, { slug: 'soon', name: 'Soon', status: 'active', category: { value: 'coding' } }];
    writeFileSync(join(rootDir, 'scripts', 'deals-catalog.json'), JSON.stringify(rows));
    writeFileSync(join(distDir, 'index.html'), '<html><head><title>Home</title><link rel="canonical" href="https://example.com/"><script type="application/ld+json">{"@type":"ItemList","numberOfItems":0,"itemListElement":[]}</script></head><body><div id="root"></div></body></html>');
    await runStaticSeoGeneration({ rootDir, distDir, baseUrl: 'https://example.com', referenceNow: now, databaseSlugs: ['ended', 'soon'], databaseDealStates: [
      { slug: 'ended', status: 'active', ends_at: '2026-11-15T11:59:00Z' },
      { slug: 'soon', status: 'active', ends_at: '2026-11-16T12:00:00Z' },
    ] });
    const html = readFileSync(join(distDir, 'deal', 'ended', 'index.html'), 'utf8');
    assert.match(html, /schema.org\/SoldOut/);
    assert.doesNotMatch(readFileSync(join(distDir, 'feed.xml'), 'utf8'), /\/deal\/ended/);
    assert.doesNotMatch(readFileSync(join(distDir, 'sitemap.xml'), 'utf8'), /\/deal\/ended/);
    const coding = readFileSync(join(distDir, 'coding', 'index.html'), 'utf8');
    assert.match(coding, /"numberOfItems":1/);
    for (const path of ['guide', 'favorites']) {
      const flat = readFileSync(join(distDir, `${path}.html`), 'utf8');
      assert.equal(flat, readFileSync(join(distDir, path, 'index.html'), 'utf8'));
      assert.match(flat, new RegExp(`rel="canonical" href="https://example.com/${path}"`));
      assert.doesNotMatch(flat, /href="https:\/\/example.com\/404"/);
      assert.equal(/name="robots" content="noindex,follow"/.test(flat), path === 'favorites');
    }
  } finally { rmSync(rootDir, { recursive: true, force: true }); }
});

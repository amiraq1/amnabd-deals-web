// PR-1: truthful claims. Each test pins one finding from the audit:
// C-01, H-03, H-04, M-12 (data side), L-04, M-01, L-09.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';

const built = (rel) => pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, rel));

const { safeUrl, isSafeUrl } = await import(built('src/lib/safeUrl.js'));
const { getDealHeadlineValue, getDealKeyCondition } = await import(
  built('src/lib/dealMetadata.js')
);
const { offerTimingLabel } = await import(built('src/lib/evidence.js'));
const { buildDealSeo, dealFacts, getAvailabilitySchema, generateSitemapXml } = await import(
  built('src/lib/seoFacts.js')
);
const staticSeo = await import(
  pathToFileURL(join(process.cwd(), 'scripts/generate-static-seo.mjs'))
);

// A catalog entry as it really exists in scripts/deals-catalog.json:
// name, alternateName, url and description only — no eligibility, no review,
// no pricing, no status. Anything else the generator emits would be invented.
const bareItem = {
  '@type': 'ListItem',
  position: 1,
  name: 'Docker — $250 Cloud Sandbox compute credit',
  alternateName: 'Docker — رصيد حوسبة Cloud Sandbox بقيمة $250',
  url: 'https://amnabd.com/#/deal/docker-cloud-sandbox-250',
  description: 'A card is required and charged only for usage beyond the credit.',
};

function catalogRoot(items) {
  const root = mkdtempSync(join(tmpdir(), 'amnabd-catalog-'));
  mkdirSync(join(root, 'public'), { recursive: true });
  writeFileSync(
    join(root, 'public', 'deals-catalog.json'),
    JSON.stringify({ '@context': 'https://schema.org', '@graph': [
      { '@type': 'WebSite', name: 'AMNABD Deals' },
      { '@type': 'ItemList', itemListElement: items },
    ] })
  );
  return root;
}

// --- M-01 -----------------------------------------------------------------
test('M-01: plain HTTP sources are not treated as official links', () => {
  assert.equal(isSafeUrl('http://example.com/deal'), false);
  assert.equal(safeUrl('http://example.com/deal'), null);
  assert.equal(safeUrl('https://example.com/deal'), 'https://example.com/deal');
  assert.equal(safeUrl('javascript:alert(1)'), null);
});

// --- H-04 -----------------------------------------------------------------
test('H-04: no headline is invented when the record has no value', () => {
  assert.equal(getDealHeadlineValue({ slug: 'x', name_ar: 'x', name_en: 'x' }), null);
  assert.equal(
    getDealHeadlineValue({ slug: 'x', name_ar: 'x', name_en: 'x', benefits: [] }),
    null
  );
  // An explicit value is still surfaced.
  assert.equal(
    getDealHeadlineValue({ slug: 'x', name_ar: 'x', name_en: 'x', headline_value: '200$' }),
    '200$'
  );
});

test('H-04: a zero amount is not a benefit and produces no headline', () => {
  const zero = {
    slug: 'x',
    name_ar: 'x',
    name_en: 'x',
    benefits: [{ type: 'credits', amount: { value: 0, currency: 'USD', unit: '$' } }],
  };
  // "0$ رصيد مجاني" announced a credit the record does not grant.
  assert.equal(getDealHeadlineValue(zero, 'ar'), null);
  assert.equal(getDealHeadlineValue(zero, 'en'), null);
});

test('C-01: a required card is stated, not left to be assumed', () => {
  assert.equal(
    getDealKeyCondition({ slug: 'x', eligibility: { card_required: 'required' } }, 'ar'),
    'تتطلب بطاقة ائتمان'
  );
  assert.equal(
    getDealKeyCondition({ slug: 'x', eligibility: { card_required: 'required' } }, 'en'),
    'Credit card required'
  );
  // Unknown stays silent rather than implying either answer.
  assert.equal(getDealKeyCondition({ slug: 'x', eligibility: {} }, 'ar'), null);
});

test('H-02: the detail page label follows the computed timing, not raw offer_status', () => {
  const expiredByDate = { state: 'expired', reason: 'ends_at', endsAt: '2026-01-01', expiresAt: 0, daysLeft: -1 };
  assert.equal(offerTimingLabel(expiredByDate, 'active', 'ar'), 'انتهى حسب تاريخ الانتهاء المسجّل');
  assert.equal(offerTimingLabel(expiredByDate, 'active', 'en'), 'Ended per the recorded end date');

  const expiredByStatus = { state: 'expired', reason: 'status', endsAt: null, expiresAt: null, daysLeft: null };
  assert.equal(offerTimingLabel(expiredByStatus, 'active', 'ar'), 'منتهٍ وفق المراجعة');

  const endingSoon = { state: 'ending_soon', reason: 'ends_at', endsAt: '2026-01-01', expiresAt: 0, daysLeft: 3 };
  assert.equal(offerTimingLabel(endingSoon, 'active', 'ar'), 'ينتهي قريبًا');

  // States the timing model does not classify still fall back to the record.
  const unknown = { state: 'unknown', reason: null, endsAt: null, expiresAt: null, daysLeft: null };
  assert.equal(offerTimingLabel(unknown, 'paused', 'ar'), 'متوقف مؤقتًا وفق المراجعة');
});

// --- L-04 -----------------------------------------------------------------
test('L-04: availability is never claimed without an explicit status', () => {
  assert.equal(getAvailabilitySchema(undefined), null);
  assert.equal(getAvailabilitySchema(''), null);
  assert.equal(getAvailabilitySchema('verifying'), null);
  assert.equal(getAvailabilitySchema('active'), 'https://schema.org/InStock');
  assert.equal(getAvailabilitySchema('ending_soon'), 'https://schema.org/LimitedAvailability');
  assert.equal(getAvailabilitySchema('expired'), 'https://schema.org/SoldOut');
});

// --- C-01 / H-03 ----------------------------------------------------------
test('C-01: a bare catalog item yields no eligibility, trust, price or availability claim', () => {
  const facts = dealFacts({ slug: 'docker', name: 'Docker' });
  assert.equal(facts.openToAll, false);
  assert.equal(facts.verified, false);
  assert.equal(facts.studentsOnly, false);
  assert.equal(facts.noCard, false);
  assert.equal(facts.price, null);
  assert.equal(facts.availability, null);
  assert.equal(facts.reviewedOn, null);

  const seo = buildDealSeo({ slug: 'docker', name: 'Docker', summary: 'A card is required.' });
  assert.doesNotMatch(seo.description, /موثّق/);
  assert.doesNotMatch(seo.description, /مخصص للطلاب/);
  assert.doesNotMatch(seo.description, /بدون بطاقة/);
  assert.equal(seo.jsonLd.availability, undefined);
  assert.equal(seo.jsonLd.price, undefined);
  assert.equal(seo.jsonLd.priceCurrency, undefined);
  assert.equal(seo.jsonLd.dateModified, undefined);
});

test('H-03: "verified" wording is emitted only for an explicit verified status', () => {
  const verifying = buildDealSeo({
    slug: 'qwen-cloud',
    name: 'Qwen Cloud',
    status: 'verifying',
    review: { verification_status: 'verifying' },
  });
  assert.doesNotMatch(verifying.description, /موثّق/);
  assert.equal(verifying.jsonLd.availability, undefined);

  const verified = buildDealSeo({
    slug: 'deepgram',
    name: 'Deepgram',
    status: 'active',
    review: { verification_status: 'verified', reviewed_on: '2026-10-18' },
  });
  assert.match(verified.description, /موثّق/);
  assert.equal(verified.jsonLd.availability, 'https://schema.org/InStock');
  assert.equal(verified.jsonLd.dateModified, '2026-10-18');
});

test('C-01: an explicit open_to_all record still earns the "open to all" fact', () => {
  const facts = dealFacts({
    slug: 'open',
    eligibility: {
      open_to_all: 'yes',
      applicant_type: 'any',
      student_status: 'not_required',
      new_account: 'not_required',
      countries: { status: 'worldwide', values: [] },
    },
  });
  assert.equal(facts.openToAll, true);

  // One missing leg fails closed.
  const partial = dealFacts({
    slug: 'partial',
    eligibility: {
      open_to_all: 'yes',
      applicant_type: 'any',
      student_status: 'not_required',
      new_account: 'not_required',
      countries: { status: 'worldwide', values: ['US'] },
    },
  });
  assert.equal(partial.openToAll, false);
});

// --- C-01: the OG card ----------------------------------------------------
test('C-01: the OG card does not assert eligibility or verification it cannot prove', () => {
  const bare = staticSeo.buildDealOgSvg({ slug: 'docker', name: 'Docker' });
  assert.doesNotMatch(bare, /متاح للجميع/);
  assert.doesNotMatch(bare, /موثّق/);
  // Silence is not the fix either: with no proven eligibility the card must
  // send the reader to the terms rather than let them assume they qualify.
  assert.match(bare, /راجع الشروط/);

  const proven = staticSeo.buildDealOgSvg({
    slug: 'open',
    name: 'Open',
    review: { verification_status: 'verified', reviewed_on: '2026-10-18' },
    eligibility: {
      open_to_all: 'yes',
      applicant_type: 'any',
      student_status: 'not_required',
      new_account: 'not_required',
      countries: { status: 'worldwide', values: [] },
    },
  });
  assert.match(proven, /متاح للجميع/);
  assert.match(proven, /موثّق/);
  assert.doesNotMatch(proven, /راجع الشروط/);
});

test('C-01: a card with a proven restriction states it instead of "check the terms"', () => {
  const students = staticSeo.buildDealOgSvg({
    slug: 'kiro-students',
    name: 'Kiro',
    eligibility: { student_status: 'required' },
  });
  assert.match(students, /مخصص للطلاب/);
  assert.doesNotMatch(students, /راجع الشروط/);
  assert.doesNotMatch(students, /متاح للجميع/);
});

// --- C-01: the catalog adapter -------------------------------------------
test('C-01: loadDealsCatalog invents no review, pricing, eligibility or status', () => {
  const [row] = staticSeo.loadDealsCatalog(catalogRoot([bareItem]));
  assert.equal(row.slug, 'docker-cloud-sandbox-250');
  assert.equal(row.name, bareItem.name);
  assert.equal(row.summary, bareItem.description);
  assert.equal(row.review, undefined);
  assert.equal(row.pricing, undefined);
  assert.equal(row.eligibility, undefined);
  assert.equal(row.status, undefined);
  assert.equal(row.headline_value, undefined);
  assert.equal(row.use_cases, undefined);
  // The Arabic field must not be filled with the English description.
  assert.equal(row.description_ar, undefined);
});

// --- C-01: sitemap --------------------------------------------------------
test('C-01: empty collections are not advertised in the sitemap', () => {
  const empty = generateSitemapXml([], 'https://amnabd.com');
  assert.doesNotMatch(empty, /\/for-students/);
  assert.doesNotMatch(empty, /\/no-credit-card/);
  assert.doesNotMatch(empty, /\/ending-soon/);
  assert.match(empty, /<loc>https:\/\/amnabd\.com\/changelog<\/loc>/);

  const withStudent = generateSitemapXml(
    [{ slug: 'figma', status: 'active', eligibility: { student_status: 'required' } }],
    'https://amnabd.com'
  );
  assert.match(withStudent, /<loc>https:\/\/amnabd\.com\/for-students<\/loc>/);
  assert.doesNotMatch(withStudent, /\/no-credit-card/);
});

// --- L-09: one implementation, two callers --------------------------------
test('L-09: the build script and the app share one SEO implementation', () => {
  assert.equal(typeof staticSeo.buildDealSeo, 'function');
  const input = {
    slug: 'deepgram',
    name: 'Deepgram',
    status: 'active',
    review: { verification_status: 'verified' },
  };
  assert.deepEqual(
    staticSeo.buildDealSeo(input, 'https://amnabd.com'),
    buildDealSeo(input, 'https://amnabd.com')
  );
});

// --- verify-dist gate -----------------------------------------------------
function runVerifyDist(distDir) {
  return execFileSync(
    process.execPath,
    [join(process.cwd(), 'scripts/verify-dist.mjs'), '--dist', distDir],
    { encoding: 'utf8', stdio: 'pipe' }
  );
}

function fixtureDist(files) {
  const root = mkdtempSync(join(tmpdir(), 'amnabd-dist-'));
  for (const [rel, body] of Object.entries(files)) {
    const full = join(root, rel);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, body);
  }
  return root;
}

test('verify-dist passes a clean build and fails a build with unproven claims', () => {
  // docker-cloud-sandbox-250 exists in the catalog without any eligibility field,
  // so no eligibility claim can be justified for it.
  const slug = 'docker-cloud-sandbox-250';
  const clean = fixtureDist({
    [`deal/${slug}/index.html`]: '<html><head><title>Docker</title></head><body></body></html>',
  });
  assert.match(runVerifyDist(clean), /verify-dist: OK/);

  const dirty = fixtureDist({
    [`deal/${slug}/index.html`]:
      '<html><head><meta name="description" content="Docker متاح للجميع موثّق"></head></html>',
  });
  assert.throws(() => runVerifyDist(dirty), (error) => {
    assert.equal(error.status, 1);
    assert.match(String(error.stderr), /verify-dist: FAIL/);
    assert.match(String(error.stderr), /متاح للجميع/);
    return true;
  });
});

test('verify-dist allows only exact generic app shells for live slugs outside the SEO catalog', () => {
  const shell = '<!doctype html><html><head><title>AMNABD Deals</title></head><body><div id="root"></div></body></html>';
  const clean = fixtureDist({
    'index.html': shell,
    'deal/live-database-slug/index.html': shell,
  });
  assert.match(runVerifyDist(clean), /verify-dist: OK/);

  const dirty = fixtureDist({
    'index.html': shell,
    'deal/live-database-slug/index.html':
      '<!doctype html><html><head><meta name="description" content="verified"></head><body></body></html>',
  });
  assert.throws(() => runVerifyDist(dirty), (error) => {
    assert.equal(error.status, 1);
    assert.match(String(error.stderr), /live-database-slug/);
    return true;
  });
});

test('verify-dist covers site-level files, not just deal pages', () => {
  const siteDirty = fixtureDist({
    'index.html': '<html><head><meta name="description" content="verified deals"></head></html>',
    'llms.txt': '# AMNABD Deals\n\n> Every deal is verified.\n',
  });
  assert.throws(() => runVerifyDist(siteDirty), (error) => {
    assert.equal(error.status, 1);
    assert.match(String(error.stderr), /index\.html/);
    assert.match(String(error.stderr), /llms\.txt/);
    return true;
  });
});

test('verify-dist judges the feed channel header, not the per-deal item text', () => {
  // "بدون بطاقة" inside an <item> is source content, not a site-wide claim.
  const feed = fixtureDist({
    'feed.xml':
      '<?xml version="1.0"?><rss version="2.0"><channel><title>عروض موثّقة</title><link>https://amnabd.com/</link><item><title>x</title><description>بدون بطاقة</description></item></channel></rss>',
  });
  assert.throws(() => runVerifyDist(feed), (error) => {
    assert.equal(error.status, 1);
    assert.match(String(error.stderr), /feed\.xml/);
    assert.equal(String(error.stderr).includes('بدون بطاقة'), false);
    return true;
  });
});

test('verify-dist rejects "free"/"مجان" in site-level copy', () => {
  // Nothing in the catalog proves an offer is free, so the homepage may not say it.
  const withFree = fixtureDist({
    'index.html':
      '<html><head><meta name="description" content="دليل عروض مجانية"></head></html>',
  });
  assert.throws(() => runVerifyDist(withFree), (error) => {
    assert.equal(error.status, 1);
    assert.match(String(error.stderr), /مجان/);
    return true;
  });

  const clean = fixtureDist({
    'index.html':
      '<html><head><meta name="description" content="دليل عروض الذكاء الاصطناعي والسحابة"></head></html>',
  });
  assert.match(runVerifyDist(clean), /verify-dist: OK/);
});

test('verify-dist warns about claim-like source summaries without failing', () => {
  const dist = fixtureDist({
    'index.html': '<html><head><title>AMNABD Deals</title></head></html>',
  });
  // Warnings are printed but the build stays green: source copy is editorial.
  const result = spawnSync(
    process.execPath,
    [join(process.cwd(), 'scripts/verify-dist.mjs'), '--dist', dist],
    { encoding: 'utf8' }
  );
  assert.equal(result.status, 0);
  assert.match(result.stdout, /verify-dist: OK/);
  assert.match(result.stderr, /تحذير محتوى/);
  assert.match(result.stderr, /نص المصدر يحوي/);
});

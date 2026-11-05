import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { after, before, test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

import {
  verifyDist,
  extractVisibleBodyText,
  findClaimMatch,
  stripProductTitleFromSvg,
  checkText,
  DEAL_CLAIMS,
} from '../scripts/verify-dist.mjs';
import { sharedSeo } from '../scripts/generate-static-seo.mjs';

const { dealFacts } = sharedSeo;

let vite;
let DealDetailPage;
let LanguageProvider;

before(async () => {
  vite = await createServer({
    configFile: resolve(process.cwd(), 'vite.config.ts'),
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
    logLevel: 'error',
  });
  ({ default: DealDetailPage } = await vite.ssrLoadModule('/src/pages/DealDetailPage.tsx'));
  ({ LanguageProvider } = await vite.ssrLoadModule('/src/context/LanguageContext.tsx'));
});

after(async () => {
  await vite?.close();
});

function renderReactDetail(deal, lang = 'ar') {
  const values = new Map();
  globalThis.window = {
    location: { search: `?lang=${lang}`, hash: '' },
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value)),
      removeItem: (key) => values.delete(key),
    },
  };
  try {
    return renderToStaticMarkup(
      React.createElement(
        LanguageProvider,
        null,
        React.createElement(DealDetailPage, {
          deal,
          guide: null,
          sectionLabels: {},
          onBack: () => {},
          onToggleComparison: () => {},
          comparisonSelected: false,
          comparisonDisabled: false,
        })
      )
    );
  } finally {
    delete globalThis.window;
  }
}

function runVerifyDist(distDir, extraArgs = []) {
  return execFileSync(
    process.execPath,
    [join(process.cwd(), 'scripts/verify-dist.mjs'), '--dist', distDir, ...extraArgs],
    { encoding: 'utf8', stdio: 'pipe', env: { ...process.env, SEO_PARITY_SOURCE: 'snapshot' } }
  );
}

function fixtureDist(files) {
  const root = mkdtempSync(join(tmpdir(), 'amnabd-dist-'));
  const defaults = {
    'index.html':
      '<!doctype html><html><head><title>AMNABD Deals</title></head><body><div id="root"></div></body></html>',
    'compare/index.html':
      '<!doctype html><html><head><title>AMNABD Deals</title><meta name="robots" content="noindex,follow"></head><body><div id="root"></div></body></html>',
    '404.html':
      '<!doctype html><html><head><title>AMNABD Deals</title><meta name="robots" content="noindex,follow"><link rel="canonical" href="https://amnabd.com/404"></head><body><div id="root"></div></body></html>',
    'free-api-keys-directory/index.html':
      '<!doctype html><html><head><title>دليل مفاتيح API المجانية</title><link rel="canonical" href="https://amnabd.com/free-api-keys-directory"></head></html>',
  };
  for (const [rel, body] of Object.entries({ ...defaults, ...files })) {
    const full = join(root, rel);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, body);
    if (rel.startsWith('deal/') && rel.endsWith('/index.html')) {
      const flat = rel.replace(/\/index\.html$/, '.html');
      writeFileSync(join(root, flat), body);
    }
  }
  return root;
}

const unverifiedSlug = 'docker-cloud-sandbox-250';

test('AUD-011: unsupported Arabic claim (متاح للجميع) in deal page body <p> must fail', () => {
  const dirty = fixtureDist({
    [`deal/${unverifiedSlug}/index.html`]:
      '<!doctype html><html><head><title>Docker</title></head><body><p>هذا العرض متاح للجميع</p></body></html>',
  });
  assert.throws(() => runVerifyDist(dirty), (error) => {
    assert.equal(error.status, 1);
    assert.match(String(error.stderr), /verify-dist: FAIL/);
    assert.match(String(error.stderr), /متاح للجميع/);
    return true;
  });
});

test('AUD-011: unsupported English claim (Available to all) in deal page body <p> must fail', () => {
  const dirty = fixtureDist({
    [`deal/${unverifiedSlug}/index.html`]:
      '<!doctype html><html><head><title>Docker</title></head><body><p>Available to all developers</p></body></html>',
  });
  assert.throws(() => runVerifyDist(dirty), (error) => {
    assert.equal(error.status, 1);
    assert.match(String(error.stderr), /verify-dist: FAIL/);
    assert.match(String(error.stderr), /Available to all/i);
    return true;
  });
});

test('AUD-011: Available to all must fail when facts.openToAll is false', () => {
  const dirty = fixtureDist({
    [`deal/${unverifiedSlug}/index.html`]:
      '<!doctype html><html><head><title>Docker</title></head><body><span>Now available to all!</span></body></html>',
  });
  assert.throws(() => runVerifyDist(dirty), (error) => {
    assert.equal(error.status, 1);
    assert.match(String(error.stderr), /available to all/i);
    assert.match(String(error.stderr), /open_to_all=yes/);
    return true;
  });
});

test('AUD-011: Guaranteed discount in deal page body must fail', () => {
  const dirty = fixtureDist({
    [`deal/${unverifiedSlug}/index.html`]:
      '<!doctype html><html><head><title>Docker</title></head><body><div>Guaranteed discount on all tiers</div></body></html>',
  });
  assert.throws(() => runVerifyDist(dirty), (error) => {
    assert.equal(error.status, 1);
    assert.match(String(error.stderr), /verify-dist: FAIL/);
    assert.match(String(error.stderr), /Guaranteed discount/i);
    return true;
  });
});

test('AUD-011: Unlimited usage in deal page body must fail', () => {
  const dirty = fixtureDist({
    [`deal/${unverifiedSlug}/index.html`]:
      '<!doctype html><html><head><title>Docker</title></head><body><div>Get unlimited usage for your bots</div></body></html>',
  });
  assert.throws(() => runVerifyDist(dirty), (error) => {
    assert.equal(error.status, 1);
    assert.match(String(error.stderr), /verify-dist: FAIL/);
    assert.match(String(error.stderr), /Unlimited usage/i);
    return true;
  });
});

test('AUD-011: Free for everyone in deal page body must fail', () => {
  const dirty = fixtureDist({
    [`deal/${unverifiedSlug}/index.html`]:
      '<!doctype html><html><head><title>Docker</title></head><body><div>Free for everyone forever</div></body></html>',
  });
  assert.throws(() => runVerifyDist(dirty), (error) => {
    assert.equal(error.status, 1);
    assert.match(String(error.stderr), /verify-dist: FAIL/);
    assert.match(String(error.stderr), /Free for everyone/i);
    return true;
  });
});

test('AUD-011: unsupported For students in deal page body must fail', () => {
  const dirty = fixtureDist({
    [`deal/${unverifiedSlug}/index.html`]:
      '<!doctype html><html><head><title>Docker</title></head><body><p>For students and researchers only</p></body></html>',
  });
  assert.throws(() => runVerifyDist(dirty), (error) => {
    assert.equal(error.status, 1);
    assert.match(String(error.stderr), /verify-dist: FAIL/);
    assert.match(String(error.stderr), /For students/i);
    return true;
  });
});

test('AUD-011: unsupported No credit card in deal page body must fail', () => {
  const dirty = fixtureDist({
    [`deal/${unverifiedSlug}/index.html`]:
      '<!doctype html><html><head><title>Docker</title></head><body><p>No credit card needed to activate</p></body></html>',
  });
  assert.throws(() => runVerifyDist(dirty), (error) => {
    assert.equal(error.status, 1);
    assert.match(String(error.stderr), /verify-dist: FAIL/);
    assert.match(String(error.stderr), /No credit card/i);
    return true;
  });
});

test('AUD-011: unsupported Verified in deal page body must fail', () => {
  const dirty = fixtureDist({
    [`deal/${unverifiedSlug}/index.html`]:
      '<!doctype html><html><head><title>Docker</title></head><body><p>Verified deal badge</p></body></html>',
  });
  assert.throws(() => runVerifyDist(dirty), (error) => {
    assert.equal(error.status, 1);
    assert.match(String(error.stderr), /verify-dist: FAIL/);
    assert.match(String(error.stderr), /Verified/i);
    return true;
  });
});

test('AUD-011: supported claim passes when facts match (facts.openToAll is true)', () => {
  const customRoot = mkdtempSync(join(tmpdir(), 'amnabd-root-'));
  mkdirSync(join(customRoot, 'public'), { recursive: true });
  writeFileSync(
    join(customRoot, 'public', 'deals-catalog.json'),
    JSON.stringify([
      {
        slug: 'open-deal',
        name: 'Open Deal',
        summary: 'A completely open deal',
        eligibility: {
          open_to_all: 'yes',
          applicant_type: 'any',
          card_required: 'not_required',
          student_status: 'not_required',
          new_account: 'not_required',
          countries: { status: 'worldwide', values: [] },
        },
      },
    ])
  );

  const customDist = fixtureDist({
    'deal/open-deal/index.html':
      '<!doctype html><html><head><title>Open Deal</title></head><body><p>Available to all developers</p></body></html>',
  });

  const result = verifyDist({ rootDir: customRoot, distDir: customDist });
  assert.equal(
    result.violations.filter((v) => v.includes('Available to all')).length,
    0,
    `Supported claim should not violate facts: ${result.violations.join(', ')}`
  );
});

test('AUD-011: supported claims (studentsOnly, noCard, verified) pass when facts match', () => {
  const customRoot = mkdtempSync(join(tmpdir(), 'amnabd-root-'));
  mkdirSync(join(customRoot, 'public'), { recursive: true });
  writeFileSync(
    join(customRoot, 'public', 'deals-catalog.json'),
    JSON.stringify([
      {
        slug: 'verified-student-deal',
        name: 'Verified Student Deal',
        summary: 'A verified student deal',
        eligibility: {
          student_status: 'required',
          card_required: 'not_required',
        },
        review: {
          verification_status: 'verified',
        },
      },
    ])
  );

  const customDist = fixtureDist({
    'deal/verified-student-deal/index.html':
      '<!doctype html><html><head><title>Verified Student Deal</title></head><body>' +
      '<p>For students only. No credit card required. Verified offer.</p>' +
      '</body></html>',
  });

  const result = verifyDist({ rootDir: customRoot, distDir: customDist });
  assert.equal(
    result.violations.length,
    0,
    `Supported claims should pass: ${result.violations.join(', ')}`
  );
});

test('AUD-011: script and style content in body is ignored', () => {
  const cleanWithCode = fixtureDist({
    [`deal/${unverifiedSlug}/index.html`]:
      '<!doctype html><html><head><title>Docker</title></head><body>' +
      '<script>var x = "متاح للجميع"; var y = "Available to all";</script>' +
      '<style>.claim { content: "متاح للجميع"; }</style>' +
      '<!-- متاح للجميع Free for everyone -->' +
      '<div data-claim="متاح للجميع" data-promo="Free for everyone">Safe content</div>' +
      '</body></html>',
  });
  assert.match(runVerifyDist(cleanWithCode), /verify-dist: OK/);
});

test('AUD-011: HTML entity decoded visible text is checked', () => {
  const dirty = fixtureDist({
    [`deal/${unverifiedSlug}/index.html`]:
      '<!doctype html><html><head><title>Docker</title></head><body><p>Available &amp; free for everyone</p></body></html>',
  });
  assert.throws(() => runVerifyDist(dirty), (error) => {
    assert.equal(error.status, 1);
    assert.match(String(error.stderr), /verify-dist: FAIL/);
    assert.match(String(error.stderr), /free for everyone/i);
    return true;
  });
});

test('AUD-011: site-wide unsupported claims fail in site files', () => {
  const dirty = fixtureDist({
    'index.html':
      '<!doctype html><html><head><title>AMNABD Deals</title><meta name="description" content="All deals are available to all with guaranteed discount"></head><body><div id="root"></div></body></html>',
  });
  assert.throws(() => runVerifyDist(dirty), (error) => {
    assert.equal(error.status, 1);
    assert.match(String(error.stderr), /verify-dist: FAIL/);
    assert.match(String(error.stderr), /guaranteed discount|available to all/i);
    return true;
  });
});

// --- P2: Word boundaries and negations tests ---
test('AUD-011: findClaimMatch respects word boundaries (unverified != verified)', () => {
  assert.equal(findClaimMatch('This deal is unverified', 'verified'), null);
  assert.equal(findClaimMatch('Status: unverified', 'verified'), null);
  assert.equal(findClaimMatch('This deal is verified', 'verified'), 'verified');
});

test('AUD-011: findClaimMatch skips negated English and Arabic claims', () => {
  assert.equal(findClaimMatch('This offer is not available to all users', 'available to all'), null);
  assert.equal(findClaimMatch('Access is not for students', 'for students'), null);
  assert.equal(findClaimMatch('This is not free for everyone', 'free for everyone'), null);
  assert.equal(findClaimMatch('هذا العرض غير متاح للجميع', 'متاح للجميع'), null);
  assert.equal(findClaimMatch('عرض غير موثّق', 'موثّق'), null);
  assert.equal(findClaimMatch('ليس متاحاً للجميع', 'متاح للجميع'), null);

  // Positive claims still match:
  assert.equal(findClaimMatch('Now available to all developers', 'available to all'), 'available to all');
  assert.equal(findClaimMatch('عرض موثّق من المصدر', 'موثّق'), 'موثّق');
});

test('AUD-011: negated claims in deal page body do not trigger false positive violations', () => {
  const cleanWithNegations = fixtureDist({
    [`deal/${unverifiedSlug}/index.html`]:
      '<!doctype html><html><head><title>Docker</title></head><body>' +
      '<p>This preview is not available to all users and is unverified.</p>' +
      '<p>هذا العرض غير متاح للجميع حالياً وهو غير موثّق.</p>' +
      '</body></html>',
  });
  assert.match(runVerifyDist(cleanWithNegations), /verify-dist: OK/);
});

// --- P1: SVG product title vs headline banner tests ---
test('AUD-011: OG SVG rejects unproven promotional claim in headlineSvg banner', () => {
  const dirtySvg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">' +
    '  <text x="1096" y="250" fill="#f8fafc" font-size="40" font-weight="700">Docker Platform</text>' +
    '  <g transform="translate(104, 380)">' +
    '    <text x="956" y="62" fill="#34d399" font-size="40" font-weight="800">Guaranteed discount on all tiers</text>' +
    '  </g>' +
    '</svg>';

  const dirty = fixtureDist({
    [`og/${unverifiedSlug}.svg`]: dirtySvg,
  });

  assert.throws(() => runVerifyDist(dirty), (error) => {
    assert.equal(error.status, 1);
    assert.match(String(error.stderr), /verify-dist: FAIL/);
    assert.match(String(error.stderr), /Guaranteed discount/i);
    return true;
  });
});

test('AUD-011: OG SVG allows official product name (e.g. Azure for Students) without false positive', () => {
  const customRoot = mkdtempSync(join(tmpdir(), 'amnabd-root-'));
  mkdirSync(join(customRoot, 'public'), { recursive: true });
  writeFileSync(
    join(customRoot, 'public', 'deals-catalog.json'),
    JSON.stringify([
      {
        slug: 'azure-for-students-test',
        name: 'Azure for Students — $100 for 12 months',
        summary: 'Official student cloud deal',
        eligibility: {
          student_status: 'unknown',
        },
      },
    ])
  );

  const cleanSvg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">' +
    '  <text x="1096" y="300" fill="#f8fafc" font-size="40" font-weight="700">Azure for Students — $100 for</text>' +
    '  <text x="1096" y="362" fill="#f8fafc" font-size="40" font-weight="700">12 months</text>' +
    '  <text x="1096" y="520" fill="#cbd5e1" font-size="24" font-weight="500">الأهلية: راجع الشروط</text>' +
    '</svg>';

  const customDist = fixtureDist({
    'deal/azure-for-students-test/index.html':
      '<!doctype html><html><head><title>Azure</title></head><body><div id="root"></div></body></html>',
    'og/azure-for-students-test.svg': cleanSvg,
  });

  const result = verifyDist({ rootDir: customRoot, distDir: customDist });
  assert.equal(
    result.violations.filter((v) => v.includes('for students')).length,
    0,
    `Product name in title should not violate claims: ${result.violations.join(', ')}`
  );
});

test('AUD-011: stripProductTitleFromSvg strips title lines but keeps headlineSvg', () => {
  const mockSvg =
    '<svg><text x="1096" y="100" fill="#f8fafc" font-size="40" font-weight="700">Azure for Students</text>' +
    '<g transform="translate(104, 380)"><text x="956" y="62" fill="#34d399" font-size="40" font-weight="800">خصم مضمون</text></g></svg>';
  const stripped = stripProductTitleFromSvg(mockSvg, { name_ar: 'Azure for Students', name_en: 'Azure for Students' });
  assert.ok(!stripped.includes('Azure for Students'), 'Title must be stripped');
  assert.ok(stripped.includes('خصم مضمون'), 'Headline SVG must be preserved');
});

// --- P1: React DOM rendering integration tests ---
function makeMockDeal(overrides = {}) {
  return {
    id: 'test-deal',
    slug: 'test-deal',
    name_ar: 'عرض تجريبي',
    name_en: 'Test Deal',
    description_ar: 'تفاصيل العرض التجريبي',
    description_en: 'Test deal details',
    category: { value: 'ai_tool' },
    status: 'active',
    benefits: [],
    official_sources: [
      {
        url: 'https://example.com',
        title: 'Official Source',
        claims: [],
      },
    ],
    pricing: {
      currency: 'USD',
      offer_price: 0,
      billing_cycle: 'monthly',
      original_price: null,
    },
    registration: {
      deadline: { date: null, status: 'unknown' },
      credit_validity: { unit: null, status: 'unknown', duration: null },
    },
    get_offer: {
      url: 'https://example.com',
      type: 'direct',
      label: { ar: 'احصل على العرض', en: 'Get offer' },
    },
    review: {
      notes: { ar: '', en: '' },
      reviewed_on: '2026-11-01',
      verified_on: null,
      offer_status: 'available',
      unknown_fields: [],
      verification_status: 'unverified',
    },
    eligibility: {
      conditions: { ar: '', en: '' },
      new_account: 'unknown',
      card_required: 'unknown',
      applicant_type: 'unknown',
      open_to_all: 'unknown',
      phone_required: 'unknown',
      student_status: 'unknown',
      countries: { status: 'unknown', values: [] },
    },
    ...overrides,
  };
}

test('AUD-011: React-rendered DealDetailPage DOM with unsupported body claims is caught', () => {
  const sampleDeal = makeMockDeal({
    id: 'test-dom-deal',
    slug: 'test-dom-deal',
    name_ar: 'عرض تجريبي',
    name_en: 'Test DOM Deal',
    description_ar: 'هذا العرض متاح للجميع وفوري',
    description_en: 'This special deal is available to all developers with a guaranteed discount',
    headline_value: 'خصم مضمون',
    category: { value: 'ai_tool' },
    status: 'active',
  });

  const renderedHtml = renderReactDetail(sampleDeal, 'en');
  const visibleBody = extractVisibleBodyText(renderedHtml);

  assert.ok(
    visibleBody.includes('available to all'),
    'React DOM rendered the unproven description'
  );

  const facts = dealFacts(sampleDeal);
  const violations = [];
  checkText(
    (msg) => violations.push(msg),
    'deal/test-dom-deal/index.html (React DOM)',
    visibleBody,
    DEAL_CLAIMS,
    (claim) => claim.allowed(facts)
  );

  assert.ok(
    violations.some((v) => v.includes('available to all')),
    `React-rendered DOM unsupported claim must be flagged: ${violations.join(', ')}`
  );
  assert.ok(
    violations.some((v) => v.includes('guaranteed discount')),
    `React-rendered DOM guaranteed discount claim must be flagged: ${violations.join(', ')}`
  );
});

test('AUD-011: React-rendered DealDetailPage DOM with verified status and supported facts passes', () => {
  const sampleVerifiedDeal = makeMockDeal({
    id: 'test-verified-deal',
    slug: 'test-verified-deal',
    name_ar: 'عرض موثق',
    name_en: 'Test Verified Deal',
    description_ar: 'تفاصيل العرض الموثق من المصدر',
    description_en: 'Official verified deal details',
    category: { value: 'ai_tool' },
    status: 'active',
    review: {
      notes: { ar: '', en: '' },
      verification_status: 'verified',
      verdict: 'verified',
      reviewed_on: '2026-11-01',
      verified_on: '2026-11-01',
      offer_status: 'available',
      unknown_fields: [],
    },
  });

  const renderedHtml = renderReactDetail(sampleVerifiedDeal, 'ar');
  const visibleBody = extractVisibleBodyText(renderedHtml);

  const facts = dealFacts(sampleVerifiedDeal);
  assert.equal(facts.verified, true);

  const violations = [];
  checkText(
    (msg) => violations.push(msg),
    'deal/test-verified-deal/index.html (React DOM)',
    visibleBody,
    DEAL_CLAIMS,
    (claim) => claim.allowed(facts)
  );

  assert.equal(
    violations.length,
    0,
    `Supported React DOM claims must pass cleanly: ${violations.join(', ')}`
  );
});

test('AUD-011: React-rendered DealDetailPage DOM with negations does not trigger false positives', () => {
  const sampleNegatedDeal = makeMockDeal({
    id: 'test-negated-deal',
    slug: 'test-negated-deal',
    name_ar: 'عرض مقيد',
    name_en: 'Restricted Deal',
    description_ar: 'هذا العرض غير متاح للجميع وهو غير موثّق حتى الآن',
    description_en: 'This tool is not available to all users and is unverified at this time',
    category: { value: 'ai_tool' },
    status: 'active',
  });

  const renderedHtml = renderReactDetail(sampleNegatedDeal, 'en');
  const visibleBody = extractVisibleBodyText(renderedHtml);

  const facts = dealFacts(sampleNegatedDeal);
  const violations = [];
  checkText(
    (msg) => violations.push(msg),
    'deal/test-negated-deal/index.html (React DOM)',
    visibleBody,
    DEAL_CLAIMS,
    (claim) => claim.allowed(facts)
  );

  assert.equal(
    violations.length,
    0,
    `Negated claims in React DOM must not trigger false positives: ${violations.join(', ')}`
  );
});

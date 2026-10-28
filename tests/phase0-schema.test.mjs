import assert from 'node:assert/strict';
import { test } from 'node:test';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const { validateDeals } = await import(
  pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, 'src/lib/validate.js'))
);

const {
  getDealDisplayName,
  getDealHeadlineValue,
  getDealKeyCondition,
  getDealIconSources,
  getDealOfficialDomain,
  OFFICIAL_TOOL_NAMES,
} = await import(
  pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, 'src/lib/dealMetadata.js'))
);

const dealFixture = (changes = {}) => ({
  id: 'fixture-id',
  slug: 'fixture-slug',
  name_ar: 'اسم العرض',
  name_en: 'Offer Name',
  category: { value: 'برمجة وتطوير' },
  benefits: [],
  eligibility: {},
  pricing: {},
  registration: {},
  official_sources: [],
  get_offer: {},
  review: {},
  ...changes,
});

test('Phase 0: validateDeals preserves new schema fields when provided', () => {
  const input = dealFixture({
    name: 'Bolt',
    headline_value: 'GLM 5.3 Flash مجانًا ومسابقة بناء',
    key_condition: 'حصص كل 6 ساعات',
    use_cases: ['برمجة', 'ذكاء اصطناعي'],
    status: 'expired',
    ends_at: '2026-10-18T23:59:00-07:00',
  });

  const report = validateDeals([input]);
  assert.equal(report.rejectedRows, 0);
  assert.equal(report.values.length, 1);
  const validated = report.values[0];

  assert.equal(validated.name, 'Bolt');
  assert.equal(validated.headline_value, 'GLM 5.3 Flash مجانًا ومسابقة بناء');
  assert.equal(validated.key_condition, 'حصص كل 6 ساعات');
  assert.deepEqual(validated.use_cases, ['برمجة', 'ذكاء اصطناعي']);
  assert.equal(validated.status, 'expired');
  assert.equal(validated.ends_at, '2026-10-18T23:59:00-07:00');
});

test('Phase 0: invalid deal status falls back to undefined without rejecting the row', () => {
  const input = dealFixture({
    status: 'not_a_valid_status',
  });

  const report = validateDeals([input]);
  assert.equal(report.rejectedRows, 0);
  assert.equal(report.values[0].status, undefined);
});

test('Phase 0: getDealDisplayName prioritizes explicit name field', () => {
  const deal = dealFixture({
    name: 'Bolt',
    slug: 'bolt-builders-week',
    name_en: 'Bolt — free GLM 5.3 Flash October 17–18 and builders contest',
  });
  assert.equal(getDealDisplayName(deal), 'Bolt');
});

test('Phase 0: getDealDisplayName extracts short name from OFFICIAL_TOOL_NAMES or prefix', () => {
  const dealWithPrefix = dealFixture({
    slug: 'unknown-tool',
    name_en: 'Vercel Beam — limited-time free AI Gateway access',
  });
  assert.equal(getDealDisplayName(dealWithPrefix), 'Vercel Beam');

  const dealFromMap = dealFixture({
    slug: 'docker-cloud-sandbox-250',
    name_en: 'Docker — $250 Cloud Sandbox compute credit',
  });
  assert.equal(getDealDisplayName(dealFromMap), 'Docker');

  const dealWithShortNameEn = dealFixture({
    slug: 'custom-slug',
    name_en: 'Acme Cloud',
  });
  assert.equal(getDealDisplayName(dealWithShortNameEn), 'Acme Cloud');
});

test('REC-10: getDealIconSources and getDealOfficialDomain reject unsafe URLs and blocked hosts', () => {
  const unsafeDeal = dealFixture({
    icon_url: 'http://insecure.com/icon.png',
    official_sources: [{ url: 'http://insecure.com/page' }],
  });
  const sources = getDealIconSources(unsafeDeal);
  assert.notEqual(sources.primary, 'http://insecure.com/icon.png');
  assert.equal(getDealOfficialDomain(unsafeDeal), null);

  const blockedHostDeal = dealFixture({
    icon_url: 'https://studentoffers.co/icon.png',
    official_sources: [{ url: 'https://studentoffers.co/deal' }],
  });
  const blockedSources = getDealIconSources(blockedHostDeal);
  assert.notEqual(blockedSources.primary, 'https://studentoffers.co/icon.png');
  assert.equal(getDealOfficialDomain(blockedHostDeal), null);

  const safeDeal = dealFixture({
    icon_url: 'https://cdn.example.com/icon.svg',
    official_sources: [{ url: 'https://example.com/offer' }],
  });
  const safeSources = getDealIconSources(safeDeal);
  assert.equal(safeSources.primary, 'https://cdn.example.com/icon.svg');
  assert.equal(getDealOfficialDomain(safeDeal), 'example.com');
});

test('Phase 0: all 27 core deals are registered with official short names', () => {
  const expectedSlugs = [
    'antigravity-ultra-scientists',
    'assemblyai',
    'beam-vercel-gateway',
    'blitz-cloud',
    'bolt-builders-week',
    'deepgram',
    'deepseek-flash-1017-free',
    'deepseek-v41-flash-opencode',
    'docker-cloud-sandbox-250',
    'dolphin-api10-credit',
    'exa-ai',
    'figma',
    'freebuff',
    'general-compute',
    'github-copilot',
    'indra-ocr',
    'minimax-h3-max',
    'nararouter',
    'openai-codex-oss',
    'qwen-cloud',
    'qwen38-27b-itera',
    'retriever-ai',
    'tinyfish',
    'tokenrouter',
    'you-com',
    'zed',
    'zenmux',
  ];

  for (const slug of expectedSlugs) {
    assert.ok(
      OFFICIAL_TOOL_NAMES[slug],
      `Expected slug '${slug}' to have an official short tool name registered`
    );
  }
});

test('Phase 0: getDealHeadlineValue and getDealKeyCondition supply guaranteed fallbacks', () => {
  const dealWithData = dealFixture({
    headline_value: '200$ رصيد مجاني',
    key_condition: 'بدون بطاقة ائتمان',
  });
  assert.equal(getDealHeadlineValue(dealWithData, 'ar'), '200$ رصيد مجاني');
  assert.equal(getDealKeyCondition(dealWithData, 'ar'), 'بدون بطاقة ائتمان');

  const emptyDeal = dealFixture({
    eligibility: { card_required: 'not_required' },
    benefits: [
      {
        type: 'credits',
        amount: { value: 100, currency: 'USD', unit: '$' },
      },
    ],
  });
  assert.equal(getDealHeadlineValue(emptyDeal, 'ar'), '100$');
  assert.equal(getDealKeyCondition(emptyDeal, 'ar'), 'بدون بطاقة ائتمان');
});

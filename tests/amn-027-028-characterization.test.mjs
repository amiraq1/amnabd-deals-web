// AMN-027 and AMN-028 characterization tests. Each test pins what the code does
// today, including choices that still await a decision. A test named
// "CHARACTERIZATION" passing means the current behavior is unchanged. It does not
// mean the behavior is the one the project wants. No file under src/ is changed.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const load = (rel) =>
  import(pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, `src/lib/${rel}.js`)).href);
const { matchesQuery } = await load('normalize');
const { sortDeals } = await load('dealSort');
const { countryAvailability } = await load('countryAvailability');

const REFERENCE_NOW = new Date('2026-11-11T00:00:00Z');

test('CHARACTERIZATION (AMN-027): gpt4 matches gpt40 because gpt40 starts with gpt4', () => {
  assert.equal(matchesQuery('gpt40 tools', 'gpt4'), true);
});

test('CHARACTERIZATION (AMN-027): ai matches ai, aim and airtable at a word start', () => {
  assert.equal(matchesQuery('ai tools', 'ai'), true);
  assert.equal(matchesQuery('aim high', 'ai'), true);
  assert.equal(matchesQuery('airtable base', 'ai'), true);
});

test('CHARACTERIZATION (AMN-027): ai does not match openai', () => {
  assert.equal(matchesQuery('openai tools', 'ai'), false);
});

test('CHARACTERIZATION (AMN-027): the clitic ف or ل before ال is accepted before the stem', () => {
  assert.equal(matchesQuery('فالذكاء الاصطناعي', 'ذكاء'), true);
  assert.equal(matchesQuery('لالذكاء الاصطناعي', 'ذكاء'), true);
});

function sortFixture(id, extra) {
  return { id, slug: id, name_en: id, name_ar: id, ...extra };
}

test('CHARACTERIZATION (AMN-028): default sort keeps created_at order and does not move expired offers last', () => {
  const deals = [
    sortFixture('old-active', { created_at: '2026-01-01T00:00:00Z', status: 'active' }),
    sortFixture('new-expired', { created_at: '2026-06-01T00:00:00Z', status: 'expired' }),
  ];
  const ids = sortDeals(deals, 'default', REFERENCE_NOW).map((d) => d.id);
  assert.deepEqual(ids, ['new-expired', 'old-active']);
});

test('CHARACTERIZATION (AMN-028): reviewed sort puts an expired offer last even with the newest review', () => {
  const deals = [
    sortFixture('expired-new-review', {
      status: 'expired',
      review: { reviewed_on: '2026-11-01' },
    }),
    sortFixture('active-old-review', {
      status: 'active',
      review: { reviewed_on: '2026-01-01' },
    }),
  ];
  const ids = sortDeals(deals, 'reviewed', REFERENCE_NOW).map((d) => d.id);
  assert.deepEqual(ids, ['active-old-review', 'expired-new-review']);
});

test('CHARACTERIZATION (AMN-028): deadline sort puts an expired offer last even with an earlier deadline', () => {
  const deals = [
    sortFixture('expired-early-deadline', {
      status: 'expired',
      registration: { deadline: { date: '2026-12-01', status: 'known' } },
    }),
    sortFixture('active-late-deadline', {
      status: 'active',
      registration: { deadline: { date: '2026-12-31', status: 'known' } },
    }),
  ];
  const ids = sortDeals(deals, 'deadline', REFERENCE_NOW).map((d) => d.id);
  assert.deepEqual(ids, ['active-late-deadline', 'expired-early-deadline']);
});

function countryDeal(values) {
  return {
    id: 'country-alias',
    slug: 'country-alias',
    eligibility: { countries: { status: 'specified', values } },
    official_sources: [
      {
        url: 'https://official.example.test/terms',
        title: 'Official eligibility rules',
        claims: [
          {
            field: 'eligibility.countries.values',
            value: values,
            evidence: 'The official eligible-country list explicitly includes this country.',
          },
        ],
      },
    ],
    review: { reviewed_on: '2026-10-24', verification_status: 'supported', unknown_fields: [] },
  };
}

test('CHARACTERIZATION (AMN-028): Iraq aliases from COUNTRY_ALIASES resolve to the same country', () => {
  const row = countryDeal(['Iraq']);
  assert.equal(countryAvailability(row, 'جمهورية العراق'), 'supported');
  assert.equal(countryAvailability(row, 'العراق'), 'supported');
});

test('CHARACTERIZATION (AMN-028): Mainland China aliases from COUNTRY_ALIASES resolve to the same country', () => {
  const row = countryDeal(['Mainland China']);
  assert.equal(countryAvailability(row, 'البر الرئيسي للصين'), 'supported');
  assert.equal(countryAvailability(row, 'الصين القارية'), 'supported');
});

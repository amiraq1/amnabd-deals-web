import assert from 'node:assert/strict';
import { test } from 'node:test';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const { validateDeals, validateGuides, validateConfig } = await import(
  pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, 'src/lib/validate.js'))
);
const { parseInstant } = await import(pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, 'src/lib/instants.js')));
const deal = (changes = {}) => ({
  id: 'real-id',
  slug: 'real-slug',
  name_ar: 'اسم حقيقي',
  name_en: 'Actual name',
  ...changes,
});

test('SQL-style empty JSON fields yield a safe, unknown-shaped record', () => {
  const report = validateDeals([
    deal({ review: {}, eligibility: {}, registration: {}, pricing: {} }),
  ]);
  assert.equal(report.values.length, 1);
  assert.ok(report.normalizedFields > 0);
  const parsed = report.values[0];
  assert.deepEqual(parsed.review.unknown_fields, []);
  assert.equal(parsed.eligibility.card_required, 'unknown');
  assert.deepEqual(parsed.eligibility.conditions, { ar: 'غير معلوم', en: 'Unknown' });
  assert.equal(parsed.pricing.offer_price, null);
  assert.equal(parsed.registration.deadline.date, null);
  assert.deepEqual(parsed.benefits, []);
  assert.deepEqual(parsed.official_sources, []);
});
for (const invalid of [
  null,
  [],
  'oops',
  42,
  {},
  deal({ id: '' }),
  deal({ slug: null }),
  deal({ slug: 'bad/slug' }),
  deal({ slug: 'bad slug' }),
  deal({ name_ar: null, name_en: {} }),
]) {
  test(`invalid identity is quarantined: ${JSON.stringify(invalid)}`, () => {
    const result = validateDeals([invalid, deal()]);
    assert.equal(result.values.length, 1);
    assert.equal(result.rejectedRows, 1);
    assert.equal(result.values[0].id, 'real-id');
  });
}
test('one actual language name can be reused without inventing identity', () => {
  const parsed = validateDeals([deal({ name_ar: null })]).values[0];
  assert.equal(parsed.name_ar, 'Actual name');
});
for (const input of [null, undefined, {}, '[]']) {
  test(`non-array collection is rejected: ${String(input)}`, () => {
    assert.equal(validateDeals(input).invalidCollection, true);
    assert.equal(validateDeals(input).values.length, 0);
    assert.equal(validateGuides(input).invalidCollection, true);
  });
}
test('empty collection is valid, duplicate IDs and slugs are isolated', () => {
  assert.equal(validateDeals([]).invalidCollection, false);
  const result = validateDeals([
    deal(),
    deal({ slug: 'other' }),
    deal({ id: 'other' }),
    deal({ id: 'new', slug: 'new' }),
  ]);
  assert.equal(result.values.length, 2);
  assert.equal(result.rejectedRows, 2);
});
test('malformed nested arrays, claims and text cannot reach renderers', () => {
  const parsed = validateDeals([
    deal({
      benefits: [null, 'bad', { amount: { value: '200', unit: {} }, description: { ar: {} } }],
      official_sources: [
        null,
        {},
        {
          url: 'https://example.com',
          title: {},
          claims: [null, { evidence: {} }, { field: 'f', evidence: 'real evidence' }],
        },
      ],
      review: { unknown_fields: [null, {}, 'country'], notes: {} },
      eligibility: { conditions: [], countries: { values: [false, 'IQ'] }, card_required: 'maybe' },
    }),
  ]).values[0];
  assert.equal(parsed.benefits.length, 1);
  assert.equal(parsed.benefits[0].amount.value, null);
  assert.equal(parsed.benefits[0].amount.unit, null);
  assert.equal(parsed.benefits[0].description.ar, 'غير معلوم');
  assert.equal(parsed.official_sources.length, 1);
  assert.equal(parsed.official_sources[0].claims.length, 1);
  assert.deepEqual(parsed.review.unknown_fields, ['country']);
  assert.deepEqual(parsed.eligibility.countries.values, ['IQ']);
  assert.equal(parsed.eligibility.card_required, 'unknown');
});
test('zero, negative, strings and non-finite amounts are not conflated', () => {
  const parsed = validateDeals([
    deal({
      pricing: { offer_price: 0, original_price: '100' },
      benefits: [0, -1, NaN, Infinity].map((value) => ({ amount: { value, unit: 'tokens' } })),
    }),
  ]).values[0];
  assert.equal(parsed.pricing.offer_price, 0);
  assert.equal(parsed.pricing.original_price, null);
  assert.deepEqual(
    parsed.benefits.map((b) => b.amount.value),
    [0, null, null, null]
  );
});
test('dates: valid leap day/zoned deadline retained; invalid dates omitted', () => {
  const parsed = validateDeals([
    deal({
      review: { reviewed_on: '2026-02-30', verified_on: '2024-02-29' },
      registration: { deadline: { date: '2026-10-31T16:00:00Z', status: 'known' } },
    }),
  ]).values[0];
  assert.equal(parsed.review.reviewed_on, '');
  assert.equal(parsed.review.verified_on, '2024-02-29');
  assert.equal(parsed.registration.deadline.date, '2026-10-31T16:00:00Z');
  for (const date of [
    '2026-10-31T16:00Z',
    '2026-10-31T19:00+03:00',
    '2026-10-31T19:00:00.123+03:00',
  ]) {
    assert.equal(
      validateDeals([deal({ registration: { deadline: { date } } })]).values[0].registration
        .deadline.date,
      date
    );
  }
  for (const date of ['2026-02-30', '2026-10-31T24:00:00Z', '2026-10-31T16:00:00']) {
    assert.equal(
      validateDeals([deal({ registration: { deadline: { date } } })]).values[0].registration
        .deadline.date,
      null
    );
  }
});
test('deadline validation agrees with instant parsing and rejects unknown -00:00 offsets', () => {
  for (const date of ['2026-10-31T16:00:00Z', '2026-10-31T19:00:00+03:00', '2026-10-31T16:00:00+00:00']) {
    const parsed = validateDeals([deal({ registration: { deadline: { date, status: 'known' } } })]).values[0];
    assert.equal(parsed.registration.deadline.date, date);
    assert.notEqual(parseInstant(parsed.registration.deadline.date), null);
  }

  const unknownOffset = '2026-10-31T16:00:00-00:00';
  const parsed = validateDeals([
    deal({ registration: { deadline: { date: unknownOffset, status: 'known' } } }),
  ]).values[0];
  assert.equal(parseInstant(unknownOffset), null);
  assert.equal(parsed.registration.deadline.date, null);
});
test('partial guides receive all four safe sections', () => {
  const result = validateGuides([
    {},
    { slug: 'real-slug', sections: { eligibility: { ar: 'شرط', sources: {} } } },
    { slug: 'real-slug' },
  ]);
  assert.equal(result.values.length, 1);
  assert.equal(result.rejectedRows, 2);
  assert.equal(result.values[0].sections.eligibility.ar, 'شرط');
  for (const section of Object.values(result.values[0].sections)) {
    assert.equal(typeof section.en, 'string');
    assert.ok(Array.isArray(section.sources));
  }
});
test('config validates main identity, both languages and unknown date', () => {
  assert.equal(validateConfig(null).value, null);
  assert.equal(validateConfig({ id: 'other' }).rejectedRows, 1);
  const result = validateConfig({
    id: 'main',
    overview: { ar: { title: 'عنوان', bad: {}, empty: '' } },
    last_reviewed: 'bad',
  });
  assert.equal(result.value.overview.ar.title, 'عنوان');
  assert.deepEqual(result.value.overview.en, {});
  assert.equal(result.value.last_reviewed, '');
  assert.equal(result.value.overview.ar.bad, undefined);
  assert.equal(result.value.overview.ar.empty, undefined);
});
test('prototype keys cannot pollute config maps or supply record identity', () => {
  const result = validateConfig(
    JSON.parse(
      '{"id":"main","overview":{"ar":{"__proto__":{"polluted":true},"constructor":"bad","title":"OK"}}}'
    )
  );
  assert.equal(Object.hasOwn(result.value.overview.ar, '__proto__'), false);
  assert.equal(Object.hasOwn(result.value.overview.ar, 'constructor'), false);
  assert.equal({}.polluted, undefined);
  assert.equal(
    validateDeals([Object.create({ id: 'x', slug: 'x', name_en: 'x' })]).rejectedRows,
    1
  );
});
test('diagnostics contain counts only and do not log raw values', () => {
  const result = validateDeals([{ id: 'PRIVATE-ID', token: 'PRIVATE-TOKEN' }]);
  assert.doesNotMatch(JSON.stringify(result), /PRIVATE/);
  assert.deepEqual(Object.keys(result).sort(), [
    'invalidCollection',
    'normalizedFields',
    'rejectedRows',
    'values',
  ]);
});

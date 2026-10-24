import assert from 'node:assert/strict';
import { test } from 'node:test';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const load = (name) =>
  import(pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, `src/lib/${name}.js`)).href);
const { buildComparisonRows, comparisonSearch, parseComparisonSlugs, toggleComparisonSelection } = await load('comparison');
const { parseHash, routeUrl } = await load('routes');

function deal(slug, overrides = {}) {
  return {
    id: slug,
    slug,
    name_ar: `عرض ${slug}`,
    name_en: `Offer ${slug}`,
    description_ar: 'وصف',
    description_en: 'Description',
    category: { value: 'ai' },
    benefits: [
      {
        type: 'feature_access',
        duration: { value: 12, unit: 'months', status: 'known' },
        description: { ar: 'وصول', en: 'Access' },
      },
    ],
    eligibility: {
      student_status: 'required',
      card_required: 'not_required',
      new_account: 'unknown',
      phone_required: 'not_required',
      countries: { status: 'listed', values: ['IQ'] },
      conditions: { ar: 'شرط', en: 'Terms' },
    },
    official_sources: [
      { url: 'https://official.example/offer', title: 'Official terms', claims: [] },
    ],
    review: { unknown_fields: [], verification_status: 'unknown' },
    ...overrides,
  };
}

const valueFor = (rows, key, index) => rows.find((row) => row.key === key).values[index];

test('comparison rows expose exactly the seven requested fields in both languages', () => {
  const rows = buildComparisonRows([deal('a'), deal('b')], 'ar');
  assert.deepEqual(rows.map((row) => row.key), [
    'student', 'card', 'new-account', 'phone', 'countries', 'duration', 'source',
  ]);
  assert.deepEqual(rows.map((row) => row.label.ar), [
    'اشتراط صفة الطالب',
    'اشتراط بطاقة ائتمان',
    'اشتراط حساب جديد',
    'اشتراط رقم هاتف',
    'البلدان المؤهلة المسجلة',
    'المدة المسجلة',
    'المصدر الرسمي',
  ]);
  const english = buildComparisonRows([deal('a'), deal('b')], 'en');
  assert.deepEqual(english.map((row) => row.label.en), [
    'Student requirement',
    'Credit-card requirement',
    'New-account requirement',
    'Phone requirement',
    'Recorded eligible countries',
    'Recorded duration',
    'Official source',
  ]);
  assert.equal(valueFor(rows, 'student', 0).text, 'مطلوب');
  assert.equal(valueFor(english, 'card', 0).text, 'Not required');
  assert.equal(valueFor(rows, 'countries', 0).text, 'قائمة مسجلة: IQ');
  assert.equal(valueFor(english, 'countries', 0).text, 'Listed: IQ');
  assert.equal(valueFor(english, 'duration', 0).text, '12 months');
  assert.equal(valueFor(rows, 'source', 0).sources[0].url, 'https://official.example/offer');
});

test('missing and review-marked fields stay explicitly unknown in Arabic and English', () => {
  const empty = deal('empty', {
    benefits: [],
    eligibility: {
      student_status: 'unknown',
      card_required: 'unknown',
      new_account: 'unknown',
      phone_required: 'unknown',
      countries: { status: 'unknown', values: [] },
    },
    official_sources: [],
  });
  const marked = deal('marked', {
    review: { unknown_fields: ['eligibility.student_status', 'eligibility.countries.values', 'benefits.0.duration', 'official_sources'] },
  });
  const ar = buildComparisonRows([empty, marked], 'ar');
  const en = buildComparisonRows([empty, marked], 'en');
  for (const row of ar) {
    assert.equal(row.values[0].text, 'غير معلوم', row.key);
    if (['student', 'countries', 'duration', 'source'].includes(row.key))
      assert.equal(row.values[1].text, 'غير معلوم', row.key);
  }
  for (const key of ['student', 'card', 'new-account', 'phone', 'countries', 'duration', 'source']) {
    assert.equal(valueFor(en, key, 0).text, 'Unknown', key);
  }
  assert.equal(valueFor(en, 'student', 1).text, 'Unknown');
  assert.equal(valueFor(en, 'countries', 1).text, 'Unknown');
  assert.equal(valueFor(en, 'duration', 1).text, 'Unknown');
  assert.equal(valueFor(en, 'source', 1).text, 'Unknown');
});

test('country scope and unusual duration states are not inferred', () => {
  const contradictoryCountry = deal('odd-country', {
    eligibility: {
      student_status: 'not_required', card_required: 'unknown', new_account: 'unknown', phone_required: 'unknown',
      countries: { status: 'worldwide', values: ['IQ'] },
    },
  });
  const unknownDuration = deal('odd-duration', {
    benefits: [{ duration: { value: 12, unit: 'months', status: 'future-state' }, description: { ar: '', en: '' } }],
  });
  const rows = buildComparisonRows([contradictoryCountry, unknownDuration], 'en');
  assert.equal(valueFor(rows, 'countries', 0).text, 'Unknown');
  assert.equal(valueFor(rows, 'countries', 1).text, 'Listed: IQ');
  assert.equal(valueFor(rows, 'duration', 1).text, 'Unknown');
});

test('comparison flow accepts exactly two distinct valid slugs and blocks a third', () => {
  const first = toggleComparisonSelection([], 'alpha');
  assert.deepEqual(first, { selected: ['alpha'], added: true, removed: false, limitReached: false });
  const second = toggleComparisonSelection(first.selected, 'beta');
  assert.deepEqual(second.selected, ['alpha', 'beta']);
  const query = comparisonSearch(second.selected);
  assert.ok(query);
  assert.deepEqual(parseComparisonSlugs(query), ['alpha', 'beta']);
  assert.equal(routeUrl({ name: 'compare' }, `${query}&lang=en`), '/compare?offer=alpha&offer=beta&lang=en');
  assert.deepEqual(parseHash('/compare'), { name: 'compare' });

  const third = toggleComparisonSelection(second.selected, 'gamma');
  assert.equal(third.limitReached, true);
  assert.deepEqual(third.selected, ['alpha', 'beta']);
  const remove = toggleComparisonSelection(third.selected, 'alpha');
  assert.deepEqual(remove.selected, ['beta']);
  assert.equal(comparisonSearch(['same', 'same']), null);
  assert.deepEqual(parseComparisonSlugs('?offer=alpha&offer=alpha'), []);
  assert.deepEqual(parseComparisonSlugs('?offer=alpha&offer=beta&offer=gamma'), []);
  assert.deepEqual(parseComparisonSlugs('?offer=alpha&offer=bad%2Fslug'), []);
  assert.equal(toggleComparisonSelection([], 'invalid/slug').added, false);
});

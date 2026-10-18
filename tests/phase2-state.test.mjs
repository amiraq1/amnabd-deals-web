import assert from 'node:assert/strict';
import { test } from 'node:test';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const load = (name) =>
  import(pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, `src/lib/${name}.js`)));
const { parseFilterState, serializeFilterState, validateFilterState, buildDiscoveryHash } =
  await load('filterState');
const { parseHash, extractHashSearch } = await load('routes');
const keys = new Set(['cloud', 'all', 'سحابة', '']);
test('URL separates all categories, literal all and uncategorized', () => {
  assert.equal(parseFilterState('', keys).category, null);
  assert.equal(parseFilterState('category=all', keys).category, 'all');
  const u = parseFilterState('uncategorized=1', keys);
  assert.equal(u.category, null);
  assert.equal(u.uncategorized, true);
  assert.equal(serializeFilterState(u), 'uncategorized=1');
});
for (const search of [
  'uncategorized=2',
  'category=cloud&uncategorized=1',
  'category=&uncategorized=1',
])
  test(`URL invalid or conflicting ${search}`, () => {
    const s = parseFilterState(search, keys);
    assert.equal(s.categoryValidation, 'invalid');
    assert.equal(s.category, null);
    assert.equal(s.uncategorized, false);
    assert.equal(serializeFilterState(s), '');
    assert.equal(buildDiscoveryHash(s), '#/');
  });
test('URL category validates only after success, including successful empty dataset', () => {
  const pending = parseFilterState('category=cloud');
  assert.equal(pending.categoryValidation, 'pending');
  assert.equal(pending.category, 'cloud');
  assert.equal(validateFilterState(pending, keys).categoryValidation, 'valid');
  const invalid = validateFilterState(pending, new Set());
  assert.equal(invalid.categoryValidation, 'invalid');
  assert.equal(invalid.invalidCategory, 'cloud');
  assert.equal(invalid.category, null);
  // Revalidating the original raw state after a dataset change can recover a real category.
  assert.equal(validateFilterState(pending, keys).category, 'cloud');
});
test('URL first value wins even when invalid, percent decoding happens once', () => {
  const s = parseFilterState(
    'sort=bad&sort=deadline&applicant=bad&applicant=student&card=bad&card=not_required&q=50%&q=ignored',
    keys
  );
  assert.equal(s.sort, 'default');
  assert.equal(s.applicant, 'all');
  assert.equal(s.card, 'all');
  assert.equal(s.q, '50%');
  assert.equal(parseFilterState('q=%252F', keys).q, '%2F');
  assert.equal(parseFilterState('q=%', keys).q, '%');
});
test('URL canonical normalized roundtrip, Unicode limit, stable order and invalid cleanup', () => {
  for (const raw of [
    'q= GPT-4 &category=Cloud&sort=deadline&x=ignored',
    'uncategorized=1&card=not_required&applicant=student&q=سحابة',
    'category=missing&q=test',
    'category=all',
    'category=سحابة',
    'uncategorized=2',
  ]) {
    const first = parseFilterState(raw, keys);
    const canonical = serializeFilterState(first);
    const second = parseFilterState(canonical, keys);
    assert.equal(serializeFilterState(second), canonical);
  }
  assert.equal(Array.from(parseFilterState('q=' + '🧪'.repeat(130), keys).q).length, 120);
  assert.equal(
    serializeFilterState(
      parseFilterState('sort=deadline&card=not_required&applicant=student&category=cloud&q=x', keys)
    ),
    'q=x&category=cloud&applicant=student&card=not_required&sort=deadline'
  );
});
for (const hash of ['#/?q=50%', '#?q=50%'])
  test(`URL home route ${hash}`, () => {
    assert.deepEqual(parseHash(hash), { name: 'home' });
    assert.equal(extractHashSearch(hash), 'q=50%');
  });
test('URL slug decoding remains independent and once-only', () => {
  assert.deepEqual(parseHash('#/deal/%252F?q=x'), { name: 'deal', slug: '%2F' });
  assert.deepEqual(parseHash('#/deal/%E0%A4%A?q=x'), { name: 'notfound' });
  assert.equal(parseFilterState(extractHashSearch('#/?q=a?b'), keys).q, 'a?b');
});

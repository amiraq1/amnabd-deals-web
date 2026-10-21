// PR-3: link state. H-01 (a shared filtered link must survive a reload) and
// H-10 (the skip link must not wipe the search).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const load = (rel) =>
  import(pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, `src/lib/${rel}.js`)).href);

const { filterSearchFromLocation, isInPageHash, resolveLocationChange } = await load('routes');
const { parseFilterState } = await load('filterState');

const filters = (search) => parseFilterState(search);

// --- H-01: one source for the filter state --------------------------------
test('PR-3: modern search params are the source of truth', () => {
  assert.equal(
    filterSearchFromLocation('?q=deepgram&sort=deadline', '#/?q=old&sort=reviewed'),
    'q=deepgram&sort=deadline'
  );
  assert.equal(filters('q=deepgram&sort=deadline').q, 'deepgram');
  assert.equal(filters('q=deepgram&sort=deadline').sort, 'deadline');
});

test('PR-3: a legacy hash link still restores its filters', () => {
  const search = filterSearchFromLocation('', '#/?q=deepgram&sort=deadline');
  assert.equal(search, 'q=deepgram&sort=deadline');
  assert.equal(filters(search).q, 'deepgram');
});

test('PR-3: a non-filter query (shared list) does not shadow the legacy hash', () => {
  assert.equal(filterSearchFromLocation('?list=a,b', '#/?q=deepgram'), 'q=deepgram');
  assert.equal(filterSearchFromLocation('?list=a,b', '#/'), '');
});

test('PR-3: an empty value still counts as an explicit filter param', () => {
  assert.equal(filterSearchFromLocation('?q=', '#/?q=legacy'), 'q=');
  assert.equal(filters('q=').q, '');
});

test('PR-3: malformed and unknown params keep their current rules', () => {
  const parsed = filters('q=' + 'x'.repeat(200) + '&sort=bogus&applicant=alien');
  assert.equal(Array.from(parsed.q).length, 120);
  assert.equal(parsed.sort, 'default');
  assert.equal(parsed.applicant, 'all');
});

test('PR-3: an unknown category stays invalid and is not applied', () => {
  const parsed = parseFilterState('category=does-not-exist', new Set(['cloud', 'coding']));
  assert.equal(parsed.category, null);
  assert.equal(parsed.categoryValidation, 'invalid');
  assert.equal(parsed.filterError, 'category');
  assert.equal(parsed.invalidCategory, 'does-not-exist');
});

// --- H-10: the skip link is an in-page anchor, not a route ---------------
test('PR-3: only non-route hashes count as in-page anchors', () => {
  assert.equal(isInPageHash('#main-content'), true);
  assert.equal(isInPageHash('#how-to-activate'), true);
  assert.equal(isInPageHash('#/'), false);
  assert.equal(isInPageHash('#/deal/deepgram'), false);
  assert.equal(isInPageHash(''), false);
});

// --- popstate / back / forward -------------------------------------------
const at = (overrides) => ({
  pathname: '/',
  search: '',
  hash: '#/',
  lastAppliedHash: '#/',
  lastAppliedSearch: '',
  hadPending: false,
  ...overrides,
});

test('PR-3: the first load applies the location once', () => {
  const first = resolveLocationChange(at({ search: '?q=deepgram', lastAppliedHash: '' }));
  assert.equal(first.apply, true);
  assert.equal(filters(first.filterSearch).q, 'deepgram');
});

test('PR-3: a repeated hash with no pending write does not re-apply', () => {
  assert.equal(resolveLocationChange(at({})).apply, false);
});

test('PR-3: a pending debounced write re-applies even with the same hash', () => {
  assert.equal(resolveLocationChange(at({ hadPending: true })).apply, true);
});

test('PR-3: back and forward restore the right filter state', () => {
  // Filters live in location.search, so back/forward changes the query without
  // touching the hash. The decision must compare the query too.
  const loadA = resolveLocationChange(
    at({ search: '?q=alpha&sort=deadline', lastAppliedHash: '', lastAppliedSearch: '' })
  );
  assert.equal(loadA.apply, true);
  assert.equal(filters(loadA.filterSearch).q, 'alpha');

  const toB = resolveLocationChange(
    at({ search: '?q=beta', lastAppliedHash: '#/', lastAppliedSearch: 'q=alpha&sort=deadline' })
  );
  assert.equal(toB.apply, true);
  assert.equal(filters(toB.filterSearch).q, 'beta');

  const backToA = resolveLocationChange(
    at({ search: '?q=alpha&sort=deadline', lastAppliedHash: '#/', lastAppliedSearch: 'q=beta' })
  );
  assert.equal(backToA.apply, true);
  assert.equal(filters(backToA.filterSearch).q, 'alpha');
  assert.equal(filters(backToA.filterSearch).sort, 'deadline');

  const forwardToB = resolveLocationChange(
    at({ search: '?q=beta', lastAppliedHash: '#/', lastAppliedSearch: 'q=alpha&sort=deadline' })
  );
  assert.equal(forwardToB.apply, true);
  assert.equal(filters(forwardToB.filterSearch).q, 'beta');
});

test('PR-3: an unchanged query and hash are not re-applied', () => {
  const same = resolveLocationChange(
    at({ search: '?q=alpha', lastAppliedHash: '#/', lastAppliedSearch: 'q=alpha' })
  );
  assert.equal(same.apply, false);
});

test('PR-3: the decision always reports the current filter query', () => {
  // `filterSearch` is the live query, not a placeholder, even when nothing is
  // applied — so a caller never has to re-derive it from the location.
  const unchanged = resolveLocationChange(
    at({ search: '?q=alpha', lastAppliedHash: '#/', lastAppliedSearch: 'q=alpha' })
  );
  assert.equal(unchanged.apply, false);
  assert.equal(unchanged.filterSearch, 'q=alpha');

  const anchored = resolveLocationChange(
    at({ search: '?q=alpha&sort=deadline', hash: '#main-content' })
  );
  assert.equal(anchored.apply, false);
  assert.equal(anchored.filterSearch, 'q=alpha&sort=deadline');

  // A legacy hash with no modern query reports the hash's query.
  const legacy = resolveLocationChange(at({ search: '', hash: '#/?q=alpha' }));
  assert.equal(legacy.apply, true);
  assert.equal(legacy.filterSearch, 'q=alpha');
});

test('PR-3: the skip link changes nothing about the search', () => {
  const before = resolveLocationChange(
    at({ search: '?q=deepgram&sort=deadline', lastAppliedHash: '', lastAppliedSearch: '' })
  );
  const afterSkip = resolveLocationChange(
    at({ search: '?q=deepgram&sort=deadline', hash: '#main-content' })
  );
  assert.equal(before.apply, true);
  assert.equal(afterSkip.apply, false);
  // Nothing is recomputed, and the reported query is still the live one.
  assert.equal(afterSkip.filterSearch, 'q=deepgram&sort=deadline');

  // And the filters read straight from the location are untouched.
  const live = filters(filterSearchFromLocation('?q=deepgram&sort=deadline', '#main-content'));
  assert.equal(live.q, 'deepgram');
  assert.equal(live.sort, 'deadline');
});

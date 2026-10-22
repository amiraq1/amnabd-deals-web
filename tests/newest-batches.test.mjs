import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const load = (name) => import(pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, `src/lib/${name}.js`)));
const { sortDeals } = await load('dealSort');
const { validateDeals } = await load('validate');
const ref = new Date('2026-10-23T00:00:00Z');
const row = (id, created_at, extra = {}) => ({
  id, slug: id, name_ar: id, name_en: id, created_at, ...extra,
});

test('created_at survives validation with its full recorded precision and timezone', () => {
  for (const date of ['2026-10-22T22:12:06.187495+00:00', '2026-10-23T01:12:06.187495+03:00', '2026-10-22T22:12:06Z']) {
    const result = validateDeals([row('valid', date)]);
    assert.equal(result.rejectedRows, 0);
    assert.equal(result.values[0].created_at, date);
  }
});

test('missing or malformed creation timestamps do not invent dates or discard deals', () => {
  for (const date of [undefined, null, '', 'bad', '2026-02-30T00:00:00Z', '2026-10-22', '2026-10-22T12:00:00', '2026-10-22T12:00:00-00:00']) {
    const result = validateDeals([row('legacy', date)]);
    assert.equal(result.rejectedRows, 0);
    assert.equal(result.values[0].created_at, undefined);
  }
});

test('default order is newest batch first, not newest review, with stable same-batch order', () => {
  const rows = Object.freeze([
    row('old', '2026-10-19T10:00:00Z', { review: { reviewed_on: '2026-10-23' } }),
    row('new-a', '2026-10-22T22:12:06.187495+00:00'),
    row('middle', '2026-10-21T10:00:00Z'),
    row('new-b', '2026-10-23T01:12:06.187495+03:00'),
    row('missing', undefined),
    row('invalid', 'not-a-date'),
  ]);
  const sorted = sortDeals(rows, 'default', ref);
  assert.deepEqual(sorted.map((d) => d.id), ['new-a', 'new-b', 'middle', 'old', 'missing', 'invalid']);
  assert.notEqual(sorted, rows);
  assert.equal(rows[0].id, 'old');
  assert.deepEqual(sortDeals(rows.filter((d) => d.id !== 'new-a'), 'default', ref).map((d) => d.id), ['new-b', 'middle', 'old', 'missing', 'invalid']);
});

test('default remains chronological even for expired offers; explicit sort behavior is unchanged', () => {
  const rows = [
    row('active-old', '2026-10-19T10:00:00Z', { status: 'active', headline_value: '$100' }),
    row('expired-new', '2026-10-22T10:00:00Z', { status: 'expired', headline_value: '$200' }),
  ];
  assert.deepEqual(sortDeals(rows, 'default', ref).map((d) => d.id), ['expired-new', 'active-old']);
  assert.deepEqual(sortDeals(rows, 'highest_value', ref).map((d) => d.id), ['active-old', 'expired-new']);
});

test('server order is date descending, unknowns last, then deterministic id ascending', () => {
  const source = readFileSync(new URL('../src/lib/loadResources.ts', import.meta.url), 'utf8');
  assert.match(source, /\.order\('created_at', \{ ascending: false, nullsFirst: false \}\)\s*\.order\('id', \{ ascending: true \}\)/);
});

test('spotlight uses a prefix of the chronological results, never a separate review-date order', () => {
  const source = readFileSync(new URL('../src/pages/HomePage.tsx', import.meta.url), 'utf8');
  assert.match(source, /hasAnyActiveFilter \? \[\] : sorted\.slice\(0, 3\)/);
  assert.doesNotMatch(source, /newThisWeek|weekAgo/);
  assert.match(source, /الأحدث إضافةً/);
  assert.match(source, /Newest added/);
  for (const count of [0, 1, 2, 3, 4, 8]) {
    const sorted = Array.from({ length: count }, (_, i) => row(`deal-${i}`, undefined));
    const spotlight = sorted.slice(0, 3);
    const slugs = new Set(spotlight.map((d) => d.slug));
    const listed = sorted.filter((d) => !slugs.has(d.slug));
    assert.deepEqual([...spotlight, ...listed], sorted);
    assert.equal(new Set([...spotlight, ...listed].map((d) => d.slug)).size, count);
  }
});

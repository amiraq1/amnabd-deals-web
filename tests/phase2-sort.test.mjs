import assert from 'node:assert/strict';
import { test } from 'node:test';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const { parseCalendarDate, parseInstant, classifyDeadline, deadlineTierLabel, sortDeals } =
  await import(pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, 'src/lib/dealSort.js')));
const ref = new Date('2026-10-18T00:30:00Z');
const deadline = (date, status = 'known') => ({ date, status });
for (const value of [
  '2026-02-30',
  '2026-13-01',
  '2026-02-29',
  '2026-00-01',
  '2026-10-00',
  'junk',
  null,
])
  test(`UTC calendar rejects ${value}`, () => assert.equal(parseCalendarDate(value), null));
test('UTC calendar preserves leap years and low years without 1900 offset', () => {
  assert.equal(new Date(parseCalendarDate('2028-02-29')).toISOString().slice(0, 10), '2028-02-29');
  assert.equal(new Date(parseCalendarDate('0099-01-01')).getUTCFullYear(), 99);
});
for (const value of [
  '2026-02-30T00:00:00Z',
  '2026-10-18T24:00:00Z',
  '2026-10-18T00:60:00Z',
  '2026-10-18T00:00:60Z',
  '2026-10-18T00:00:00',
  '2026-10-18T00:00:00-00:00',
  '2026-10-18T00:00:00+24:00',
])
  test(`UTC instant rejects ${value}`, () => assert.equal(parseInstant(value), null));
test('UTC instants compare equal across explicit offsets and fractional seconds', () => {
  assert.equal(parseInstant('2026-10-18T03:30:00+03:00'), ref.getTime());
  assert.equal(parseInstant('2026-10-17T20:30:00-04:00'), ref.getTime());
  assert.equal(parseInstant('2026-10-18T00:30:00.123456789Z'), ref.getTime() + 123);
});
test('UTC calendar classification is independent from browser or process timezone', () => {
  assert.equal(classifyDeadline(deadline('2026-10-18'), ref).tier, 2);
  assert.equal(classifyDeadline(deadline('2026-10-17'), ref).tier, 3);
  assert.equal(classifyDeadline(deadline('2026-10-18T03:30:00+03:00'), ref).tier, 1);
  assert.equal(classifyDeadline(deadline('2026-10-17T23:59:59Z'), ref).tier, 3);
  assert.equal(classifyDeadline(deadline('2026-10-18', 'unknown'), ref).tier, 4);
  assert.equal(classifyDeadline(undefined, ref).tier, 4);
});
test('UTC sort is stable, immutable and has explicit four-tier ordering', () => {
  const row = (id, date, status = 'known') => ({
    id,
    review: { reviewed_on: date },
    registration: { deadline: deadline(date, status) },
  });
  const rows = Object.freeze([
    row('unknown', null),
    row('past-calendar', '2026-10-17'),
    row('exact-next', '2026-11-01T00:00:00Z'),
    row('calendar-now', '2026-10-18'),
    row('exact-now', '2026-10-18T00:30:00Z'),
    row('past-exact', '2026-10-17T10:00:00Z'),
    row('tie-exact', '2026-10-18T03:30:00+03:00'),
    row('bad', '2026-02-30'),
  ]);
  assert.deepEqual(
    sortDeals(rows, 'deadline', ref).map((x) => x.id),
    [
      'exact-now',
      'tie-exact',
      'exact-next',
      'calendar-now',
      'past-exact',
      'past-calendar',
      'unknown',
      'bad',
    ]
  );
  assert.deepEqual(sortDeals(rows, 'default', ref), rows);
  assert.notEqual(sortDeals(rows, 'default', ref), rows);
});
test('UTC artificial midnight tie keeps source order, never implies an expiry hour', () => {
  const a = { id: 'calendar', registration: { deadline: deadline('2026-10-17') } };
  const b = { id: 'exact', registration: { deadline: deadline('2026-10-17T00:00:00Z') } };
  assert.deepEqual(
    sortDeals([a, b], 'deadline', ref).map((x) => x.id),
    ['calendar', 'exact']
  );
  assert.match(
    deadlineTierLabel(a.registration.deadline, 'en', ref),
    /before the UTC reference day/
  );
  assert.doesNotMatch(deadlineTierLabel(a.registration.deadline, 'en', ref), /expired|00:00/);
});
test('UTC reviewed uses the same strict date parsers with stable invalids last', () => {
  const rows = ['2026-02-30', null, '2026-10-18T03:00:00+03:00', '2026-10-18', '2026-10-17'].map(
    (reviewed_on, id) => ({ id, review: { reviewed_on } })
  );
  assert.deepEqual(
    sortDeals(rows, 'reviewed', ref).map((x) => x.id),
    [2, 3, 4, 0, 1]
  );
});
test('UTC requires a valid explicit reference, never silently consults the clock', () => {
  assert.throws(() => sortDeals([], 'deadline', new Date('bad')), RangeError);
  assert.throws(() => sortDeals([], 'default'), RangeError);
});

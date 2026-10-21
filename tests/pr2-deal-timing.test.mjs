// PR-2: one timing model for offer expiry and registration deadline.
// Each test pins a rule from the review: status wins, a past ends_at expires the
// offer with a reason, a date-only ends_at expires only after 12:00 UTC of the
// following day, and a registration deadline never expires an offer.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const load = (rel) =>
  import(pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, `src/lib/${rel}.js`)).href);

const { getTimingState, offerExpiryInstant, ENDING_SOON_DAYS } = await load('dealTiming');
const { getChangelogEventType } = await load('changelog');
const { AGGREGATIONS } = await load('aggregations');

const at = (iso) => new Date(iso);

test('PR-2: no field at all yields unknown for both states', () => {
  const t = getTimingState({ slug: 'x' }, at('2026-10-21T12:00:00Z'));
  assert.equal(t.offer.state, 'unknown');
  assert.equal(t.offer.reason, null);
  assert.equal(t.registration.state, 'unknown');
  assert.equal(t.registration.date, null);
});

test('PR-2: the function never returns an "open"/"available" state', () => {
  const cases = [
    {},
    { status: 'active' },
    { status: 'verifying' },
    { status: 'ending_soon' },
    { status: 'expired' },
    { status: 'active', ends_at: '2027-01-01T00:00:00Z' },
  ];
  for (const deal of cases) {
    const t = getTimingState(deal, at('2026-10-21T12:00:00Z'));
    assert.ok(['expired', 'ending_soon', 'unknown'].includes(t.offer.state), JSON.stringify(deal));
    assert.ok(['passed', 'soon', 'unknown'].includes(t.registration.state), JSON.stringify(deal));
  }
});

test('PR-2: explicit status=expired wins over a future ends_at', () => {
  const t = getTimingState(
    { status: 'expired', ends_at: '2027-01-01T00:00:00Z' },
    at('2026-10-21T12:00:00Z')
  );
  assert.equal(t.offer.state, 'expired');
  assert.equal(t.offer.reason, 'status');
});

test('PR-2: Bolt case — status=active with a past ends_at is expired, with the date as reason', () => {
  const t = getTimingState(
    { status: 'active', ends_at: '2026-10-18T23:59:00-07:00' },
    at('2026-10-21T12:00:00Z')
  );
  assert.equal(t.offer.state, 'expired');
  assert.equal(t.offer.reason, 'ends_at');
});

test('PR-2: explicit timestamp expires exactly at the minute', () => {
  const ref = at('2026-10-21T12:00:00Z');
  const before = getTimingState({ status: 'active', ends_at: '2026-10-21T12:00:00Z' }, ref);
  assert.equal(before.offer.state, 'expired');

  const justBefore = getTimingState({ status: 'active', ends_at: '2026-10-21T12:01:00Z' }, ref);
  assert.notEqual(justBefore.offer.state, 'expired');
  assert.equal(justBefore.offer.state, 'ending_soon');

  const justAfter = getTimingState({ status: 'active', ends_at: '2026-10-21T11:59:00Z' }, ref);
  assert.equal(justAfter.offer.state, 'expired');
});

test('PR-2: a date-only ends_at expires after 12:00 UTC of the next day, in every timezone', () => {
  // 2026-10-21 date-only => expires 2026-10-22T12:00:00Z
  const deadline = offerExpiryInstant('2026-10-21');
  assert.equal(new Date(deadline).toISOString(), '2026-10-22T12:00:00.000Z');

  // Same instant, observed from Baghdad (UTC+3, 23:00 local) and LA (UTC-7, 13:00).
  const baghdad = at('2026-10-21T20:00:00Z');
  const losAngeles = at('2026-10-21T20:00:00Z');
  for (const ref of [baghdad, losAngeles]) {
    const t = getTimingState({ status: 'active', ends_at: '2026-10-21' }, ref);
    assert.equal(t.offer.state, 'ending_soon', ref.toISOString());
  }

  const stillOpen = getTimingState(
    { status: 'active', ends_at: '2026-10-21' },
    at('2026-10-22T11:59:00Z')
  );
  assert.equal(stillOpen.offer.state, 'ending_soon');

  const justExpired = getTimingState(
    { status: 'active', ends_at: '2026-10-21' },
    at('2026-10-22T12:00:00Z')
  );
  assert.equal(justExpired.offer.state, 'expired');
  assert.equal(justExpired.offer.reason, 'ends_at');
});

test('PR-2: "ending soon" comes from ends_at within the window, not from the deadline', () => {
  const ref = at('2026-10-21T12:00:00Z');
  const soon = getTimingState({ status: 'active', ends_at: '2026-10-31T00:00:00Z' }, ref);
  assert.equal(soon.offer.state, 'ending_soon');
  assert.equal(soon.offer.reason, 'ends_at');

  const far = getTimingState({ status: 'active', ends_at: '2027-01-31T00:00:00Z' }, ref);
  assert.equal(far.offer.state, 'unknown');

  // A registration deadline inside the window does NOT make the offer end soon.
  const deadlineSoon = getTimingState(
    { status: 'active', registration: { deadline: { status: 'known', date: '2026-10-25' } } },
    ref
  );
  assert.equal(deadlineSoon.offer.state, 'unknown');
  assert.equal(deadlineSoon.registration.state, 'soon');
});

test('PR-2: a passed registration deadline never expires the offer', () => {
  const ref = at('2026-10-21T12:00:00Z');
  const t = getTimingState(
    { status: 'active', registration: { deadline: { status: 'known', date: '2026-10-01' } } },
    ref
  );
  assert.equal(t.offer.state, 'unknown');
  assert.equal(t.registration.state, 'passed');
  assert.equal(t.registration.date, '2026-10-01');
});

test('PR-2: an unknown deadline status is not treated as a date', () => {
  const t = getTimingState(
    { status: 'active', registration: { deadline: { status: 'unknown', date: '2026-10-25' } } },
    at('2026-10-21T12:00:00Z')
  );
  assert.equal(t.registration.state, 'unknown');
  assert.equal(t.registration.date, null);
});

test('PR-2: ENDING_SOON_DAYS is the single window used everywhere', () => {
  assert.equal(ENDING_SOON_DAYS, 14);
});

test('PR-2: the ending-soon collection uses the same model as the card', () => {
  const filter = AGGREGATIONS['ending-soon'].filter;
  const ref = new Date();
  const inTenDays = new Date(ref.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString();
  const inSixtyDays = new Date(ref.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString();

  assert.equal(filter({ status: 'active', ends_at: inTenDays }), true);
  assert.equal(filter({ status: 'active', ends_at: inSixtyDays }), false);
  // The manual flag stays an explicit input for the same state.
  assert.equal(filter({ status: 'ending_soon' }), true);
  assert.equal(filter({ status: 'expired', ends_at: inTenDays }), false);
});

test('PR-2: the changelog classifies expiry with the same model', () => {
  const ref = at('2026-10-21T12:00:00Z');
  assert.equal(getChangelogEventType({ status: 'active', ends_at: '2026-10-18' }, ref), 'expired');
  assert.equal(
    getChangelogEventType({ status: 'active', ends_at: '2026-10-28T00:00:00Z' }, ref),
    'ending_soon'
  );
  assert.equal(getChangelogEventType({ status: 'active' }, ref), 'active');
  assert.equal(
    getChangelogEventType({ status: 'active', review: { verification_status: 'verified' } }, ref),
    'verified'
  );
});

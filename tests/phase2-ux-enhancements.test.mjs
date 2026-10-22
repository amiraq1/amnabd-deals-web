import assert from 'node:assert/strict';
import { test } from 'node:test';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const { getDealNumericValue, sortDeals } = await import(
  pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, 'src/lib/dealSort.js'))
);

const ref = new Date('2026-10-20T12:00:00Z');

test('getDealNumericValue correctly extracts benefits amount', () => {
  const deal = {
    benefits: [{ amount: { value: 250, currency: 'USD' } }],
  };
  assert.equal(getDealNumericValue(deal), 250);
});

test('getDealNumericValue handles k and m suffixes and currency symbols', () => {
  assert.equal(getDealNumericValue({ headline_value: '$100k رصيد سحابي' }), 100000);
  assert.equal(getDealNumericValue({ headline_value: '$1.5M رصيد' }), 1500000);
  assert.equal(getDealNumericValue({ headline_value: 'بقيمة $1,250 دولار' }), 1250);
  assert.equal(getDealNumericValue({ headline_value: '100 USD' }), 100);
});

test('getDealNumericValue returns null when no credit amount is recorded', () => {
  assert.equal(getDealNumericValue({ headline_value: '3 أشهر مجانية' }), null);
  assert.equal(getDealNumericValue({ headline_value: 'مجاني للطلاب' }), null);
  assert.equal(getDealNumericValue({}), null);
});

test('getDealNumericValue does not turn a price cut into a free balance', () => {
  // A discounted paid plan is not a credit. Sorting it by `regular - offer`
  // advertised savings the record never granted (audit C-01).
  assert.equal(getDealNumericValue({ pricing: { original_price: 60, offer_price: 10 } }), null);
  assert.equal(getDealNumericValue({ pricing: { original_price: 120, offer_price: 0 } }), null);
  assert.equal(getDealNumericValue({ pricing: { regular_price: 500, offer_price: 100 } }), null);
});

test('sortDeals highest_value puts a deal with no proven value last', () => {
  const deals = [
    { id: 'discount', pricing: { original_price: 1000, offer_price: 0 }, status: 'active' },
    { id: 'credit', headline_value: '$50 رصيد', status: 'active' },
  ];
  assert.deepEqual(
    sortDeals(deals, 'highest_value', ref).map((d) => d.id),
    ['credit', 'discount']
  );
});

test('sortDeals highest_value orders from largest to smallest value and puts expired last', () => {
  const deals = [
    { id: '1', headline_value: '$50 رصيد', status: 'active' },
    { id: '2', headline_value: '$100k رصيد', status: 'active' },
    { id: '3', headline_value: '$1M رصيد', status: 'expired' }, // expired stays last
    { id: '4', headline_value: '$1,000 رصيد', status: 'active' },
  ];

  const sorted = sortDeals(deals, 'highest_value', ref);
  assert.deepEqual(
    sorted.map((d) => d.id),
    ['2', '4', '1', '3']
  );
});

test('sortDeals ending_soon prioritizes ending_soon status and nearest ends_at, nulls last', () => {
  const deals = [
    { id: 'no-date', ends_at: null, status: 'active' },
    { id: 'near-future', ends_at: '2026-10-25T00:00:00Z', status: 'active' },
    { id: 'ending-flag', ends_at: '2026-10-22T00:00:00Z', status: 'ending_soon' },
    { id: 'far-future', ends_at: '2026-12-01T00:00:00Z', status: 'active' },
    { id: 'already-expired', ends_at: '2026-10-15T00:00:00Z', status: 'expired' },
  ];

  const sorted = sortDeals(deals, 'ending_soon', ref);
  assert.deepEqual(
    sorted.map((d) => d.id),
    ['ending-flag', 'near-future', 'far-future', 'no-date', 'already-expired']
  );
});

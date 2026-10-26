// REC-04 — the sample deal is a template, so it must not teach invented data.
//
// The previous template carried `original_price: 2400` and benefit types the UI
// does not know (`tier_access`), which rendered as "غير معلوم" while looking
// authoritative. This test keeps the template honest: no invented numbers, no
// headline claim, eligibility that fails closed, and vocabulary the formatters
// can actually render.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';

const load = (name) =>
  import(pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, `src/lib/${name}.js`)).href);

const { validateDeals } = await load('validate');
const { benefitTypeLabel, frequencyLabel } = await load('format');

const sample = JSON.parse(readFileSync(join(process.cwd(), 'sample-deal.json'), 'utf8'));
const deal = validateDeals([sample]).values[0];

test('REC-04: the template survives validation as one deal', () => {
  const report = validateDeals([sample]);
  assert.equal(report.values.length, 1);
  assert.equal(report.values[0].slug, 'sample-offer');
});

test('REC-04: the template carries no invented price or benefit amount', () => {
  assert.equal(deal.pricing.offer_price, null);
  assert.equal(deal.pricing.original_price, null);
  assert.equal(deal.benefits[0].amount.value, null);
  // A missing headline stays missing rather than being derived from the name.
  assert.ok(!deal.headline_value, `headline_value should be empty, got ${deal.headline_value}`);
});

test('REC-04: eligibility fails closed in the template', () => {
  assert.equal(deal.eligibility.open_to_all, 'unknown');
  assert.equal(deal.eligibility.card_required, 'unknown');
  assert.equal(deal.eligibility.student_status, 'unknown');
});

test('REC-04: the template uses vocabulary the UI can render', () => {
  const type = deal.benefits[0].type;
  const frequency = deal.benefits[0].frequency;
  assert.notEqual(benefitTypeLabel(type, 'ar'), 'غير معلوم', `unknown benefit type: ${type}`);
  assert.notEqual(frequencyLabel(frequency, 'ar'), 'غير معلوم', `unknown frequency: ${frequency}`);
});

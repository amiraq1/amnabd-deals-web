import assert from 'node:assert/strict';
import { test } from 'node:test';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const { getSavedOffersEndingSoon } = await import(
  pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, 'src/lib/savedOfferExpiry.js')).href
);

const DAY_MS = 24 * 60 * 60 * 1000;
const referenceNow = new Date('2026-10-24T12:00:00.000Z');
const at = (millisecondsFromNow) => new Date(referenceNow.getTime() + millisecondsFromNow).toISOString();
const deal = (slug, ends_at, status = 'active') => ({ slug, ends_at, status });

test('saved expiry section includes the exact 14-day boundary and preserves offer order', () => {
  const newest = deal('newest', at(2 * DAY_MS));
  const boundary = deal('boundary', at(14 * DAY_MS));
  const outside = deal('outside', at(14 * DAY_MS + 1));

  assert.deepEqual(getSavedOffersEndingSoon([newest, boundary, outside], referenceNow), [newest, boundary]);
});

test('saved expiry section excludes offers with unknown or missing end times, even when flagged ending_soon', () => {
  const unknown = deal('unknown', null, 'ending_soon');
  const missing = { slug: 'missing', status: 'active' };
  const blank = deal('blank', '   ');

  assert.deepEqual(getSavedOffersEndingSoon([unknown, missing, blank], referenceNow), []);
});

test('saved expiry section excludes expired offers by timestamp and explicit status', () => {
  const atBoundary = deal('at-now', referenceNow.toISOString());
  const past = deal('past', at(-1));
  const explicitlyExpired = deal('status-expired', at(3 * DAY_MS), 'expired');

  assert.deepEqual(getSavedOffersEndingSoon([atBoundary, past, explicitlyExpired], referenceNow), []);
});

test('saved expiry section excludes invalid timestamps instead of inferring an end date', () => {
  const invalid = deal('invalid', 'next Friday');
  const textOnly = deal('text-only', null);

  assert.deepEqual(getSavedOffersEndingSoon([invalid, textOnly], referenceNow), []);
});

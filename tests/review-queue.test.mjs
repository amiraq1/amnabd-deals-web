import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildReviewQueue,
  checkSourceUrl,
  createPinnedLookup,
  inspectSourceFetches,
} from '../scripts/review-queue.mjs';

const publicLookup = async () => [{ address: '93.184.216.34', family: 4 }];

test('socket DNS callback is pinned to the already-validated public address', async () => {
  const pinned = createPinnedLookup('93.184.216.34', 4);
  const resolve = (options) => new Promise((resolve, reject) => {
    pinned('offers.example.com', options, (error, ...result) => error ? reject(error) : resolve(result));
  });
  assert.deepEqual(await resolve({ all: true }), [[{ address: '93.184.216.34', family: 4 }]]);
  assert.deepEqual(await resolve({}), ['93.184.216.34', 4]);
  assert.throws(() => createPinnedLookup('10.0.0.4', 4), /validated public IP/);
});

test('review queue marks only reviews older than 30 days and does not mutate deals', () => {
  const deals = [
    { slug: '31-days-old', review: { reviewed_on: '2026-09-23' }, status: 'active' },
    { slug: '30-days-old', review: { reviewed_on: '2026-09-24' }, status: 'active' },
    { slug: 'missing-date', review: { reviewed_on: '2026-02-30' }, status: 'active' },
    { slug: 'future-date', review: { reviewed_on: '2026-10-25' }, status: 'active' },
  ];
  const original = structuredClone(deals);
  const report = buildReviewQueue(deals, { now: '2026-10-24' });
  assert.deepEqual(report.stale_reviews, [
    {
      slug: '31-days-old',
      reviewed_on: '2026-09-23',
      reason: 'review_older_than_30_days',
      days_since_review: 31,
      status: 'review needed',
    },
    {
      slug: 'missing-date',
      reviewed_on: '2026-02-30',
      reason: 'missing_or_invalid_review_date',
      status: 'review needed',
    },
    {
      slug: 'future-date',
      reviewed_on: '2026-10-25',
      reason: 'future_review_date',
      status: 'review needed',
    },
  ]);
  assert.deepEqual(deals, original);
  assert.equal(report.read_only, true);
  assert.equal(report.writes_performed, false);
});

test('failed source checks are labeled could not fetch / review needed, never expired', async () => {
  let pinnedAddress;
  const result = await checkSourceUrl('https://offers.example.com/terms', {
    lookupImpl: publicLookup,
    requestImpl: async (_url, _method, options) => {
      pinnedAddress = { address: options.address, family: options.family };
      return { status: 404 };
    },
  });
  assert.deepEqual(pinnedAddress, { address: '93.184.216.34', family: 4 });
  assert.deepEqual(result, { ok: false, reason: 'http_404', http_status: 404 });
  const report = buildReviewQueue([{ slug: 'source-failed', review: { reviewed_on: '2026-10-24' } }], {
    now: '2026-10-24',
    sourceChecks: [{ slug: 'source-failed', source_url: 'https://offers.example.com/terms', result }],
  });
  assert.equal(report.source_fetch_failures[0].status, 'could not fetch / review needed');
  assert.equal(report.source_fetch_failures[0].reason, 'http_404');
  assert.doesNotMatch(report.source_fetch_failures[0].status, /expired/i);
  assert.equal(report.writes_performed, false);
});

test('HEAD method rejection falls back to a bounded GET and keeps failed fetch as review-only', async () => {
  const methods = [];
  const result = await checkSourceUrl('https://offers.example.com/terms', {
    lookupImpl: publicLookup,
    requestImpl: async (_url, method) => {
      methods.push(method);
      return { status: method === 'HEAD' ? 405 : 403 };
    },
  });
  assert.deepEqual(methods, ['HEAD', 'GET']);
  assert.deepEqual(result, { ok: false, reason: 'http_403', http_status: 403 });
});

test('unsafe/private destinations are rejected before any HTTP request', async () => {
  let requests = 0;
  const http = await checkSourceUrl('http://offers.example.com/terms', {
    lookupImpl: publicLookup,
    requestImpl: async () => { requests += 1; return { status: 200 }; },
  });
  assert.equal(http.reason, 'unsafe_or_non_https_source_url');
  const privateDns = await checkSourceUrl('https://offers.example.com/terms', {
    lookupImpl: async () => [{ address: '10.0.0.4', family: 4 }],
    requestImpl: async () => { requests += 1; return { status: 200 }; },
  });
  assert.equal(privateDns.reason, 'unsafe_destination');
  assert.equal(requests, 0);
});

test('source URLs are checked once even when shared, with empty-source offers flagged', async () => {
  let requests = 0;
  const checks = await inspectSourceFetches([
    { slug: 'one', official_sources: [{ url: 'https://offers.example.com/terms' }] },
    { slug: 'two', official_sources: [{ url: 'https://offers.example.com/terms' }] },
    { slug: 'three', official_sources: [] },
  ], {
    lookupImpl: publicLookup,
    requestImpl: async () => { requests += 1; return { status: 200 }; },
  });
  assert.equal(requests, 1);
  assert.equal(checks.length, 3);
  assert.equal(checks[0].result.ok, true);
  assert.equal(checks[1].result.ok, true);
  assert.equal(checks[2].result.reason, 'no_official_source_url');
});

test('text date windows without ends_at enter review queue, without changing offer state', () => {
  const deals = [
    {
      slug: 'timed-window',
      status: 'active',
      ends_at: null,
      review: { reviewed_on: '2026-10-24' },
      description_en: 'The offer ends October 31, 2026 at 11:59 PM PT.',
    },
    {
      slug: 'date-only-window',
      status: 'active',
      ends_at: null,
      review: { reviewed_on: '2026-10-24' },
      description_en: 'Redeem by December 31, 2026.',
    },
  ];
  const original = structuredClone(deals);
  const report = buildReviewQueue(deals, { now: '2026-10-24' });
  assert.deepEqual(report.date_window_missing_ends_at.map((item) => item.slug).sort(), [
    'date-only-window',
    'timed-window',
  ]);
  assert.ok(report.date_window_missing_ends_at.every((item) => item.status === 'review needed'));
  assert.deepEqual(deals, original);
  assert.equal(report.date_window_missing_ends_at.some((item) => item.status === 'expired'), false);
});

test('user reports are explicitly omitted when there is no safe live read surface', () => {
  const report = buildReviewQueue([], { now: '2026-10-24' });
  assert.equal(report.user_reports.included, false);
  assert.match(report.user_reports.reason, /no deal_reports table/i);
});

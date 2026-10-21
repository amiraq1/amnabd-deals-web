import assert from 'node:assert/strict';
import { test, beforeEach } from 'node:test';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const {
  REPORT_REASON_OPTIONS,
  hasRecentlyReported,
  submitDealReport,
} = await import(
  pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, 'src/lib/dealReports.js'))
);

const {
  buildSharedFavoritesUrl,
  parseSharedListParam,
  formatFavoritesAsText,
} = await import(
  pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, 'src/lib/shareFavorites.js'))
);

// Mock localStorage for dealReports in Node environment
const mockStorage = new Map();
globalThis.window = {
  localStorage: {
    getItem: (key) => (mockStorage.has(key) ? mockStorage.get(key) : null),
    setItem: (key, val) => mockStorage.set(key, String(val)),
    removeItem: (key) => mockStorage.delete(key),
    clear: () => mockStorage.clear(),
  },
  location: {
    origin: 'https://amnabd.com',
  },
};

beforeEach(() => {
  mockStorage.clear();
});

test('REPORT_REASON_OPTIONS defines exactly 4 quick report reasons', () => {
  assert.equal(REPORT_REASON_OPTIONS.length, 4);
  const values = REPORT_REASON_OPTIONS.map((opt) => opt.value);
  assert.deepEqual(values, ['expired', 'card_changed', 'terms_changed', 'broken_link']);
});

test('submitDealReport blocks bots via honeypot field', async () => {
  const result = await submitDealReport({
    dealSlug: 'cursor-pro',
    reason: 'expired',
    honeypot: 'http://spam-bot.example.com',
  });
  assert.equal(result.ok, true);
  assert.equal(result.mode, 'blocked_bot');
  assert.equal(hasRecentlyReported('cursor-pro'), false);
});

test('submitDealReport rejects empty or invalid deal slug', async () => {
  await assert.rejects(
    async () => {
      await submitDealReport({
        dealSlug: '   ',
        reason: 'expired',
      });
    },
    { message: 'معرّف العرض غير صالح' }
  );
});

test('submitDealReport successfully reports and activates 24h cooldown', async () => {
  const slug = 'bolt-builders-week';
  assert.equal(hasRecentlyReported(slug), false);

  const res1 = await submitDealReport({
    dealSlug: slug,
    reason: 'terms_changed',
    note: 'شروط العرض تغيرت وأصبح يتطلب دعوة',
  });

  assert.equal(res1.ok, true);
  assert.equal(res1.mode, 'local_fallback');
  assert.equal(hasRecentlyReported(slug), true);

  // Second submission triggers cooldown
  const res2 = await submitDealReport({
    dealSlug: slug,
    reason: 'expired',
  });
  assert.equal(res2.ok, true);
  assert.equal(res2.alreadyReported, true);
});

test('buildSharedFavoritesUrl produces a clean canonical share URL', () => {
  const url = buildSharedFavoritesUrl(['bolt', 'cursor', 'lovable'], 'https://amnabd.com');
  assert.equal(url, 'https://amnabd.com/?list=bolt%2Ccursor%2Clovable');

  const emptyUrl = buildSharedFavoritesUrl([], 'https://amnabd.com');
  assert.equal(emptyUrl, 'https://amnabd.com/');
});

test('parseSharedListParam extracts and cleans slugs from search string or hash', () => {
  const slugs1 = parseSharedListParam('?list=bolt,cursor-pro,lovable_dev');
  assert.deepEqual(slugs1, ['bolt', 'cursor-pro', 'lovable_dev']);

  // Filters out malformed tokens
  const slugs2 = parseSharedListParam('list=deal1,,<script>,deal2');
  assert.deepEqual(slugs2, ['deal1', 'deal2']);

  // Empty when param absent
  assert.deepEqual(parseSharedListParam('?sort=ending_soon'), []);
});

test('formatFavoritesAsText builds formatted markdown for Telegram / X', () => {
  const mockDeals = [
    {
      id: '1',
      slug: 'bolt-deal',
      name: 'Bolt',
      name_ar: 'بولت',
      name_en: 'Bolt',
      headline_value: '$100 رصيد',
    },
    {
      id: '2',
      slug: 'cursor-pro',
      name: 'Cursor',
      name_ar: 'كيرسور',
      name_en: 'Cursor',
      headline_value: 'أسبوعين مجاناً',
    },
  ];

  const text = formatFavoritesAsText(mockDeals, new Set(['bolt-deal', 'cursor-pro']), 'https://amnabd.com');
  assert.ok(text.includes('1. Bolt ($100 رصيد)'));
  assert.ok(text.includes('https://amnabd.com/deal/bolt-deal'));
  assert.ok(text.includes('2. Cursor (أسبوعين مجاناً)'));
  assert.ok(text.includes('https://amnabd.com/deal/cursor-pro'));
  assert.ok(text.includes('https://amnabd.com/?list=bolt-deal%2Ccursor-pro'));
});

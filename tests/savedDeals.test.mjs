import assert from 'node:assert/strict';
import { test, beforeEach } from 'node:test';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const {
  SAVED_DEALS_STORAGE_KEY,
  SAVED_DEALS_EVENT,
  getSavedDeals,
  isDealSaved,
  saveDeal,
  removeSavedDeal,
  toggleSavedDeal,
  clearSavedDeals,
  _resetMemoryFallback,
} = await import(pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, 'src/lib/savedDeals.js')));

// Create an in-memory Storage mock
function createMockStorage(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return store.get(key) ?? null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
    get length() {
      return store.size;
    },
    key(index) {
      return Array.from(store.keys())[index] ?? null;
    },
    _raw: store,
  };
}

beforeEach(() => {
  _resetMemoryFallback();
});

test('constants match expected keys', () => {
  assert.equal(SAVED_DEALS_STORAGE_KEY, 'amnabd_saved_deals_v1');
  assert.equal(SAVED_DEALS_EVENT, 'amnabd:saved-deals-changed');
});

test('getSavedDeals returns empty array on empty storage', () => {
  const storage = createMockStorage();
  assert.deepEqual(getSavedDeals(storage), []);
});

test('saveDeal adds item to storage and deduplicates', () => {
  const storage = createMockStorage();
  assert.equal(saveDeal('openai', storage), true);
  assert.equal(isDealSaved('openai', storage), true);
  assert.deepEqual(getSavedDeals(storage), ['openai']);

  // Duplicate save returns false and does not duplicate
  assert.equal(saveDeal('openai', storage), false);
  assert.deepEqual(getSavedDeals(storage), ['openai']);

  // Add another
  assert.equal(saveDeal('claude', storage), true);
  assert.deepEqual(getSavedDeals(storage), ['openai', 'claude']);
});

test('saveDeal ignores empty, whitespace, and non-string values', () => {
  const storage = createMockStorage();
  assert.equal(saveDeal('', storage), false);
  assert.equal(saveDeal('   ', storage), false);
  assert.equal(saveDeal(null, storage), false);
  assert.equal(saveDeal(undefined, storage), false);
  assert.deepEqual(getSavedDeals(storage), []);
});

test('removeSavedDeal removes existing item and ignores missing', () => {
  const storage = createMockStorage({
    [SAVED_DEALS_STORAGE_KEY]: JSON.stringify(['deal-a', 'deal-b']),
  });

  assert.equal(removeSavedDeal('deal-a', storage), true);
  assert.deepEqual(getSavedDeals(storage), ['deal-b']);
  assert.equal(isDealSaved('deal-a', storage), false);

  // Removing non-existent returns false
  assert.equal(removeSavedDeal('deal-a', storage), false);
  assert.deepEqual(getSavedDeals(storage), ['deal-b']);
});

test('toggleSavedDeal adds when absent and removes when present', () => {
  const storage = createMockStorage();

  const added = toggleSavedDeal('cursor', storage);
  assert.equal(added, true);
  assert.equal(isDealSaved('cursor', storage), true);
  assert.deepEqual(getSavedDeals(storage), ['cursor']);

  const removed = toggleSavedDeal('cursor', storage);
  assert.equal(removed, false);
  assert.equal(isDealSaved('cursor', storage), false);
  assert.deepEqual(getSavedDeals(storage), []);
});

test('clearSavedDeals empties storage and memory fallback', () => {
  const storage = createMockStorage({
    [SAVED_DEALS_STORAGE_KEY]: JSON.stringify(['one', 'two']),
  });
  assert.equal(getSavedDeals(storage).length, 2);

  clearSavedDeals(storage);
  assert.deepEqual(getSavedDeals(storage), []);
});

test('resilience: corrupted JSON returns empty array without throwing', () => {
  const storage = createMockStorage({
    [SAVED_DEALS_STORAGE_KEY]: '{bad-json-syntax',
  });
  assert.doesNotThrow(() => {
    assert.deepEqual(getSavedDeals(storage), []);
  });
});

test('resilience: non-array stored value returns empty array safely', () => {
  const storage = createMockStorage({
    [SAVED_DEALS_STORAGE_KEY]: JSON.stringify({ notAnArray: true }),
  });
  assert.deepEqual(getSavedDeals(storage), []);

  const stringStorage = createMockStorage({
    [SAVED_DEALS_STORAGE_KEY]: JSON.stringify('a-string'),
  });
  assert.deepEqual(getSavedDeals(stringStorage), []);
});

test('resilience: in-memory fallback operates when storage is null', () => {
  assert.deepEqual(getSavedDeals(null), []);
  assert.equal(saveDeal('memory-deal', null), true);
  assert.equal(isDealSaved('memory-deal', null), true);
  assert.deepEqual(getSavedDeals(null), ['memory-deal']);

  assert.equal(toggleSavedDeal('memory-deal', null), false);
  assert.deepEqual(getSavedDeals(null), []);
});

test('resilience: QuotaExceededError or setItem failure does not crash and preserves in-memory', () => {
  const storage = {
    getItem() {
      return null;
    },
    setItem() {
      const err = new Error('QuotaExceededError');
      err.name = 'QuotaExceededError';
      throw err;
    },
    removeItem() {},
    clear() {},
  };

  assert.doesNotThrow(() => {
    const saved = saveDeal('fallback-under-quota', storage);
    assert.equal(saved, true);
  });

  // Memory fallback retains the item even though storage.setItem threw
  assert.equal(isDealSaved('fallback-under-quota', storage), true);
});

test('handles Arabic and Unicode slugs gracefully', () => {
  const storage = createMockStorage();
  const arabicSlug = 'منصة-الذكاء-الاصطناعي';
  assert.equal(saveDeal(arabicSlug, storage), true);
  assert.equal(isDealSaved(arabicSlug, storage), true);
  assert.deepEqual(getSavedDeals(storage), [arabicSlug]);
  assert.equal(removeSavedDeal(arabicSlug, storage), true);
  assert.equal(isDealSaved(arabicSlug, storage), false);
});

test('dead ID isolation: only active deals in catalog count towards valid saved count', () => {
  const storage = createMockStorage({
    [SAVED_DEALS_STORAGE_KEY]: JSON.stringify(['active-1', 'dead-deal-999', 'active-2', 'deprecated-xyz']),
  });

  const catalog = [
    { slug: 'active-1', name_en: 'Active 1' },
    { slug: 'active-2', name_en: 'Active 2' },
    { slug: 'active-3', name_en: 'Active 3' },
  ];

  const available = new Set(catalog.map((d) => d.slug));
  const saved = getSavedDeals(storage);

  const validSavedCount = saved.filter((s) => available.has(s)).length;
  assert.equal(validSavedCount, 2);
  assert.equal(saved.length, 4);
});


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
    [SAVED_DEALS_STORAGE_KEY]: JSON.stringify([
      'active-1',
      'dead-deal-999',
      'active-2',
      'deprecated-xyz',
    ]),
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

// Regression contracts added after inspecting the merged phase-three implementation.
for (const raw of ['{broken', '{"not":"array"}', 'null', '"value"']) {
  test(`corrupt/non-array data clears an existing memory snapshot: ${raw}`, () => {
    const storage = createMockStorage();
    saveDeal('old', storage);
    storage.setItem(SAVED_DEALS_STORAGE_KEY, raw);
    assert.deepEqual(getSavedDeals(storage), []);
    assert.deepEqual(getSavedDeals(null), []);
  });
}
test('key removal clears cached data before a later storage failure', () => {
  const storage = createMockStorage();
  saveDeal('old', storage);
  storage.removeItem(SAVED_DEALS_STORAGE_KEY);
  assert.deepEqual(getSavedDeals(storage), []);
  storage.getItem = () => {
    throw Error('denied');
  };
  assert.deepEqual(getSavedDeals(storage), []);
});
test('getItem failure retains memory edits while writes also remain unavailable', () => {
  const storage = createMockStorage();
  saveDeal('before-failure', storage);
  storage.getItem = () => {
    throw Error('denied');
  };
  storage.setItem = () => {
    throw Error('quota');
  };
  saveDeal('memory-edit', storage);
  storage.getItem = () => '["stale-on-disk"]';
  assert.deepEqual(getSavedDeals(storage), ['before-failure', 'memory-edit']);
  removeSavedDeal('before-failure', storage);
  assert.deepEqual(getSavedDeals(storage), ['memory-edit']);
});
test('quota failure retains previous saves and removal for the rest of the tab session', () => {
  const storage = createMockStorage();
  saveDeal('one', storage);
  storage.setItem = () => {
    throw Error('quota');
  };
  saveDeal('two', storage);
  removeSavedDeal('one', storage);
  assert.deepEqual(getSavedDeals(storage), ['two']);
  clearSavedDeals(storage);
  assert.deepEqual(getSavedDeals(storage), []);
});
test('stored IDs are strings, trimmed and unique without prototype semantics', () => {
  const storage = createMockStorage({
    [SAVED_DEALS_STORAGE_KEY]: JSON.stringify([
      ' a ',
      'a',
      '',
      null,
      2,
      {},
      '__proto__',
      'constructor',
    ]),
  });
  assert.deepEqual(getSavedDeals(storage), ['a', '__proto__', 'constructor']);
});
test('returned arrays cannot mutate the saved state', () => {
  saveDeal('one', null);
  const list = getSavedDeals(null);
  list.push('injected');
  assert.deepEqual(getSavedDeals(null), ['one']);
});
test('blocked localStorage getter is contained and reported as session-only', async () => {
  const { isSavedDealsSessionOnly } = await import(
    pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, 'src/lib/savedDeals.js'))
  );
  const previous = globalThis.window;
  globalThis.window = Object.defineProperty({}, 'localStorage', {
    get() {
      throw Error('SecurityError');
    },
  });
  try {
    assert.equal(saveDeal('temporary'), true);
    assert.deepEqual(getSavedDeals(), ['temporary']);
    assert.equal(isSavedDealsSessionOnly(), true);
  } finally {
    if (previous === undefined) delete globalThis.window;
    else globalThis.window = previous;
  }
});
test('same-window events, storage remove/clear and unsubscribe stay synchronized', async () => {
  const { subscribeSavedDeals } = await import(
    pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, 'src/lib/savedDeals.js'))
  );
  const previous = globalThis.window;
  const win = new EventTarget();
  win.localStorage = createMockStorage();
  globalThis.window = win;
  const snapshots = [];
  const off = subscribeSavedDeals(() => snapshots.push(getSavedDeals()));
  const storageEvent = (key, storageArea = win.localStorage) => {
    const e = new Event('storage');
    Object.defineProperties(e, { key: { value: key }, storageArea: { value: storageArea } });
    win.dispatchEvent(e);
  };
  try {
    saveDeal('one');
    assert.deepEqual(snapshots, [['one']]);
    win.localStorage.setItem(SAVED_DEALS_STORAGE_KEY, '["two"]');
    storageEvent(SAVED_DEALS_STORAGE_KEY);
    assert.deepEqual(snapshots.at(-1), ['two']);
    win.localStorage.removeItem(SAVED_DEALS_STORAGE_KEY);
    storageEvent(null);
    assert.deepEqual(snapshots.at(-1), []);
    const size = snapshots.length;
    storageEvent('other-key');
    storageEvent(SAVED_DEALS_STORAGE_KEY, createMockStorage());
    assert.equal(snapshots.length, size);
    off();
    saveDeal('after-unsubscribe');
    storageEvent(null);
    assert.equal(snapshots.length, size);
  } finally {
    off();
    if (previous === undefined) delete globalThis.window;
    else globalThis.window = previous;
  }
});

test('500 cap filters unique keys and adding at the limit is a no-op', async () => {
  const { MAX_SAVED_DEALS, sanitizeSavedDealKeys } = await import(
    pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, 'src/lib/savedDeals.js'))
  );
  assert.equal(MAX_SAVED_DEALS, 500);
  const values = Array.from({ length: 600 }, (_, i) => 'k' + i);
  assert.equal(sanitizeSavedDealKeys(['', 'k0', 'k0', null, ...values]).length, 500);
  const storage = createMockStorage({ [SAVED_DEALS_STORAGE_KEY]: JSON.stringify(values) });
  assert.equal(saveDeal('extra', storage), false);
  assert.equal(toggleSavedDeal('extra', storage), false);
  assert.equal(getSavedDeals(storage).length, 500);
  removeSavedDeal('k0', storage);
  assert.equal(saveDeal('extra', storage), true);
});
test('later successful write recovers degraded mode without dropping memory edits', async () => {
  const { isSavedDealsSessionOnly } = await import(
    pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, 'src/lib/savedDeals.js'))
  );
  const storage = createMockStorage();
  saveDeal('one', storage);
  const write = storage.setItem;
  storage.setItem = () => {
    throw Error('quota');
  };
  saveDeal('two', storage);
  assert.equal(isSavedDealsSessionOnly(), true);
  storage.setItem = write;
  saveDeal('three', storage);
  assert.equal(isSavedDealsSessionOnly(), false);
  assert.deepEqual(JSON.parse(storage.getItem(SAVED_DEALS_STORAGE_KEY)), ['one', 'two', 'three']);
  assert.deepEqual(getSavedDeals(storage), ['one', 'two', 'three']);
});
test('count helper ignores old IDs and duplicate saved/catalogue IDs', async () => {
  const { countValidSavedDeals } = await import(
    pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, 'src/lib/savedDeals.js'))
  );
  assert.equal(countValidSavedDeals(['one', 'one', 'gone', 'two'], ['one', 'two', 'two']), 2);
  assert.equal(countValidSavedDeals(['one'], []), 0);
});
test('external-store snapshots are immutable and reference-stable without signature collisions', async () => {
  const { getSavedDealsSnapshot } = await import(
    pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, 'src/lib/savedDeals.js'))
  );
  const previous = globalThis.window;
  const win = new EventTarget();
  win.localStorage = createMockStorage();
  globalThis.window = win;
  try {
    const initial = getSavedDealsSnapshot();
    assert.equal(getSavedDealsSnapshot(), initial);
    saveDeal('a\u0000b');
    const first = getSavedDealsSnapshot();
    assert.notEqual(first, initial);
    assert.equal(getSavedDealsSnapshot(), first);
    assert.ok(Object.isFrozen(first.keys));
    clearSavedDeals();
    saveDeal('a');
    saveDeal('b');
    const second = getSavedDealsSnapshot();
    assert.notEqual(second, first);
    assert.deepEqual(second.keys, ['a', 'b']);
    assert.equal(getSavedDealsSnapshot(), second);
    const write = win.localStorage.setItem;
    win.localStorage.setItem = () => {
      throw Error('quota');
    };
    removeSavedDeal('b');
    const degraded = getSavedDealsSnapshot();
    assert.equal(degraded.degraded, true);
    assert.equal(getSavedDealsSnapshot(), degraded);
    win.localStorage.setItem = write;
    saveDeal('b');
    const recovered = getSavedDealsSnapshot();
    assert.equal(recovered.degraded, false);
    assert.notEqual(recovered, degraded);
  } finally {
    if (previous === undefined) delete globalThis.window;
    else globalThis.window = previous;
  }
});

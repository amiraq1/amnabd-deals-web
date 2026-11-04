import assert from 'node:assert/strict';
import { test, beforeEach } from 'node:test';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const {
  SAVED_DEALS_STORAGE_KEY,
  SAVED_DEALS_EVENT,
  LEGACY_FAVORITES_STORAGE_KEY,
  getSavedDeals,
  saveDeal,
  subscribeSavedDeals,
  _resetMemoryFallback,
} = await import(pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, 'src/lib/savedDeals.js')));

const {
  CANONICAL_FAVORITES_STORAGE_KEY,
  UNIFIED_EVENT,
  subscribeFavorites,
  _resetFavoritesMemoryFallback,
} = await import(pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, 'src/lib/favorites.js')));

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
  _resetFavoritesMemoryFallback();
});

test('storage-sync: canonical key and unified event align across both modules', () => {
  assert.equal(SAVED_DEALS_STORAGE_KEY, 'amnabd_saved_deals_v1');
  assert.equal(CANONICAL_FAVORITES_STORAGE_KEY, 'amnabd_saved_deals_v1');
  assert.equal(SAVED_DEALS_EVENT, 'amnabd:saved-deals-changed');
  assert.equal(UNIFIED_EVENT, 'amnabd:saved-deals-changed');
  assert.equal(LEGACY_FAVORITES_STORAGE_KEY, 'amnabd-favorites');
});

test('storage-sync: non-destructive Set migration from legacy amnabd-favorites', () => {
  const storage = createMockStorage({
    'amnabd-favorites': JSON.stringify(['deal-a', 'deal-b']),
  });

  const migrated = getSavedDeals(storage);
  assert.deepEqual(migrated, ['deal-a', 'deal-b']);
  // Verified that canonical key is written with migrated entries
  assert.equal(
    storage.getItem('amnabd_saved_deals_v1'),
    JSON.stringify(['deal-a', 'deal-b'])
  );
  // Verified that legacy key is preserved non-destructively
  assert.equal(
    storage.getItem('amnabd-favorites'),
    JSON.stringify(['deal-a', 'deal-b'])
  );
});

test('storage-sync: Set union deduplicates existing canonical and legacy favorites without data loss', () => {
  const storage = createMockStorage({
    amnabd_saved_deals_v1: JSON.stringify(['canonical-1', 'shared-deal']),
    'amnabd-favorites': JSON.stringify(['shared-deal', 'legacy-2']),
  });

  const merged = getSavedDeals(storage);
  assert.deepEqual(merged, ['canonical-1', 'shared-deal', 'legacy-2']);
  assert.equal(
    storage.getItem('amnabd_saved_deals_v1'),
    JSON.stringify(['canonical-1', 'shared-deal', 'legacy-2'])
  );
  assert.equal(
    storage.getItem('amnabd-favorites'),
    JSON.stringify(['shared-deal', 'legacy-2'])
  );
});

test('storage-sync: window event unification triggers both listener channels', async () => {
  const prevWindow = globalThis.window;
  const win = new EventTarget();
  win.localStorage = createMockStorage();
  globalThis.window = win;

  const savedDealsEvents = [];
  const favoritesEvents = [];

  const unsubSaved = subscribeSavedDeals(() => savedDealsEvents.push(Date.now()));
  const unsubFavs = subscribeFavorites(() => favoritesEvents.push(Date.now()));

  try {
    // Dispatch unified event
    win.dispatchEvent(new CustomEvent('amnabd:saved-deals-changed'));
    assert.equal(savedDealsEvents.length, 1);
    assert.equal(favoritesEvents.length, 1);

    // Calling saveDeal dispatches unified event
    saveDeal('new-deal');
    assert.equal(savedDealsEvents.length, 2);
    assert.equal(favoritesEvents.length, 2);
  } finally {
    unsubSaved();
    unsubFavs();
    if (prevWindow === undefined) delete globalThis.window;
    else globalThis.window = prevWindow;
  }
});

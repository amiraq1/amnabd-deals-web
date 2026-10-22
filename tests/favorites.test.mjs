import assert from 'node:assert/strict';
import { test, beforeEach } from 'node:test';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const {
  FAVORITES_STORAGE_KEY,
  FAVORITES_EVENT,
  getFavorites,
  saveFavorites,
  toggleFavoriteSlug,
  isSlugFavorite,
  sanitizeFavoritesList,
  _resetFavoritesMemoryFallback,
} = await import(pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, 'src/lib/favorites.js')));

const { parseHash, routeHash } = await import(
  pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, 'src/lib/routes.js'))
);

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
  _resetFavoritesMemoryFallback();
});

test('favorites storage key and event match exact requirements', () => {
  assert.equal(FAVORITES_STORAGE_KEY, 'amnabd-favorites');
  assert.equal(FAVORITES_EVENT, 'amnabd:favorites-changed');
});

test('initial read on empty storage returns empty array []', () => {
  const storage = createMockStorage();
  assert.deepEqual(getFavorites(storage), []);
});

test('a list stored only under the legacy key is read and survives the first toggle', () => {
  const storage = createMockStorage({
    amnabd_saved_deals_v1: JSON.stringify(['legacy-a', 'legacy-b']),
  });
  // Before the fallback this returned [] and the next toggle wrote a one-item
  // list over the visitor's existing favorites.
  assert.deepEqual(getFavorites(storage), ['legacy-a', 'legacy-b']);

  toggleFavoriteSlug('new-c', storage);
  assert.deepEqual(getFavorites(storage), ['legacy-a', 'legacy-b', 'new-c']);
  assert.deepEqual(JSON.parse(storage.getItem(FAVORITES_STORAGE_KEY)), [
    'legacy-a',
    'legacy-b',
    'new-c',
  ]);
});

test('a corrupt new key stays empty rather than resurrecting legacy data', () => {
  const storage = createMockStorage({
    'amnabd-favorites': '{not json',
    amnabd_saved_deals_v1: JSON.stringify(['legacy-a']),
  });
  assert.deepEqual(getFavorites(storage), []);
});

test('removing the last favorite writes "[]" and does not resurrect the legacy list', () => {
  const storage = createMockStorage({
    amnabd_saved_deals_v1: JSON.stringify(['legacy-a']),
  });
  // The legacy list is visible before the visitor changes anything.
  assert.deepEqual(getFavorites(storage), ['legacy-a']);

  toggleFavoriteSlug('legacy-a', storage);

  // The empty list must be an explicit "[]" under the new key, never a deleted
  // key: a missing key would fall back to the legacy list on the next read.
  assert.equal(storage.getItem(FAVORITES_STORAGE_KEY), '[]');
  assert.equal(storage.getItem('amnabd_saved_deals_v1'), JSON.stringify(['legacy-a']));
  assert.deepEqual(getFavorites(storage), []);

  // Simulate a reload: module memory is reset, storage is not.
  _resetFavoritesMemoryFallback();
  assert.deepEqual(getFavorites(storage), []);
});

test('toggleFavorite adds slug when absent and removes when present', () => {
  const storage = createMockStorage();
  assert.equal(isSlugFavorite('claude-3-5', storage), false);

  const added = toggleFavoriteSlug('claude-3-5', storage);
  assert.equal(added, true);
  assert.equal(isSlugFavorite('claude-3-5', storage), true);
  assert.deepEqual(getFavorites(storage), ['claude-3-5']);

  const removed = toggleFavoriteSlug('claude-3-5', storage);
  assert.equal(removed, false);
  assert.equal(isSlugFavorite('claude-3-5', storage), false);
  assert.deepEqual(getFavorites(storage), []);
});

test('prevents duplicates and preserves insertion order', () => {
  const storage = createMockStorage();
  saveFavorites(['slug-a', 'slug-b', 'slug-a', '   slug-c   ', ''], storage);
  assert.deepEqual(getFavorites(storage), ['slug-a', 'slug-b', 'slug-c']);

  toggleFavoriteSlug('slug-d', storage);
  assert.deepEqual(getFavorites(storage), ['slug-a', 'slug-b', 'slug-c', 'slug-d']);

  // Adding existing slug via toggle removes it
  toggleFavoriteSlug('slug-b', storage);
  assert.deepEqual(getFavorites(storage), ['slug-a', 'slug-c', 'slug-d']);
});

test('sanitizeFavoritesList handles non-array and mixed values safely', () => {
  assert.deepEqual(sanitizeFavoritesList(null), []);
  assert.deepEqual(sanitizeFavoritesList(undefined), []);
  assert.deepEqual(sanitizeFavoritesList('not-an-array'), []);
  assert.deepEqual(sanitizeFavoritesList({ slug: 'test' }), []);
  assert.deepEqual(sanitizeFavoritesList([123, true, null, undefined, {}]), []);
  assert.deepEqual(sanitizeFavoritesList(['deal-1', 456, 'deal-2', 'deal-1']), ['deal-1', 'deal-2']);
});

test('resilience: corrupted JSON returns empty array without throwing', () => {
  const storage = createMockStorage({
    [FAVORITES_STORAGE_KEY]: '{"invalid-json-without-close',
  });
  assert.doesNotThrow(() => {
    const result = getFavorites(storage);
    assert.deepEqual(result, []);
  });
});

test('resilience: non-array stored value returns empty array without throwing', () => {
  for (const invalid of ['"string-value"', '12345', 'true', '{"a":1}']) {
    const storage = createMockStorage({
      [FAVORITES_STORAGE_KEY]: invalid,
    });
    assert.doesNotThrow(() => {
      const result = getFavorites(storage);
      assert.deepEqual(result, []);
    });
  }
});

test('resilience: missing/throwing localStorage is handled gracefully in memory', () => {
  const throwingStorage = {
    getItem() {
      throw new Error('Access to localStorage is denied (SecurityError)');
    },
    setItem() {
      throw new Error('QuotaExceededError: LocalStorage quota exceeded');
    },
    removeItem() {},
    clear() {},
  };

  // Initial read when getItem throws: does not throw, returns empty array
  assert.doesNotThrow(() => {
    assert.deepEqual(getFavorites(throwingStorage), []);
  });

  // Writing when setItem throws: does not throw, returns false, preserves in-memory
  assert.doesNotThrow(() => {
    const saved = saveFavorites(['in-memory-slug'], throwingStorage);
    assert.equal(saved, false);
    assert.deepEqual(getFavorites(throwingStorage), ['in-memory-slug']);
  });

  // Toggling when setItem throws: continues working in memory
  assert.doesNotThrow(() => {
    toggleFavoriteSlug('in-memory-slug-2', throwingStorage);
    assert.deepEqual(getFavorites(throwingStorage), ['in-memory-slug', 'in-memory-slug-2']);
    assert.equal(isSlugFavorite('in-memory-slug', throwingStorage), true);
  });
});

test('routing: parseHash and routeHash support favorites route', () => {
  assert.deepEqual(parseHash('#/favorites'), { name: 'favorites' });
  assert.deepEqual(parseHash('#/favorites/'), { name: 'favorites' });
  assert.deepEqual(parseHash('#/favorites?sort=recent'), { name: 'favorites' });
  assert.deepEqual(parseHash('#/favorites/extra/path'), { name: 'notfound' });

  assert.equal(routeHash({ name: 'favorites' }), '#/favorites');
});

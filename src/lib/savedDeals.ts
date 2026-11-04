export const SAVED_DEALS_STORAGE_KEY = 'amnabd_saved_deals_v1';
export const SAVED_DEALS_EVENT = 'amnabd:saved-deals-changed';
export const LEGACY_FAVORITES_STORAGE_KEY = 'amnabd-favorites';
export const MAX_SAVED_DEALS = 500;

// A storage failure selects memory for reads. A later explicit write retries
// persistence and recovers only on success; reads never overwrite unsaved edits.
let memoryFallback = new Set<string>();
let storageDisabled = false;
let migratedGlobal = false;
const migratedStores = new WeakSet<object>();

function resolveStorage(override?: Storage | null): Storage | null {
  try {
    const storage =
      override !== undefined
        ? override
        : typeof window === 'undefined'
          ? null
          : window.localStorage;
    if (!storage) storageDisabled = true;
    return storage;
  } catch {
    storageDisabled = true;
    return null;
  }
}

export function sanitizeSavedDealKeys(items: unknown): string[] {
  if (!Array.isArray(items)) return [];
  const keys = new Set<string>();
  for (const item of items) {
    if (typeof item === 'string' && item.trim()) keys.add(item.trim());
    if (keys.size >= MAX_SAVED_DEALS) break;
  }
  return [...keys];
}

export function countValidSavedDeals(
  savedKeys: readonly string[],
  availableKeys: readonly string[]
): number {
  const available = new Set(availableKeys);
  return sanitizeSavedDealKeys(savedKeys).filter((key) => available.has(key)).length;
}

export interface SavedDealsSnapshot {
  readonly keys: readonly string[];
  readonly degraded: boolean;
}
const EMPTY_KEYS: readonly string[] = Object.freeze([]);
export const EMPTY_SAVED_SNAPSHOT: SavedDealsSnapshot = Object.freeze({
  keys: EMPTY_KEYS,
  degraded: false,
});
let cachedSnapshot = EMPTY_SAVED_SNAPSHOT;

export function getSavedDealsSnapshot(): SavedDealsSnapshot {
  const keys = getSavedDeals();
  // Element comparison avoids signature collisions for IDs containing NUL.
  if (
    cachedSnapshot.degraded !== storageDisabled ||
    keys.length !== cachedSnapshot.keys.length ||
    keys.some((key, i) => key !== cachedSnapshot.keys[i])
  ) {
    cachedSnapshot = Object.freeze({ keys: Object.freeze(keys), degraded: storageDisabled });
  }
  return cachedSnapshot;
}

export function notifySavedDealsChanged(): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent(SAVED_DEALS_EVENT));
  } catch {
    /* Optional notification must not break saving. */
  }
}

export function isSavedDealsSessionOnly(): boolean {
  return storageDisabled;
}

export function getSavedDeals(storageOverride?: Storage | null): string[] {
  if (storageDisabled) return [...memoryFallback];
  const storage = resolveStorage(storageOverride);
  if (!storage) return [...memoryFallback];
  let raw: string | null;
  let rawLegacy: string | null = null;
  try {
    raw = storage.getItem(SAVED_DEALS_STORAGE_KEY);
    rawLegacy = storage.getItem(LEGACY_FAVORITES_STORAGE_KEY);
  } catch {
    storageDisabled = true;
    return [...memoryFallback];
  }
  // Missing key and corrupt JSON mean empty, not an old cached selection. This
  // matters after removeItem/clear in another tab, including subsequent failures.
  let parsed: unknown = [];
  if (raw !== null) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = [];
    }
  }
  const slugs = sanitizeSavedDealKeys(parsed);

  const alreadyMigrated =
    storageOverride && typeof storageOverride === 'object'
      ? migratedStores.has(storageOverride)
      : migratedGlobal;

  // Non-destructive Set migration from legacy amnabd-favorites on first read
  if (!alreadyMigrated && rawLegacy !== null) {
    if (storageOverride && typeof storageOverride === 'object') {
      migratedStores.add(storageOverride);
    } else {
      migratedGlobal = true;
    }
    let parsedLegacy: unknown = [];
    try {
      parsedLegacy = JSON.parse(rawLegacy);
    } catch {
      parsedLegacy = [];
    }
    const legacySlugs = sanitizeSavedDealKeys(parsedLegacy);
    if (legacySlugs.length > 0) {
      const mergedSet = new Set(slugs);
      let changed = false;
      for (const item of legacySlugs) {
        if (!mergedSet.has(item) && mergedSet.size < MAX_SAVED_DEALS) {
          mergedSet.add(item);
          changed = true;
        }
      }
      if (changed) {
        const mergedList = [...mergedSet];
        try {
          storage.setItem(SAVED_DEALS_STORAGE_KEY, JSON.stringify(mergedList));
        } catch {
          /* ignore */
        }
        memoryFallback = new Set(mergedList);
        return mergedList;
      }
    }
  } else if (!alreadyMigrated) {
    if (storageOverride && typeof storageOverride === 'object') {
      migratedStores.add(storageOverride);
    } else {
      migratedGlobal = true;
    }
  }

  memoryFallback = new Set(slugs);
  return slugs;
}

export function isDealSaved(slug: string, storageOverride?: Storage | null): boolean {
  return (
    typeof slug === 'string' &&
    !!slug.trim() &&
    getSavedDeals(storageOverride).includes(slug.trim())
  );
}

function persistSlugs(slugs: string[], storageOverride?: Storage | null): void {
  const sanitized = sanitizeSavedDealKeys(slugs);
  memoryFallback = new Set(sanitized);
  const storage = resolveStorage(storageOverride);
  if (storage) {
    if (storageOverride && typeof storageOverride === 'object') {
      migratedStores.add(storageOverride);
    } else {
      migratedGlobal = true;
    }
    try {
      storage.setItem(SAVED_DEALS_STORAGE_KEY, JSON.stringify(sanitized));
      if (storageOverride === undefined) {
        try {
          storage.setItem(LEGACY_FAVORITES_STORAGE_KEY, JSON.stringify(sanitized));
        } catch {
          /* ignore */
        }
      }
      storageDisabled = false;
    } catch {
      storageDisabled = true;
    }
  }
  notifySavedDealsChanged();
}

export function saveDeal(slug: string, storageOverride?: Storage | null): boolean {
  if (typeof slug !== 'string' || !slug.trim()) return false;
  const key = slug.trim(),
    current = getSavedDeals(storageOverride);
  if (current.includes(key) || current.length >= MAX_SAVED_DEALS) return false;
  persistSlugs([...current, key], storageOverride);
  return true;
}

export function removeSavedDeal(slug: string, storageOverride?: Storage | null): boolean {
  if (typeof slug !== 'string' || !slug.trim()) return false;
  const key = slug.trim(),
    current = getSavedDeals(storageOverride);
  if (!current.includes(key)) return false;
  persistSlugs(
    current.filter((item) => item !== key),
    storageOverride
  );
  return true;
}

export function toggleSavedDeal(slug: string, storageOverride?: Storage | null): boolean {
  if (typeof slug !== 'string' || !slug.trim()) return false;
  const key = slug.trim(),
    current = getSavedDeals(storageOverride);
  const saved = !current.includes(key);
  if (saved && current.length >= MAX_SAVED_DEALS) return false;
  persistSlugs(saved ? [...current, key] : current.filter((item) => item !== key), storageOverride);
  return saved;
}

export function clearSavedDeals(storageOverride?: Storage | null): void {
  persistSlugs([], storageOverride);
}

export function subscribeSavedDeals(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => callback();
  const storageHandler = (event: StorageEvent) => {
    if (storageDisabled || (event.key !== null && event.key !== SAVED_DEALS_STORAGE_KEY)) return;
    try {
      if (event.storageArea && event.storageArea !== window.localStorage) return;
    } catch {
      storageDisabled = true;
    }
    callback();
  };
  window.addEventListener(SAVED_DEALS_EVENT, handler);
  window.addEventListener('storage', storageHandler);
  return () => {
    window.removeEventListener(SAVED_DEALS_EVENT, handler);
    window.removeEventListener('storage', storageHandler);
  };
}

// Isolated unit tests only; never clears real browser storage.
export function _resetMemoryFallback(): void {
  memoryFallback = new Set<string>();
  storageDisabled = false;
  migratedGlobal = false;
  cachedSnapshot = EMPTY_SAVED_SNAPSHOT;
}

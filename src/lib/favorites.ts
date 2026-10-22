export const FAVORITES_STORAGE_KEY = 'amnabd-favorites';
export const FAVORITES_EVENT = 'amnabd:favorites-changed';
// The list lived under this key before `amnabd-favorites` existed; the saved
// deals module still writes it. Reading it is a one-way compatibility bridge.
export const LEGACY_FAVORITES_STORAGE_KEY = 'amnabd_saved_deals_v1';

// Module-level in-memory state in case storage is unavailable or writes fail
let memoryFavorites: string[] = [];
let memoryOnly = false;
let cachedSnapshot: readonly string[] = Object.freeze([]);

function resolveStorage(override?: Storage | null): Storage | null {
  if (override !== undefined) return override;
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage;
  } catch {
    memoryOnly = true;
    return null;
  }
}

export function sanitizeFavoritesList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const result: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (typeof item === 'string') {
      const trimmed = item.trim();
      if (trimmed && !seen.has(trimmed)) {
        seen.add(trimmed);
        result.push(trimmed);
      }
    }
  }
  return result;
}

export function getFavorites(override?: Storage | null): string[] {
  if (memoryOnly && override === undefined) return [...memoryFavorites];
  const storage = resolveStorage(override);
  if (!storage) return [...memoryFavorites];

  let raw: string | null = null;
  try {
    raw = storage.getItem(FAVORITES_STORAGE_KEY);
    // A visitor whose list predates the new key has it only under the legacy
    // one. Without this read they see an empty page and their first toggle
    // overwrites the list they had. Reading never writes, so nothing migrates
    // until the visitor actually changes something.
    if (raw === null) raw = storage.getItem(LEGACY_FAVORITES_STORAGE_KEY);
  } catch {
    // localStorage.getItem threw (storage unavailable / restricted)
    memoryOnly = true;
    return [...memoryFavorites];
  }

  if (raw === null) {
    memoryFavorites = [];
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    const sanitized = sanitizeFavoritesList(parsed);
    memoryFavorites = [...sanitized];
    return sanitized;
  } catch {
    // Corrupted JSON: fallback safely without crashing and return empty array
    return [];
  }
}

function notifyChange(): void {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent(FAVORITES_EVENT));
    } catch {
      /* ignore */
    }
  }
}

export function saveFavorites(slugs: string[], override?: Storage | null): boolean {
  const sanitized = sanitizeFavoritesList(slugs);
  memoryFavorites = [...sanitized];
  updateCachedSnapshot(sanitized);

  const storage = resolveStorage(override);
  if (!storage) {
    memoryOnly = true;
    notifyChange();
    return false;
  }

  try {
    storage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(sanitized));
    if (override === undefined) {
      try {
        storage.setItem(LEGACY_FAVORITES_STORAGE_KEY, JSON.stringify(sanitized));
        window.dispatchEvent(new CustomEvent('amnabd:saved-deals-changed'));
      } catch {
        /* ignore */
      }
    }
    memoryOnly = false;
    notifyChange();
    return true;
  } catch {
    // QuotaExceeded or write error: retain in-memory state
    memoryOnly = true;
    notifyChange();
    return false;
  }
}

export function toggleFavoriteSlug(slug: string, override?: Storage | null): boolean {
  if (typeof slug !== 'string' || !slug.trim()) return false;
  const target = slug.trim();
  const current = getFavorites(override);
  const exists = current.includes(target);

  let next: string[];
  if (exists) {
    next = current.filter((s) => s !== target);
  } else {
    next = [...current, target];
  }

  saveFavorites(next, override);
  return !exists;
}

export function isSlugFavorite(slug: string, override?: Storage | null): boolean {
  if (typeof slug !== 'string' || !slug.trim()) return false;
  return getFavorites(override).includes(slug.trim());
}

function updateCachedSnapshot(current: string[]): readonly string[] {
  if (
    cachedSnapshot.length === current.length &&
    cachedSnapshot.every((val, idx) => val === current[idx])
  ) {
    return cachedSnapshot;
  }
  cachedSnapshot = Object.freeze([...current]);
  return cachedSnapshot;
}

export function getFavoritesSnapshot(): readonly string[] {
  const current = getFavorites();
  return updateCachedSnapshot(current);
}

export function subscribeFavorites(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleCustomEvent = () => callback();
  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === FAVORITES_STORAGE_KEY || e.key === null) {
      callback();
    }
  };

  window.addEventListener(FAVORITES_EVENT, handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);

  return () => {
    window.removeEventListener(FAVORITES_EVENT, handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
  };
}

export function _resetFavoritesMemoryFallback(): void {
  memoryFavorites = [];
  memoryOnly = false;
  cachedSnapshot = Object.freeze([]);
}

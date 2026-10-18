export const SAVED_DEALS_STORAGE_KEY = 'amnabd_saved_deals_v1';
export const SAVED_DEALS_EVENT = 'amnabd:saved-deals-changed';

// In-memory fallback set for private browsing, quota errors, or non-browser environments
let memoryFallback = new Set<string>();
let storageDisabled = false;

/**
 * Resolves localStorage safely without throwing if cookies/storage are disabled
 */
function resolveStorage(override?: Storage | null): Storage | null {
  if (storageDisabled) return null;
  if (override !== undefined) return override;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // Storage access may throw SecurityError in strict private browsing
    storageDisabled = true;
  }
  return null;
}

/**
 * Sanitizes and deduplicates a raw array of items into valid string slugs
 */
function sanitizeSlugs(items: unknown): string[] {
  if (!Array.isArray(items)) return [];
  const result: string[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    if (typeof item === 'string') {
      const trimmed = item.trim();
      if (trimmed.length > 0 && !seen.has(trimmed)) {
        seen.add(trimmed);
        result.push(trimmed);
      }
    }
  }
  return result;
}

/**
 * Dispatches cross-component update notification
 */
export function notifySavedDealsChanged(): void {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    try {
      window.dispatchEvent(new CustomEvent(SAVED_DEALS_EVENT));
    } catch {
      // Ignore if event dispatch fails in restricted environments
    }
  }
}

/**
 * Returns the list of currently saved deal slugs
 */
export function getSavedDeals(storageOverride?: Storage | null): string[] {
  const storage = resolveStorage(storageOverride);
  if (!storage) {
    return Array.from(memoryFallback);
  }

  try {
    const raw = storage.getItem(SAVED_DEALS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const sanitized = sanitizeSlugs(parsed);
    // Keep memory fallback in sync with storage
    memoryFallback = new Set(sanitized);
    return sanitized;
  } catch {
    // On JSON parse error or getItem failure, fall back to memory without crashing
    return Array.from(memoryFallback);
  }
}

/**
 * Checks whether a given slug is saved
 */
export function isDealSaved(slug: string, storageOverride?: Storage | null): boolean {
  if (!slug || typeof slug !== 'string') return false;
  const trimmed = slug.trim();
  const list = getSavedDeals(storageOverride);
  return list.includes(trimmed);
}

/**
 * Internal persistence helper
 */
function persistSlugs(slugs: string[], storageOverride?: Storage | null): void {
  const sanitized = sanitizeSlugs(slugs);
  memoryFallback = new Set(sanitized);

  const storage = resolveStorage(storageOverride);
  if (storage) {
    try {
      storage.setItem(SAVED_DEALS_STORAGE_KEY, JSON.stringify(sanitized));
    } catch {
      // QuotaExceededError or SecurityError: disable storage for this session and keep in memoryFallback
      storageDisabled = true;
    }
  }

  notifySavedDealsChanged();
}

/**
 * Adds a deal slug to saved deals
 */
export function saveDeal(slug: string, storageOverride?: Storage | null): boolean {
  if (!slug || typeof slug !== 'string') return false;
  const trimmed = slug.trim();
  if (trimmed.length === 0) return false;

  const current = getSavedDeals(storageOverride);
  if (current.includes(trimmed)) return false;

  persistSlugs([...current, trimmed], storageOverride);
  return true;
}

/**
 * Removes a deal slug from saved deals
 */
export function removeSavedDeal(slug: string, storageOverride?: Storage | null): boolean {
  if (!slug || typeof slug !== 'string') return false;
  const trimmed = slug.trim();

  const current = getSavedDeals(storageOverride);
  if (!current.includes(trimmed)) return false;

  persistSlugs(
    current.filter((s) => s !== trimmed),
    storageOverride
  );
  return true;
}

/**
 * Toggles saved status for a deal slug.
 * Returns true if the deal is now saved, false if it was removed.
 */
export function toggleSavedDeal(slug: string, storageOverride?: Storage | null): boolean {
  if (!slug || typeof slug !== 'string') return false;
  const trimmed = slug.trim();
  if (trimmed.length === 0) return false;

  const current = getSavedDeals(storageOverride);
  const exists = current.includes(trimmed);

  if (exists) {
    removeSavedDeal(trimmed, storageOverride);
    return false;
  } else {
    saveDeal(trimmed, storageOverride);
    return true;
  }
}

/**
 * Clears all saved deals
 */
export function clearSavedDeals(storageOverride?: Storage | null): void {
  persistSlugs([], storageOverride);
}

/**
 * Subscribes to saved deals changes across tabs and components
 */
export function subscribeSavedDeals(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => callback();
  const storageHandler = (e: StorageEvent) => {
    if (!e.key || e.key === SAVED_DEALS_STORAGE_KEY) {
      callback();
    }
  };
  window.addEventListener(SAVED_DEALS_EVENT, handler);
  window.addEventListener('storage', storageHandler);
  return () => {
    window.removeEventListener(SAVED_DEALS_EVENT, handler);
    window.removeEventListener('storage', storageHandler);
  };
}

/**
 * Resets in-memory fallback state and storage flags (intended for isolated testing)
 */
export function _resetMemoryFallback(): void {
  memoryFallback = new Set<string>();
  storageDisabled = false;
}

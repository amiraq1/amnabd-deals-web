import type { Lang } from '@/types';
type LanguageStorage = Pick<Storage, 'getItem' | 'setItem'>;
const browserStorage = (): LanguageStorage => window.localStorage;

export function parseLanguageFromSearch(search: string): Lang | null {
  try {
    const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
    const values = params.getAll('lang');
    if (values.length !== 1) return null;
    return values[0] === 'en' || values[0] === 'ar' ? values[0] : null;
  } catch {
    return null;
  }
}

/** Keep route/filter parameters and emit an explicit Arabic choice only when needed. */
export function withLanguageSearch(search: string, lang: Lang, explicitArabic = false): string {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  params.delete('lang');
  if (lang === 'en' || explicitArabic) params.append('lang', lang);
  return params.toString();
}

/** Read the live URL at write time, including when a filter write was debounced. */
export function languageSearchForLocation(
  search: string,
  fallbackLanguage: Lang,
  locationSearch: string
): string {
  const fromUrl = parseLanguageFromSearch(locationSearch);
  return withLanguageSearch(search, fromUrl ?? fallbackLanguage, fromUrl === 'ar');
}

export function readLanguage(
  storage: () => LanguageStorage = browserStorage,
  search?: string
): Lang {
  const currentSearch = search ?? (typeof window === 'undefined' ? '' : window.location.search);
  const fromUrl = parseLanguageFromSearch(currentSearch);
  if (fromUrl) return fromUrl;
  try {
    return storage().getItem('amnabd-lang') === 'en' ? 'en' : 'ar';
  } catch {
    return 'ar';
  }
}

export function saveLanguage(lang: Lang, storage: () => LanguageStorage = browserStorage): boolean {
  try {
    storage().setItem('amnabd-lang', lang);
    return true;
  } catch {
    return false;
  }
}

import type { Lang } from '@/types';
type LanguageStorage = Pick<Storage, 'getItem' | 'setItem'>;
const browserStorage = (): LanguageStorage => window.localStorage;

export function readLanguage(storage: () => LanguageStorage = browserStorage): Lang {
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

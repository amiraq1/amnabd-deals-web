import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Lang, Localized } from '@/types';
import { readLanguage, saveLanguage, withLanguageSearch } from '@/lib/languageStorage';

interface LanguageContextValue {
  lang: Lang;
  dir: 'rtl' | 'ltr';
  setLang: (lang: Lang) => void;
  toggle: () => void;
  pick: (l: Localized) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, updateLanguage] = useState<Lang>(() => readLanguage());

  const setLang = useCallback((next: Lang) => {
    try {
      const search = withLanguageSearch(window.location.search, next, true);
      const url = `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`;
      window.history.replaceState(window.history.state, '', url);
    } catch {
      // A blocked History API must not prevent changing the visible language.
    }
    updateLanguage(next);
  }, []);

  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    saveLanguage(lang);
  }, [lang, dir]);

  useEffect(() => {
    const onPopState = () => updateLanguage(readLanguage());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const value: LanguageContextValue = {
    lang,
    dir,
    setLang,
    toggle: () => setLang(lang === 'ar' ? 'en' : 'ar'),
    pick: (l) => (l ? l[lang] : ''),
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

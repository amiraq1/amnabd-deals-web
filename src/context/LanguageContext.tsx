import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Lang, Localized } from '@/types';

interface LanguageContextValue {
  lang: Lang;
  dir: 'rtl' | 'ltr';
  setLang: (lang: Lang) => void;
  toggle: () => void;
  pick: (l: Localized) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    const stored = localStorage.getItem('amnabd-lang');
    return stored === 'en' ? 'en' : 'ar';
  });

  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    localStorage.setItem('amnabd-lang', lang);
  }, [lang, dir]);

  const value: LanguageContextValue = {
    lang,
    dir,
    setLang,
    toggle: () => setLang((l) => (l === 'ar' ? 'en' : 'ar')),
    pick: (l) => (l ? l[lang] : ''),
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

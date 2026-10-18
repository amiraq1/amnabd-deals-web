import { Globe, Sparkles, BookOpen } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

import type { Route } from '@/lib/routes';
export type { Route } from '@/lib/routes';

interface NavbarProps {
  route: Route;
  navigate: (route: Route) => void;
}

export default function Navbar({ route, navigate }: NavbarProps) {
  const { lang, toggle } = useLanguage();

  const linkBase =
    'inline-flex min-h-11 items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400';
  const activeClass = 'text-emerald-400 bg-emerald-500/10';
  const idleClass = 'text-slate-300 hover:text-white hover:bg-slate-800';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
      <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:h-16 sm:flex-nowrap sm:px-6 sm:py-0">
        <button
          onClick={() => navigate({ name: 'home' })}
          className="flex min-h-11 items-center gap-2.5 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-900/40">
            <Sparkles className="h-5 w-5 text-white" />
          </span>
          <span className="font-heading text-lg font-bold tracking-tight text-white">
            {lang === 'ar' ? 'نبض' : 'AMNABD Deals'}
          </span>
        </button>

        <nav className="flex max-w-full flex-wrap items-center gap-1">
          <button
            onClick={() => navigate({ name: 'home' })}
            className={`${linkBase} ${route.name === 'home' || route.name === 'deal' ? activeClass : idleClass}`}
          >
            {lang === 'ar' ? 'العروض' : 'Deals'}
          </button>
          <button
            onClick={() => navigate({ name: 'guide' })}
            className={`${linkBase} ${route.name === 'guide' ? activeClass : idleClass}`}
          >
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              {lang === 'ar' ? 'الدليل' : 'Guide'}
            </span>
          </button>
          <button
            onClick={toggle}
            className={`${linkBase} ml-1 flex items-center gap-1.5 border border-slate-700 text-slate-200 hover:border-emerald-500/50 hover:text-emerald-300`}
            aria-label={lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
          >
            <Globe className="h-4 w-4" />
            {lang === 'ar' ? 'EN' : 'ع'}
          </button>
        </nav>
      </div>
    </header>
  );
}

import { useEffect, useState, type MouseEvent } from 'react';
import { BookOpen, Globe, Heart, History, Menu, Tag, X, Sparkles } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useFavorites } from '@/hooks/useFavorites';
import { routePath, type Route } from '@/lib/routes';
import { languageSearchForLocation } from '@/lib/languageStorage';

export type { Route } from '@/lib/routes';

export interface NavbarProps {
  route?: Route;
  navigate?: (route: Route) => void;
  /** العدد المحسوب مقابل العروض الموجودة فعلًا. إن غاب يُستخدم عدد الخطاف الخام. */
  savedCount?: number;
}

const translations = {
  ar: {
    brand: 'نبض',
    offers: 'العروض',
    favorites: 'المفضلة',
    guide: 'الدليل',
    changelog: 'المراجعات',
    savedDeals: 'عروض محفوظة',
    switchLang: 'تبديل اللغة',
    openMenu: 'فتح القائمة',
    closeMenu: 'إغلاق القائمة',
    mainNav: 'التنقل الرئيسي',
    langButton: 'EN',
  },
  en: {
    brand: 'نبض',
    offers: 'Offers',
    favorites: 'Favorites',
    guide: 'Guide',
    changelog: 'Review History',
    savedDeals: 'saved deals',
    switchLang: 'Switch language',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    mainNav: 'Main navigation',
    langButton: 'ع',
  },
} as const;

type NavKey = 'offers' | 'favorites' | 'guide' | 'changelog';

interface NavItem {
  key: NavKey;
  icon: typeof Tag;
  routeTarget: Route;
  path: string;
}

const navItems: readonly NavItem[] = [
  { key: 'offers', icon: Tag, routeTarget: { name: 'home' }, path: '/' },
  { key: 'favorites', icon: Heart, routeTarget: { name: 'favorites' }, path: '/favorites' },
  { key: 'guide', icon: BookOpen, routeTarget: { name: 'guide' }, path: '/guide' },
  { key: 'changelog', icon: History, routeTarget: { name: 'changelog' }, path: '/changelog' },
] as const;

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400';
const baseLink = `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${focusRing}`;
const idleLink = 'text-slate-300 hover:bg-slate-800 hover:text-slate-100';
const activeLink = 'bg-slate-800 text-slate-100 font-semibold';

function CountBadge({ count, label }: { count: number; label: string }) {
  if (count <= 0) return null;
  return (
    <span className="ms-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-emerald-500/20 px-1.5 text-xs font-bold text-emerald-300">
      {count}
      <span className="sr-only"> {label}</span>
    </span>
  );
}

export function Navbar({ route, navigate, savedCount }: NavbarProps) {
  const { lang, toggle: onLangToggle } = useLanguage();
  const { count: rawCount } = useFavorites();
  const count = savedCount ?? rawCount;

  const t = translations[lang] ?? translations.ar;
  const [menuOpen, setMenuOpen] = useState(false);
  const languageQuery = languageSearchForLocation('', lang, window.location.search);
  const localizedPath = (path: string) => `${path}${languageQuery ? `?${languageQuery}` : ''}`;

  const handleNavigate = (target: Route) => {
    if (navigate) {
      navigate(target);
    } else if (typeof window !== 'undefined') {
      window.location.href = localizedPath(routePath(target));
    }
  };

  // نقرة عادية = تنقل داخل التطبيق. Ctrl/Cmd/Shift/Alt أو الزر الأوسط = يتولاها المتصفح (تبويب جديد).
  const go = (e: MouseEvent<HTMLAnchorElement>, target: Route) => {
    const plainClick = e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
    if (!plainClick) return;
    e.preventDefault();
    handleNavigate(target);
    setMenuOpen(false);
  };

  // إغلاق قائمة الجوال عند الانتقال إلى مسار آخر
  useEffect(() => {
    setMenuOpen(false);
  }, [route?.name, route?.slug, route?.collectionKey]);

  // إغلاق القائمة بمفتاح Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  const isRouteActive = (target: Route): boolean => {
    if (!route) return false;
    if (target.name === 'home') {
      return route.name === 'home' || route.name === 'deal';
    }
    return route.name === target.name;
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* الشعار */}
        <a
          href={localizedPath('/')}
          onClick={(e) => go(e, { name: 'home' })}
          className={`flex items-center gap-2.5 rounded-lg ${focusRing}`}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-md shadow-emerald-950/50">
            <Sparkles className="h-4 w-4 text-white" aria-hidden="true" />
          </span>
          <span className="font-heading text-xl font-bold tracking-tight text-slate-100">
            {t.brand}
          </span>
        </a>

        {/* التنقل الرئيسي (سطح المكتب) */}
        <nav aria-label={t.mainNav} className="hidden items-center gap-1 sm:flex">
          {navItems.map(({ routeTarget, key, icon: Icon, path }) => {
            const active = isRouteActive(routeTarget);
            return (
              <a
                key={key}
                href={localizedPath(path)}
                onClick={(e) => go(e, routeTarget)}
                aria-current={active ? 'page' : undefined}
                className={`${baseLink} ${active ? activeLink : idleLink}`}
              >
                {key !== 'offers' && <Icon className="h-4 w-4" aria-hidden="true" />}
                <span>{t[key]}</span>
                {key === 'favorites' && <CountBadge count={count} label={t.savedDeals} />}
              </a>
            );
          })}
        </nav>

        {/* الإجراءات */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onLangToggle}
            className={`flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/60 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:text-slate-100 ${focusRing}`}
            aria-label={t.switchLang}
          >
            <Globe className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t.langButton}</span>
          </button>

          {/* زر قائمة الجوال */}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className={`relative rounded-lg p-2 text-slate-300 transition hover:bg-slate-800 hover:text-slate-100 sm:hidden ${focusRing}`}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? t.closeMenu : t.openMenu}
          >
            {menuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
            {!menuOpen && count > 0 && (
              <span
                className="absolute -top-0.5 -end-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500"
                aria-hidden="true"
              />
            )}
          </button>
        </div>
      </div>

      {/* قائمة الجوال */}
      {menuOpen && (
        <nav
          id="mobile-menu"
          aria-label={t.mainNav}
          className="border-t border-slate-800 bg-slate-950/95 px-4 py-3 sm:hidden"
        >
          <ul className="flex flex-col gap-1">
            {navItems.map(({ routeTarget, key, icon: Icon, path }) => {
              const active = isRouteActive(routeTarget);
              return (
                <li key={key}>
                  <a
                    href={localizedPath(path)}
                    onClick={(e) => go(e, routeTarget)}
                    aria-current={active ? 'page' : undefined}
                    className={`${baseLink} w-full py-2.5 text-base ${
                      active ? activeLink : idleLink
                    }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span>{t[key]}</span>
                    {key === 'favorites' && <CountBadge count={count} label={t.savedDeals} />}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </header>
  );
}

export default Navbar;

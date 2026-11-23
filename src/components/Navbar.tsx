import { useEffect, useRef, useState, type MouseEvent } from 'react';
import {
  BookOpen,
  Globe,
  Heart,
  History,
  Menu,
  MessageSquare,
  Tag,
  X,
  Layers,
} from 'lucide-react';
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
    aiModels: 'نماذج AI',
    sms: 'أرقام SMS',
    changelog: 'سجل المراجعات',
    savedDeals: 'عروض محفوظة',
    switchLang: 'EN — التبديل إلى الإنجليزية',
    openMenu: 'فتح القائمة',
    closeMenu: 'إغلاق القائمة',
    mainNav: 'التنقل الرئيسي',
    langButton: 'EN',
  },
  en: {
    brand: 'AMNABD Deals',
    offers: 'Offers',
    favorites: 'Favorites',
    guide: 'Guide',
    aiModels: 'AI Models',
    sms: 'SMS Numbers',
    changelog: 'Review History',
    savedDeals: 'saved deals',
    switchLang: 'ع — switch to Arabic',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    mainNav: 'Main navigation',
    langButton: 'ع',
  },
} as const;

type NavKey = 'offers' | 'favorites' | 'guide' | 'aiModels' | 'sms' | 'changelog';

interface NavItem {
  key: NavKey;
  icon: typeof Tag;
  routeTarget: Route;
  path: string;
}

const navItems: readonly NavItem[] = [
  { key: 'offers', icon: Tag, routeTarget: { name: 'home' }, path: '/' },
  {
    key: 'favorites',
    icon: Heart,
    routeTarget: { name: 'favorites' },
    path: '/favorites',
  },
  {
    key: 'guide',
    icon: BookOpen,
    routeTarget: { name: 'guide' },
    path: '/guide',
  },
  {
    key: 'aiModels',
    icon: Layers,
    routeTarget: { name: 'aiModelsDirectory' },
    path: '/free-ai-models-directory',
  },
  {
    key: 'sms',
    icon: MessageSquare,
    routeTarget: { name: 'smsSuppliersDirectory' },
    path: '/sms-suppliers-directory',
  },
  {
    key: 'changelog',
    icon: History,
    routeTarget: { name: 'changelog' },
    path: '/changelog',
  },
] as const;

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500';
const baseLink = `flex min-h-11 items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${focusRing}`;
const idleLink = 'text-stone-300 hover:bg-[#181816] hover:text-stone-100';
const activeLink = 'bg-[#181816] text-white border border-[#2E2E2A] font-semibold';

function CountBadge({ count, label }: { count: number; label: string }) {
  if (count <= 0) return null;
  return (
    <span className="ms-1.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full border border-emerald-500/25 bg-emerald-500/10 px-1.5 text-xs font-semibold tabular-nums text-emerald-400">
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
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const languageQuery = languageSearchForLocation(
    '',
    lang,
    window.location.search,
  );
  const localizedPath = (path: string) =>
    `${path}${languageQuery ? `?${languageQuery}` : ''}`;

  const handleNavigate = (target: Route) => {
    if (navigate) {
      navigate(target);
    } else if (typeof window !== 'undefined') {
      window.location.href = localizedPath(routePath(target));
    }
  };

  // نقرة عادية = تنقل داخل التطبيق. Ctrl/Cmd/Shift/Alt أو الزر الأوسط = يتولاها المتصفح (تبويب جديد).
  const go = (e: MouseEvent<HTMLAnchorElement>, target: Route) => {
    const plainClick =
      e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
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
      if (e.key === 'Escape') {
        e.preventDefault();
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
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
    <header className="sticky top-0 z-40 border-b border-[#242422] bg-[#0B0B0A]/90 backdrop-blur-md">
      <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-2 sm:px-6">
        {/* الشعار التحريري النقي */}
        <a
          href={localizedPath('/')}
          onClick={(e) => go(e, { name: 'home' })}
          className={`group flex min-h-11 min-w-0 items-center gap-2.5 rounded-lg ${focusRing}`}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[#2E2E2A] bg-[#141413] text-xs font-bold text-stone-100 transition-colors group-hover:border-emerald-500/50 group-hover:text-emerald-400">
            {lang === 'ar' ? 'ن' : 'N'}
          </span>
          <span className="truncate font-heading text-lg font-bold tracking-tight text-stone-100">
            {t.brand}
          </span>
        </a>

        {/* التنقل الرئيسي (سطح المكتب) */}
        <nav
          aria-label={t.mainNav}
          className="hidden items-center gap-1 sm:flex"
        >
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
                {key !== 'offers' && (
                  <Icon className="h-4 w-4 shrink-0 text-stone-400" aria-hidden="true" />
                )}
                <span>{t[key]}</span>
                {key === 'favorites' && (
                  <CountBadge count={count} label={t.savedDeals} />
                )}
              </a>
            );
          })}
        </nav>

        {/* الإجراءات الجانبية */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onLangToggle}
            className={`flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-lg border border-[#2E2E2A] bg-[#141413] px-2.5 py-1.5 text-sm font-medium text-stone-300 transition-colors hover:border-[#3E3E38] hover:text-stone-100 ${focusRing}`}
            aria-label={t.switchLang}
          >
            <Globe className="h-3.5 w-3.5 text-stone-400" aria-hidden="true" />
            <span>{t.langButton}</span>
          </button>

          {/* زر قائمة الجوال */}
          <button
            type="button"
            ref={menuButtonRef}
            onClick={() => setMenuOpen((open) => !open)}
            className={`relative flex h-11 w-11 items-center justify-center rounded-lg border border-[#2E2E2A] bg-[#141413] p-2 text-stone-300 transition-colors hover:bg-[#1E1E1D] hover:text-stone-100 sm:hidden ${focusRing}`}
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
                className="absolute end-1.5 top-1.5 h-2 w-2 rounded-full bg-emerald-400"
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
          className="border-t border-[#242422] bg-[#0E0E0D]/95 px-4 py-3 backdrop-blur-md sm:hidden"
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
                    <Icon className="h-4 w-4 shrink-0 text-stone-400" aria-hidden="true" />
                    <span>{t[key]}</span>
                    {key === 'favorites' && (
                      <CountBadge count={count} label={t.savedDeals} />
                    )}
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

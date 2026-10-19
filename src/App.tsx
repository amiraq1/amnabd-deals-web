import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';
import { loadConfig, loadDeals, loadGuides } from '@/lib/loadResources';
import { extractHashSearch, parseHash, routeHash, type Route } from '@/lib/routes';
import {
  buildDiscoveryHash,
  DEFAULT_FILTER_STATE,
  parseFilterState,
  validateFilterState,
} from '@/lib/filterState';
import { categoryKey } from '@/lib/discovery';
import type { FilterState } from '@/types';
import { useResource } from '@/hooks/useResource';
import ContentErrorBoundary from '@/components/ContentErrorBoundary';
import ResourceNotice from '@/components/ResourceNotice';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HomePage from '@/pages/HomePage';
import DealDetailPage from '@/pages/DealDetailPage';
import UsageGuidePage from '@/pages/UsageGuidePage';
import NotFoundPage from '@/pages/NotFoundPage';

function AppInner() {
  const { lang } = useLanguage();
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  // Each resource settles independently. Language is presentation state and is
  // deliberately not a dependency of any data request.
  const offers = useResource(loadDeals);
  const guides = useResource(loadGuides);
  const settings = useResource(loadConfig);
  const deals = useMemo(() => offers.data?.value ?? [], [offers.data?.value]);
  const guideRows = useMemo(() => guides.data?.value ?? [], [guides.data?.value]);
  const config = settings.data?.value ?? null;

  const validCategoryKeys = useMemo(
    () => new Set(deals.map((d) => categoryKey(d.category.value))),
    [deals]
  );
  const [rawFilters, setRawFilters] = useState<FilterState>(() =>
    parseFilterState(extractHashSearch(window.location.hash))
  );
  const filterState = useMemo(
    () =>
      validateFilterState(rawFilters, offers.status === 'ready' ? validCategoryKeys : undefined),
    [rawFilters, offers.status, validCategoryKeys]
  );
  const filtersRef = useRef(rawFilters);
  const categoriesRef = useRef<ReadonlySet<string> | undefined>(undefined);
  categoriesRef.current = offers.status === 'ready' ? validCategoryKeys : undefined;
  const routeRef = useRef(route);
  const lastDiscoveryHash = useRef(route.name === 'home' ? window.location.hash || '#/' : '#/');
  const lastAppliedHash = useRef(window.location.hash || '#/');
  const timer = useRef<number | null>(null);
  const cancelPending = useCallback(() => {
    const pending = timer.current !== null;
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    return pending;
  }, []);
  const applyLocation = useCallback((hash: string) => {
    const next = parseHash(hash);
    routeRef.current = next;
    setRoute(next);
    lastAppliedHash.current = hash || '#/';
    if (next.name === 'home') {
      const parsed = parseFilterState(extractHashSearch(hash));
      filtersRef.current = parsed;
      setRawFilters(parsed);
      lastDiscoveryHash.current = hash || '#/';
    }
  }, []);
  const writeLocation = useCallback(
    (hash: string, method: 'push' | 'replace', preserveDraft = false) => {
      if ((window.location.hash || '#/') !== hash) {
        if (method === 'push') window.history.pushState(null, '', hash);
        else window.history.replaceState(window.history.state, '', hash);
      }
      if (preserveDraft) {
        lastAppliedHash.current = hash;
        lastDiscoveryHash.current = hash;
      } else applyLocation(hash);
    },
    [applyLocation]
  );
  useEffect(() => {
    const onLocationChange = () => {
      const hadPending = cancelPending();
      const hash = window.location.hash || '#/';
      if (!hadPending && hash === lastAppliedHash.current) return;
      applyLocation(hash);
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('popstate', onLocationChange);
    window.addEventListener('hashchange', onLocationChange);
    return () => {
      cancelPending();
      window.removeEventListener('popstate', onLocationChange);
      window.removeEventListener('hashchange', onLocationChange);
    };
  }, [applyLocation, cancelPending]);

  const currentDiscoveryHash = useCallback(
    () => buildDiscoveryHash(validateFilterState(filtersRef.current, categoriesRef.current)),
    []
  );
  const flushDiscovery = useCallback(() => {
    cancelPending();
    if (routeRef.current.name === 'home') writeLocation(currentDiscoveryHash(), 'replace');
  }, [cancelPending, currentDiscoveryHash, writeLocation]);
  const navigate = useCallback(
    (next: Route) => {
      flushDiscovery();
      const hash = next.name === 'home' ? lastDiscoveryHash.current : routeHash(next);
      writeLocation(hash, 'push');
      window.scrollTo({ top: 0 });
    },
    [flushDiscovery, writeLocation]
  );
  const handleFilterChange = useCallback(
    (update: Partial<FilterState>, method: 'push' | 'replace' = 'push') => {
      cancelPending();
      const previous = validateFilterState(filtersRef.current, categoriesRef.current);
      // Any intentional change cleans invalid category diagnostics.
      const next = { ...previous, ...update };
      delete next.invalidCategory;
      delete next.filterError;
      const hash = buildDiscoveryHash(next);
      const parsed = parseFilterState(extractHashSearch(hash));
      if ('q' in update && typeof update.q === 'string')
        parsed.q = Array.from(update.q.replace(/[\p{Cc}]/gu, ' '))
          .slice(0, 120)
          .join('');
      filtersRef.current = parsed;
      setRawFilters(parsed);
      if (method === 'replace')
        timer.current = window.setTimeout(() => {
          timer.current = null;
          if (routeRef.current.name === 'home') writeLocation(hash, 'replace', true);
        }, 250);
      else writeLocation(hash, 'push');
    },
    [cancelPending, writeLocation]
  );
  const handleResetFilters = useCallback(() => {
    cancelPending();
    filtersRef.current = { ...DEFAULT_FILTER_STATE };
    writeLocation('#/', 'push');
  }, [cancelPending, writeLocation]);
  const getSearchLink = useCallback(() => {
    cancelPending();
    writeLocation(currentDiscoveryHash(), 'replace', true);
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = currentDiscoveryHash();
    return url.href;
  }, [cancelPending, currentDiscoveryHash, writeLocation]);
  const onOpenDeal = useCallback((slug: string) => navigate({ name: 'deal', slug }), [navigate]);
  const onBackFromDeal = useCallback(() => navigate({ name: 'home' }), [navigate]);

  const deal = route.name === 'deal' ? deals.find((row) => row.slug === route.slug) : undefined;
  const guide = deal ? (guideRows.find((row) => row.slug === deal.slug) ?? null) : null;
  const guideNames: Record<string, { ar: string; en: string }> = Object.create(null);
  for (const row of deals) guideNames[row.slug] = { ar: row.name_ar, en: row.name_en };
  const omitted = (offers.data?.omitted ?? 0) + (guides.data?.omitted ?? 0);

  useEffect(() => {
    if (route.name === 'deal') {
      if (deal) {
        const dealName = lang === 'ar' ? deal.name_ar : deal.name_en;
        document.title = `${dealName} — AMNABD Deals`;
      } else if (offers.status === 'ready') {
        document.title =
          lang === 'ar'
            ? 'العرض غير موجود — AMNABD Deals'
            : 'Deal Not Found — AMNABD Deals';
      }
    } else if (route.name === 'guide') {
      document.title =
        lang === 'ar'
          ? 'دليل الاستخدام والشروط — AMNABD Deals'
          : 'Usage Guide & Terms — AMNABD Deals';
    } else if (route.name === 'notfound') {
      document.title =
        lang === 'ar'
          ? 'الصفحة غير موجودة (404) — AMNABD Deals'
          : 'Page Not Found (404) — AMNABD Deals';
    } else {
      document.title =
        lang === 'ar'
          ? 'AMNABD Deals — دليل عروض أدوات الذكاء الاصطناعي المجانية'
          : 'AMNABD Deals — Verified AI & Cloud Deals';
    }
  }, [route.name, route.slug, deal, lang, offers.status]);

  let content: JSX.Element;
  if (route.name === 'notfound')
    content = <NotFoundPage onBack={() => navigate({ name: 'home' })} />;
  else if (route.name === 'guide') {
    content =
      guides.status === 'error' ? (
        <main className="mx-auto max-w-4xl px-4 py-8">
          <ResourceNotice name="guides" error={guides.error} lang={lang} retry={guides.retry} />
        </main>
      ) : (
        <UsageGuidePage
          guides={guideRows}
          config={config}
          guideNames={guideNames}
          loading={guides.status === 'loading'}
        />
      );
  } else if (offers.status === 'error') {
    content = (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <ResourceNotice name="deals" error={offers.error} lang={lang} retry={offers.retry} />
      </main>
    );
  } else if (route.name === 'deal') {
    if (offers.status === 'loading')
      content = (
        <main
          className="mx-auto max-w-4xl px-4 py-10"
          aria-busy="true"
          aria-label={lang === 'ar' ? 'جارٍ التحميل' : 'Loading'}
        >
          <div className="skeleton h-64 w-full" />
        </main>
      );
    else if (!deal) content = <NotFoundPage onBack={() => navigate({ name: 'home' })} />;
    else
      content = (
        <DealDetailPage
          deal={deal}
          guide={guide}
          sectionLabels={config?.section_labels?.[lang] ?? {}}
          onBack={onBackFromDeal}
        />
      );
  } else {
    content = (
      <HomePage
        deals={deals}
        config={config}
        loading={offers.status === 'loading'}
        error={null}
        filterState={filterState}
        getSearchLink={getSearchLink}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        onOpenDeal={onOpenDeal}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:start-4 focus:z-50 focus:rounded-md focus:bg-emerald-500 focus:px-4 focus:py-2 focus:text-slate-950 focus:font-semibold focus:shadow-lg focus:outline-none"
      >
        {lang === 'ar' ? 'تخطي إلى المحتوى الرئيسي' : 'Skip to main content'}
      </a>
      <Navbar route={route} navigate={navigate} />
      <div id="main-content" tabIndex={-1} className="flex-1 outline-none">
        {settings.status === 'error' && (
          <ResourceNotice name="config" error={settings.error} lang={lang} retry={settings.retry} />
        )}
        {guides.status === 'error' && route.name !== 'guide' && (
          <ResourceNotice name="guides" error={guides.error} lang={lang} retry={guides.retry} />
        )}
        {offers.status === 'error' && route.name === 'guide' && (
          <ResourceNotice name="deals" error={offers.error} lang={lang} retry={offers.retry} />
        )}
        {omitted > 0 && (
          <p className="mx-auto max-w-6xl px-4 pt-4 text-sm text-amber-200" role="status">
            {lang === 'ar'
              ? 'تم استبعاد بعض السجلات غير الصالحة. قد تكون القائمة أو الأدلة غير مكتملة.'
              : 'Some invalid records were omitted. The list or guides may be incomplete.'}
          </p>
        )}
        <ContentErrorBoundary
          resetKey={`${route.name}:${route.slug ?? ''}:${lang}:${offers.status}:${guides.status}`}
          lang={lang}
        >
          {content}
        </ContentErrorBoundary>
      </div>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppInner />
    </LanguageProvider>
  );
}

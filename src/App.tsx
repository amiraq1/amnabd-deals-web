import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';
import { loadConfig, loadDeals, loadGuides } from '@/lib/loadResources';
import {
  parseHash,
  resolveLocationChange,
  routeUrl,
  type Route,
} from '@/lib/routes';
import {
  buildDiscoverySearch,
  DEFAULT_FILTER_STATE,
  parseFilterState,
  validateFilterState,
} from '@/lib/filterState';
import { categoryKey } from '@/lib/discovery';
import type { FilterState } from '@/types';
import { useResource } from '@/hooks/useResource';
import { useFavorites } from '@/hooks/useFavorites';
import { countValidSavedDeals } from '@/lib/savedDeals';
import ContentErrorBoundary from '@/components/ContentErrorBoundary';
import ResourceNotice from '@/components/ResourceNotice';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HomePage from '@/pages/HomePage';
import DealDetailPage from '@/pages/DealDetailPage';
import UsageGuidePage from '@/pages/UsageGuidePage';
import NotFoundPage from '@/pages/NotFoundPage';
import FavoritesPage from '@/pages/FavoritesPage';
import ChangelogPage from '@/pages/ChangelogPage';
import CollectionPage from '@/pages/CollectionPage';
import { buildDealSeo, applyDocumentMetadata } from '@/lib/seo';
import { routeMetadata } from '@/lib/metadata';

function AppInner() {
  const { lang } = useLanguage();
  // A01: `pathname` + `search` are the only source of truth. The legacy hash
  // was migrated once in main.tsx, before this component ever mounted.
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.pathname));
  // Each resource settles independently. Language is presentation state and is
  // deliberately not a dependency of any data request.
  const offers = useResource(loadDeals);
  const guides = useResource(loadGuides);
  const settings = useResource(loadConfig);
  const deals = useMemo(() => offers.data?.value ?? [], [offers.data?.value]);
  const guideRows = useMemo(() => guides.data?.value ?? [], [guides.data?.value]);
  const config = settings.data?.value ?? null;

  const { favorites } = useFavorites();
  const validSavedCount = useMemo(
    () => countValidSavedDeals(favorites, deals.map((d) => d.slug)),
    [favorites, deals]
  );

  const validCategoryKeys = useMemo(
    () => new Set(deals.map((d) => categoryKey(d.category.value))),
    [deals]
  );
  const [rawFilters, setRawFilters] = useState<FilterState>(() =>
    // H-01: the query string is the filter state.
    parseFilterState(window.location.search)
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
  const currentUrl = () => window.location.pathname + window.location.search;
  const lastDiscoveryUrl = useRef(route.name === 'home' ? currentUrl() : '/');
  const lastAppliedPath = useRef(window.location.pathname);
  const lastAppliedSearch = useRef(window.location.search.replace(/^\?/, ''));
  const timer = useRef<number | null>(null);
  const cancelPending = useCallback(() => {
    const pending = timer.current !== null;
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    return pending;
  }, []);
  const applyLocation = useCallback(() => {
    const next = parseHash(window.location.pathname);
    routeRef.current = next;
    setRoute(next);
    lastAppliedPath.current = window.location.pathname;
    lastAppliedSearch.current = window.location.search.replace(/^\?/, '');
    if (next.name === 'home') {
      const parsed = parseFilterState(window.location.search);
      filtersRef.current = parsed;
      setRawFilters(parsed);
      lastDiscoveryUrl.current = currentUrl();
    }
  }, []);
  const writeLocation = useCallback(
    (url: string, method: 'push' | 'replace', preserveDraft = false) => {
      // A01: the whole address is compared, not just the hash. Navigating home
      // from `/deal/alpha` used to be skipped because the hash was already `#/`.
      if (currentUrl() !== url) {
        if (method === 'push') window.history.pushState(null, '', url);
        else window.history.replaceState(window.history.state, '', url);
      }
      if (preserveDraft) {
        lastAppliedPath.current = window.location.pathname;
        lastAppliedSearch.current = window.location.search.replace(/^\?/, '');
        lastDiscoveryUrl.current = currentUrl();
      } else applyLocation();
    },
    [applyLocation]
  );
  useEffect(() => {
    const onLocationChange = () => {
      const hadPending = cancelPending();
      const decision = resolveLocationChange({
        pathname: window.location.pathname,
        search: window.location.search,
        lastAppliedPath: lastAppliedPath.current,
        lastAppliedSearch: lastAppliedSearch.current,
        hadPending,
      });
      if (!decision.apply) return;
      applyLocation();
      window.scrollTo({ top: 0 });
    };
    // Only `popstate` navigates. An in-page anchor (`#main-content`) fires
    // `hashchange`, not `popstate`, so the skip link leaves the filters and the
    // scroll position exactly as they are (H-10).
    window.addEventListener('popstate', onLocationChange);
    return () => {
      cancelPending();
      window.removeEventListener('popstate', onLocationChange);
    };
  }, [applyLocation, cancelPending]);

  const currentDiscoverySearch = useCallback(
    () => buildDiscoverySearch(validateFilterState(filtersRef.current, categoriesRef.current)),
    []
  );
  const currentDiscoveryUrl = useCallback(
    () => routeUrl({ name: 'home' }, currentDiscoverySearch()),
    [currentDiscoverySearch]
  );
  const flushDiscovery = useCallback(() => {
    cancelPending();
    if (routeRef.current.name === 'home') writeLocation(currentDiscoveryUrl(), 'replace');
  }, [cancelPending, currentDiscoveryUrl, writeLocation]);
  const navigate = useCallback(
    (next: Route) => {
      flushDiscovery();
      const url = next.name === 'home' ? lastDiscoveryUrl.current : routeUrl(next);
      writeLocation(url, 'push');
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
      const search = buildDiscoverySearch(next);
      const parsed = parseFilterState(search);
      if ('q' in update && typeof update.q === 'string')
        parsed.q = Array.from(update.q.replace(/[\p{Cc}]/gu, ' '))
          .slice(0, 120)
          .join('');
      filtersRef.current = parsed;
      setRawFilters(parsed);
      if (method === 'replace')
        timer.current = window.setTimeout(() => {
          timer.current = null;
          if (routeRef.current.name === 'home')
            writeLocation(routeUrl({ name: 'home' }, search), 'replace', true);
        }, 250);
      else writeLocation(routeUrl({ name: 'home' }, search), 'push');
    },
    [cancelPending, writeLocation]
  );
  const handleResetFilters = useCallback(() => {
    cancelPending();
    filtersRef.current = { ...DEFAULT_FILTER_STATE };
    writeLocation('/', 'push');
  }, [cancelPending, writeLocation]);
  const getSearchLink = useCallback(() => {
    cancelPending();
    const url = currentDiscoveryUrl();
    writeLocation(url, 'replace', true);
    return new URL(url, window.location.origin).href;
  }, [cancelPending, currentDiscoveryUrl, writeLocation]);
  const onOpenDeal = useCallback((slug: string) => navigate({ name: 'deal', slug }), [navigate]);
  const onBackFromDeal = useCallback(() => navigate({ name: 'home' }), [navigate]);

  const deal = route.name === 'deal' ? deals.find((row) => row.slug === route.slug) : undefined;
  const guide = deal ? (guideRows.find((row) => row.slug === deal.slug) ?? null) : null;
  const guideNames: Record<string, { ar: string; en: string }> = Object.create(null);
  for (const row of deals) guideNames[row.slug] = { ar: row.name_ar, en: row.name_en };
  const omitted = (offers.data?.omitted ?? 0) + (guides.data?.omitted ?? 0);

  // A12: every route resolves through one formatter. Leaving a deal page puts
  // the destination's canonical, description, OG tags and JSON-LD back, instead
  // of leaving the deal's behind.
  useEffect(() => {
    const dealSeo = deal ? buildDealSeo(deal) : null;
    applyDocumentMetadata(routeMetadata(route, lang, dealSeo));
  }, [route, deal, lang]);

  let content: JSX.Element;
  if (route.name === 'notfound')
    content = <NotFoundPage onBack={() => navigate({ name: 'home' })} />;
  else if (route.name === 'favorites') {
    content = (
      <FavoritesPage
        deals={deals}
        onOpenDeal={onOpenDeal}
        onBackToHome={() => navigate({ name: 'home' })}
      />
    );
  } else if (route.name === 'changelog') {
    content = (
      <ChangelogPage
        deals={deals}
        onOpenDeal={onOpenDeal}
        onBackToHome={() => navigate({ name: 'home' })}
      />
    );
  } else if (route.name === 'collection' && route.collectionKey) {
    content = (
      <CollectionPage
        collectionKey={route.collectionKey}
        deals={deals}
        onOpenDeal={onOpenDeal}
        onNavigateCollection={(slug) => navigate({ name: 'collection', collectionKey: slug })}
        onBackToHome={() => navigate({ name: 'home' })}
      />
    );
  } else if (route.name === 'guide') {
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
      <Navbar route={route} navigate={navigate} savedCount={validSavedCount} />
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

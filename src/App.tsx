import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';
import { loadConfig, loadDeals, loadGuides } from '@/lib/loadResources';
import {
  isHashOnlyLocationChange,
  parseHash,
  resolveLocationChange,
  routeIdentity,
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
import { languageSearchForLocation } from '@/lib/languageStorage';
import { comparisonSearch, parseComparisonSlugs, toggleComparisonSelection } from '@/lib/comparison';
import ComparisonPage from '@/pages/ComparisonPage';
import OfflineNotice from '@/components/OfflineNotice';
import PwaControls from '@/components/PwaControls';

function AppInner() {
  const { lang } = useLanguage();
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const needsFreshLoad = useRef(!navigator.onLine);
  useEffect(() => {
    const onOffline = () => {
      needsFreshLoad.current = true;
      setIsOnline(false);
    };
    const onOnline = () => {
      // A fresh navigation fetches both the HTML and PostgREST data again.
      // Do not reveal an in-memory catalog after a disconnected session.
      if (needsFreshLoad.current) window.location.reload();
      else setIsOnline(true);
    };
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, []);
  // A01: `pathname` + `search` are the only source of truth. The legacy hash
  // was migrated once in main.tsx, before this component ever mounted.
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.pathname));
  const [comparisonSelection, setComparisonSelection] = useState<string[]>(() =>
    parseComparisonSlugs(window.location.search)
  );
  // Each resource settles independently. Language is presentation state and is
  // deliberately not a dependency of any data request.
  const offers = useResource(loadDeals);
  const guides = useResource(loadGuides);
  const settings = useResource(loadConfig);
  // useResource retains its previous value for diagnostics/retries. Never render
  // that retained value as the current catalog after a loading/error transition.
  const deals = useMemo(
    () => offers.status === 'ready' ? offers.data?.value ?? [] : [],
    [offers.status, offers.data?.value],
  );
  const guideRows = useMemo(
    () => guides.status === 'ready' ? guides.data?.value ?? [] : [],
    [guides.status, guides.data?.value],
  );
  const config = settings.status === 'ready' ? settings.data?.value ?? null : null;

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
  const languageAwareSearch = useCallback(
    (search: string) =>
      languageSearchForLocation(search, lang, window.location.search),
    [lang]
  );
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
      // A01 regression: an in-page anchor fires `popstate` too. It changes only
      // the hash, so it must not cancel a debounced filter write — doing that
      // reverted the search box to the previous query.
      if (
        isHashOnlyLocationChange(
          window.location.pathname,
          window.location.search,
          lastAppliedPath.current,
          lastAppliedSearch.current
        )
      )
        return;
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

  // REC-16: a route change is a page change for keyboard and screen-reader
  // users. `navigate()` already scrolls to the top, but focus stayed on the
  // link that was clicked and nothing announced the new page. The effect keys
  // on the view identity, so `?lang=` toggles and filter edits do not steal
  // focus from the control the visitor is using.
  const viewIdentity = useMemo(() => routeIdentity(route), [route]);
  const lastViewIdentity = useRef(viewIdentity);
  const [routeAnnouncement, setRouteAnnouncement] = useState('');

  useEffect(() => {
    if (lastViewIdentity.current === viewIdentity) return;
    lastViewIdentity.current = viewIdentity;

    const container = document.getElementById('main-content');
    if (!container) return;
    // Move focus off the clicked link immediately: the next page may still be
    // loading its heading, and leaving focus behind is the bug being fixed.
    container.focus({ preventScroll: true });

    const focusHeading = (): boolean => {
      const heading = container.querySelector('h1');
      if (!heading) return false;
      if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
      setRouteAnnouncement(heading.textContent?.trim() || document.title);
      return true;
    };

    let timer = 0;
    const frame = requestAnimationFrame(() => {
      if (focusHeading()) return;
      // Content that renders asynchronously (a deal page, the guide) has no
      // heading on the first frame. One short retry is enough to catch it.
      setRouteAnnouncement(document.title);
      timer = window.setTimeout(focusHeading, 200);
    });

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [viewIdentity]);

  const currentDiscoverySearch = useCallback(
    () => buildDiscoverySearch(validateFilterState(filtersRef.current, categoriesRef.current)),
    []
  );
  const currentDiscoveryUrl = useCallback(
    () => routeUrl({ name: 'home' }, languageAwareSearch(currentDiscoverySearch())),
    [currentDiscoverySearch, languageAwareSearch]
  );
  const flushDiscovery = useCallback(() => {
    cancelPending();
    if (routeRef.current.name === 'home') writeLocation(currentDiscoveryUrl(), 'replace');
  }, [cancelPending, currentDiscoveryUrl, writeLocation]);
  const navigate = useCallback(
    (next: Route, searchOverride?: string) => {
      flushDiscovery();
      const search = searchOverride ??
        (next.name === 'home'
          ? new URL(lastDiscoveryUrl.current, window.location.origin).search
          : '');
      const url = routeUrl(next, languageAwareSearch(search));
      writeLocation(url, 'push');
      window.scrollTo({ top: 0 });
    },
    [flushDiscovery, languageAwareSearch, writeLocation]
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
            writeLocation(routeUrl({ name: 'home' }, languageAwareSearch(search)), 'replace', true);
        }, 250);
      else writeLocation(routeUrl({ name: 'home' }, languageAwareSearch(search)), 'push');
    },
    [cancelPending, languageAwareSearch, writeLocation]
  );
  const handleResetFilters = useCallback(() => {
    cancelPending();
    filtersRef.current = { ...DEFAULT_FILTER_STATE };
    writeLocation(routeUrl({ name: 'home' }, languageAwareSearch('')), 'push');
  }, [cancelPending, languageAwareSearch, writeLocation]);
  const getSearchLink = useCallback(() => {
    cancelPending();
    const url = currentDiscoveryUrl();
    writeLocation(url, 'replace', true);
    return new URL(url, window.location.origin).href;
  }, [cancelPending, currentDiscoveryUrl, writeLocation]);
  const onOpenDeal = useCallback((slug: string) => navigate({ name: 'deal', slug }), [navigate]);
  const onBackFromDeal = useCallback(() => navigate({ name: 'home' }), [navigate]);
  const onToggleComparison = useCallback(
    (slug: string) => {
      const update = toggleComparisonSelection(comparisonSelection, slug);
      if (update.limitReached) return;
      setComparisonSelection(update.selected);
      if (update.added && update.selected.length === 2) {
        const search = comparisonSearch(update.selected);
        if (search) navigate({ name: 'compare' }, search);
      }
    },
    [comparisonSelection, navigate]
  );
  const onClearComparison = useCallback(() => setComparisonSelection([]), []);
  const onOpenComparison = useCallback(() => {
    const search = comparisonSearch(comparisonSelection);
    if (search) navigate({ name: 'compare' }, search);
  }, [comparisonSelection, navigate]);

  const deal = route.name === 'deal' ? deals.find((row) => row.slug === route.slug) : undefined;
  const guide = deal ? (guideRows.find((row) => row.slug === deal.slug) ?? null) : null;
  const guideNames: Record<string, { ar: string; en: string }> = Object.create(null);
  for (const row of deals) guideNames[row.slug] = { ar: row.name_ar, en: row.name_en };
  const omitted =
    (offers.status === 'ready' ? offers.data?.omitted ?? 0 : 0) +
    (guides.status === 'ready' ? guides.data?.omitted ?? 0 : 0);

  // A12: every route resolves through one formatter. Leaving a deal page puts
  // the destination's canonical, description, OG tags and JSON-LD back, instead
  // of leaving the deal's behind.
  useEffect(() => {
    const dealSeo = deal ? buildDealSeo(deal) : null;
    // A deal page has two empty states: still loading (keep its own canonical)
    // and confirmed missing (404 copy).
    const dealMissing = route.name === 'deal' && offers.status === 'ready' && !deal;
    applyDocumentMetadata(routeMetadata(route, lang, dealSeo, undefined, dealMissing));
  }, [route, deal, lang, offers.status]);

  let content: JSX.Element;
  if (!isOnline)
    content = <OfflineNotice lang={lang} onRetry={() => window.location.reload()} />;
  else if (route.name === 'notfound')
    content = <NotFoundPage onBack={() => navigate({ name: 'home' })} />;
  else if (offers.status === 'error' && route.name !== 'guide') {
    // Applies before every deal-dependent route, including details/comparison.
    content = (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <ResourceNotice name="deals" error={offers.error} lang={lang} retry={offers.retry} />
      </main>
    );
  } else if (offers.status === 'loading' && ['favorites', 'changelog', 'collection'].includes(route.name)) {
    content = (
      <main className="mx-auto w-full max-w-4xl px-4 py-10" aria-busy="true" aria-label={lang === 'ar' ? 'جارٍ تحميل بيانات العروض' : 'Loading offer data'}>
        <div className="skeleton h-64 w-full" />
      </main>
    );
  } else if (route.name === 'favorites') {
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
  } else if (route.name === 'compare') {
    content = offers.status === 'loading' ? (
      <main className="mx-auto max-w-4xl px-4 py-10" aria-busy="true" aria-label={lang === 'ar' ? 'جارٍ تحميل بيانات المقارنة' : 'Loading comparison data'}>
        <div className="skeleton h-64 w-full" />
      </main>
    ) : (
      <ComparisonPage
        deals={deals}
        slugs={parseComparisonSlugs(window.location.search)}
        onBackToHome={() => navigate({ name: 'home' })}
        onClearAndBack={() => {
          onClearComparison();
          navigate({ name: 'home' });
        }}
        onOpenDeal={onOpenDeal}
      />
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
          onToggleComparison={onToggleComparison}
          comparisonSelected={comparisonSelection.includes(deal.slug)}
          comparisonDisabled={comparisonSelection.length >= 2 && !comparisonSelection.includes(deal.slug)}
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
        comparisonSelection={comparisonSelection}
        onToggleComparison={onToggleComparison}
        onClearComparison={onClearComparison}
        onOpenComparison={onOpenComparison}
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
      {/* Announce the new page once focus has moved to its heading. */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {routeAnnouncement}
      </div>
      <PwaControls lang={lang} />
      <Navbar route={route} navigate={navigate} savedCount={isOnline ? validSavedCount : 0} />
      {isOnline && comparisonSelection.length === 1 && route.name !== 'home' && route.name !== 'compare' && (
        <section className="mx-auto mt-4 flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 sm:px-6" role="status">
          <p className="text-sm text-slate-300">
            {lang === 'ar'
              ? `تم اختيار «${deals.find((item) => item.slug === comparisonSelection[0])?.name_ar ?? comparisonSelection[0]}»؛ اختر عرضًا ثانيًا.`
              : `“${deals.find((item) => item.slug === comparisonSelection[0])?.name_en ?? comparisonSelection[0]}” is selected; choose one more offer.`}
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={() => navigate({ name: 'home' })} className="min-h-11 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/20">
              {lang === 'ar' ? 'اختيار العرض الثاني' : 'Choose the second offer'}
            </button>
            <button type="button" onClick={onClearComparison} className="min-h-11 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:border-slate-500">
              {lang === 'ar' ? 'إلغاء' : 'Clear'}
            </button>
          </div>
        </section>
      )}
      <div id="main-content" tabIndex={-1} className="flex-1 outline-none">
        {isOnline && settings.status === 'error' && (
          <ResourceNotice name="config" error={settings.error} lang={lang} retry={settings.retry} />
        )}
        {isOnline && guides.status === 'error' && route.name !== 'guide' && (
          <ResourceNotice name="guides" error={guides.error} lang={lang} retry={guides.retry} />
        )}
        {isOnline && offers.status === 'error' && route.name === 'guide' && (
          <ResourceNotice name="deals" error={offers.error} lang={lang} retry={offers.retry} />
        )}
        {isOnline && omitted > 0 && (
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

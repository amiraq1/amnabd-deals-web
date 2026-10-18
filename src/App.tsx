import { useCallback, useEffect, useMemo, useState } from 'react';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';
import { loadConfig, loadDeals, loadGuides } from '@/lib/loadResources';
import { extractHashSearch, parseHash, routeHash, type Route } from '@/lib/routes';
import { buildDiscoveryHash, DEFAULT_FILTER_STATE, parseFilterState } from '@/lib/filterState';
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
  const [lastDiscoveryHash, setLastDiscoveryHash] = useState<string>(() => {
    const h = window.location.hash;
    const r = parseHash(h);
    return r.name === 'home' ? h || '#/' : '#/';
  });

  // Each resource settles independently. Language is presentation state and is
  // deliberately not a dependency of any data request.
  const offers = useResource(loadDeals);
  const guides = useResource(loadGuides);
  const settings = useResource(loadConfig);
  const deals = useMemo(() => offers.data?.value ?? [], [offers.data?.value]);
  const guideRows = useMemo(() => guides.data?.value ?? [], [guides.data?.value]);
  const config = settings.data?.value ?? null;

  const validCategoryKeys = useMemo(() => {
    const set = new Set<string>();
    for (const d of deals) {
      const k = categoryKey(d.category?.value);
      if (k) set.add(k);
    }
    return set;
  }, [deals]);

  const [filterState, setFilterState] = useState<FilterState>(() => {
    return parseFilterState(extractHashSearch(window.location.hash));
  });

  // Re-validate category once deals load
  useEffect(() => {
    if (deals.length > 0) {
      setFilterState(() =>
        parseFilterState(extractHashSearch(window.location.hash), validCategoryKeys)
      );
    }
  }, [deals, validCategoryKeys]);

  useEffect(() => {
    const onLocationChange = () => {
      const h = window.location.hash;
      const parsedRoute = parseHash(h);
      setRoute(parsedRoute);
      if (parsedRoute.name === 'home') {
        const parsedFilters = parseFilterState(extractHashSearch(h), validCategoryKeys);
        setFilterState(parsedFilters);
        setLastDiscoveryHash(h || '#/');
      }
      window.scrollTo({ top: 0 });
    };

    window.addEventListener('popstate', onLocationChange);
    window.addEventListener('hashchange', onLocationChange);
    return () => {
      window.removeEventListener('popstate', onLocationChange);
      window.removeEventListener('hashchange', onLocationChange);
    };
  }, [validCategoryKeys]);

  const navigate = useCallback(
    (next: Route) => {
      if (next.name === 'home') {
        const targetHash = lastDiscoveryHash || '#/';
        if (window.location.hash === targetHash) setRoute(parseHash(targetHash));
        else window.location.hash = targetHash;
        return;
      }
      const hash = routeHash(next);
      if (window.location.hash === hash) setRoute(parseHash(hash));
      else window.location.hash = hash;
    },
    [lastDiscoveryHash]
  );

  const handleFilterChange = useCallback(
    (update: Partial<FilterState>, method: 'push' | 'replace' = 'push') => {
      setFilterState((prev) => {
        const next: FilterState = { ...prev, ...update };
        if ('category' in update) {
          delete next.invalidCategory;
        }
        const newHash = buildDiscoveryHash(next);
        if (method === 'replace') {
          window.history.replaceState(null, '', newHash);
        } else {
          window.history.pushState(null, '', newHash);
        }
        setLastDiscoveryHash(newHash);
        return next;
      });
    },
    []
  );

  const handleResetFilters = useCallback(() => {
    const reset = { ...DEFAULT_FILTER_STATE };
    const newHash = '#/';
    window.history.pushState(null, '', newHash);
    setFilterState(reset);
    setLastDiscoveryHash(newHash);
  }, []);

  const onOpenDeal = useCallback(
    (slug: string) => {
      setLastDiscoveryHash(window.location.hash || '#/');
      navigate({ name: 'deal', slug });
    },
    [navigate]
  );

  const onBackFromDeal = useCallback(() => {
    const target = lastDiscoveryHash || '#/';
    if (window.location.hash === target) setRoute(parseHash(target));
    else window.location.hash = target;
  }, [lastDiscoveryHash]);

  const deal = route.name === 'deal' ? deals.find((row) => row.slug === route.slug) : undefined;
  const guide = deal ? (guideRows.find((row) => row.slug === deal.slug) ?? null) : null;
  const guideNames: Record<string, { ar: string; en: string }> = Object.create(null);
  for (const row of deals) guideNames[row.slug] = { ar: row.name_ar, en: row.name_en };
  const omitted = (offers.data?.omitted ?? 0) + (guides.data?.omitted ?? 0);

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
        <main className="mx-auto max-w-4xl px-4 py-10">
          <div
            className="skeleton h-64 w-full"
            aria-label={lang === 'ar' ? 'جارٍ التحميل' : 'Loading'}
          />
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
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        onOpenDeal={onOpenDeal}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar route={route} navigate={navigate} />
      <div className="flex-1">
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

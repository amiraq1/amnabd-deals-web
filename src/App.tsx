import { useCallback, useEffect, useState } from 'react';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';
import { loadConfig, loadDeals, loadGuides } from '@/lib/loadResources';
import { parseHash, routeHash, type Route } from '@/lib/routes';
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
  const deals = offers.data?.value ?? [];
  const guideRows = guides.data?.value ?? [];
  const config = settings.data?.value ?? null;

  useEffect(() => {
    const onHash = () => {
      setRoute(parseHash(window.location.hash));
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const navigate = useCallback((next: Route) => {
    const hash = routeHash(next);
    if (window.location.hash === hash) setRoute(parseHash(hash));
    else window.location.hash = hash;
  }, []);

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
          onBack={() => navigate({ name: 'home' })}
        />
      );
  } else {
    content = (
      <HomePage
        deals={deals}
        config={config}
        loading={offers.status === 'loading'}
        error={null}
        onOpenDeal={(slug) => navigate({ name: 'deal', slug })}
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

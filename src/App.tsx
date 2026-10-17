import { useCallback, useEffect, useState } from 'react';
import type { Deal, SiteConfig, UsageGuide } from '@/types';
import { supabase } from '@/lib/supabase';
import { validateConfig, validateDeals, validateGuides } from '@/lib/validate';
import ContentErrorBoundary from '@/components/ContentErrorBoundary';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';
import Navbar, { type Route } from '@/components/Navbar';
import Footer from '@/components/Footer';
import HomePage from '@/pages/HomePage';
import DealDetailPage from '@/pages/DealDetailPage';
import UsageGuidePage from '@/pages/UsageGuidePage';
import NotFoundPage from '@/pages/NotFoundPage';

function parseHash(): Route {
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (!hash) return { name: 'home' };
  const [head, rest] = hash.split('/');
  if (head === 'guide') return { name: 'guide' };
  if (head === 'deal' && rest) return { name: 'deal', slug: decodeURIComponent(rest) };
  return { name: 'notfound' };
}

function AppInner() {
  const { lang } = useLanguage();
  const [route, setRoute] = useState<Route>(() => parseHash());
  const [deals, setDeals] = useState<Deal[]>([]);
  const [guides, setGuides] = useState<UsageGuide[]>([]);
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [omittedRows, setOmittedRows] = useState(0);
  const [invalidDeals, setInvalidDeals] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onHash = () => {
      setRoute(parseHash());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = useCallback((next: Route) => {
    const hash =
      next.name === 'home'
        ? '#/'
        : next.name === 'guide'
          ? '#/guide'
          : next.name === 'deal' && next.slug
            ? `#/deal/${encodeURIComponent(next.slug)}`
            : '#/404';
    if (window.location.hash === hash) {
      setRoute(next);
    } else {
      window.location.hash = hash;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setOmittedRows(0);
      setInvalidDeals(false);
      try {
        const [dealsRes, guidesRes, configRes] = await Promise.all([
          supabase.from('deals').select('*').order('id'),
          supabase.from('usage_guides').select('*').order('slug'),
          supabase.from('site_config').select('*').eq('id', 'main').maybeSingle(),
        ]);
        if (cancelled) return;
        if (dealsRes.error) throw dealsRes.error;
        if (guidesRes.error) throw guidesRes.error;
        if (configRes.error) throw configRes.error;

        const checkedDeals = validateDeals(dealsRes.data);
        const checkedGuides = validateGuides(guidesRes.data);
        const checkedConfig = validateConfig(configRes.data);
        if (checkedDeals.invalidCollection || (checkedDeals.rejectedRows > 0 && checkedDeals.values.length === 0)) {
          setDeals([]);
          setInvalidDeals(true);
          console.warn('[data] invalid_deals_collection', { rejectedRows: checkedDeals.rejectedRows });
          throw new Error('Invalid deals collection');
        }
        setDeals(checkedDeals.values);
        setGuides(checkedGuides.values);
        setConfig(checkedConfig.value);
        const rejectedRows = checkedDeals.rejectedRows + checkedGuides.rejectedRows + checkedConfig.rejectedRows;
        setOmittedRows(rejectedRows);
        const normalizedFields = checkedDeals.normalizedFields + checkedGuides.normalizedFields + checkedConfig.normalizedFields;
        if (rejectedRows || normalizedFields) {
          console.warn('[data] validation_summary', { rejectedRows, normalizedFields });
        }
      } catch {
        if (!cancelled) {
          setError(
            lang === 'ar'
              ? 'تعذر تحميل البيانات. تحقق من الاتصال وحاول مجددًا.'
              : 'Could not load data. Check your connection and try again.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [lang]);

  const deal = route.name === 'deal' ? deals.find((d) => d.slug === route.slug) : undefined;
  const guideForDeal = deal ? guides.find((g) => g.slug === deal.slug) ?? null : null;

  const sectionLabels = config?.section_labels?.[lang] ?? {};

  const guideNames: Record<string, { ar: string; en: string }> = Object.create(null);
  for (const d of deals) {
    guideNames[d.slug] = { ar: d.name_ar, en: d.name_en };
  }

  let content: JSX.Element;
  if (invalidDeals && !loading) {
    content = (
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6" role="alert">
        {lang === 'ar' ? 'تعذر عرض بيانات العروض لأنها غير صالحة. يرجى المحاولة لاحقًا.' : 'Offer data could not be displayed because it is invalid. Please try again later.'}
      </main>
    );
  } else if (route.name === 'guide') {
    content = (
      <UsageGuidePage
        guides={guides}
        config={config}
        guideNames={guideNames}
        loading={loading}
      />
    );
  } else if (route.name === 'deal') {
    if (loading) {
      content = (
        <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <div className="skeleton h-64 w-full" />
        </main>
      );
    } else if (!deal) {
      content = <NotFoundPage onBack={() => navigate({ name: 'home' })} />;
    } else {
      content = (
        <DealDetailPage
          deal={deal}
          guide={guideForDeal}
          sectionLabels={sectionLabels}
          onBack={() => navigate({ name: 'home' })}
        />
      );
    }
  } else if (route.name === 'notfound') {
    content = <NotFoundPage onBack={() => navigate({ name: 'home' })} />;
  } else {
    content = (
      <HomePage
        deals={deals}
        config={config}
        loading={loading}
        error={error}
        onOpenDeal={(slug) => navigate({ name: 'deal', slug })}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar route={route} navigate={navigate} />
      <div className="flex-1">
        {omittedRows > 0 && !loading && (
          <p className="mx-auto max-w-6xl px-4 pt-4 text-sm text-amber-200" role="status">
            {lang === 'ar'
              ? 'تم استبعاد بعض السجلات غير الصالحة. قد تكون القائمة أو الأدلة غير مكتملة.'
              : 'Some invalid records were omitted. The list or guides may be incomplete.'}
          </p>
        )}
        <ContentErrorBoundary resetKey={`${route.name}:${route.slug ?? ''}:${lang}`} lang={lang}>
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

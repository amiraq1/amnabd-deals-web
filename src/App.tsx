import { useCallback, useEffect, useState } from 'react';
import type { Deal, SiteConfig, UsageGuide } from '@/types';
import { supabase } from '@/lib/supabase';
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

interface DealRow {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  icon_url?: string;
  description_ar: string;
  description_en: string;
  category: unknown;
  benefits: unknown;
  eligibility: unknown;
  pricing: unknown;
  registration: unknown;
  official_sources: unknown;
  get_offer: unknown;
  review: unknown;
}

function AppInner() {
  const { lang } = useLanguage();
  const [route, setRoute] = useState<Route>(() => parseHash());
  const [deals, setDeals] = useState<Deal[]>([]);
  const [guides, setGuides] = useState<UsageGuide[]>([]);
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(true);
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

        setDeals((dealsRes.data ?? []) as unknown as Deal[]);
        setGuides((guidesRes.data ?? []) as unknown as UsageGuide[]);
        setConfig((configRes.data ?? null) as unknown as SiteConfig | null);
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

  const guideNames: Record<string, { ar: string; en: string }> = {};
  for (const d of deals) {
    guideNames[d.slug] = { ar: d.name_ar, en: d.name_en };
  }

  let content: JSX.Element;
  if (route.name === 'guide') {
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
      <div className="flex-1">{content}</div>
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

export type { DealRow };

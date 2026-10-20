import { useMemo } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  GraduationCap,
  CreditCard,
  Code2,
  Clock,
  Sparkles,
  Inbox,
} from 'lucide-react';
import type { Deal } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { useFavorites } from '@/hooks/useFavorites';
import { AGGREGATIONS, type AggregationConfig } from '@/lib/aggregations';
import DealCard from '@/components/DealCard';

interface CollectionPageProps {
  collectionKey: string;
  deals: Deal[];
  onOpenDeal: (slug: string) => void;
  onNavigateCollection: (slug: string) => void;
  onBackToHome: () => void;
}

const COLLECTION_ICONS: Record<string, typeof GraduationCap> = {
  'for-students': GraduationCap,
  'no-credit-card': CreditCard,
  coding: Code2,
  'ending-soon': Clock,
};

export default function CollectionPage({
  collectionKey,
  deals,
  onOpenDeal,
  onNavigateCollection,
  onBackToHome,
}: CollectionPageProps) {
  const { lang, dir } = useLanguage();
  const { favorites, toggleFavorite } = useFavorites();

  const config: AggregationConfig | undefined = AGGREGATIONS[collectionKey];
  const Icon = COLLECTION_ICONS[collectionKey] || Sparkles;
  const ArrowIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  const matchingDeals = useMemo(() => {
    if (!config) return [];
    return deals.filter(config.filter);
  }, [deals, config]);

  if (!config) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-white">
          {lang === 'ar' ? 'المجموعة غير موجودة' : 'Collection not found'}
        </h1>
        <button
          type="button"
          onClick={onBackToHome}
          className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
        >
          {lang === 'ar' ? 'العودة للصفحة الرئيسية' : 'Back to Home'}
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 pb-12 pt-6 sm:px-6">
      {/* 1. Back Navigation & Collection Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBackToHome}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-white"
        >
          <ArrowIcon className="h-4 w-4" />
          <span>{lang === 'ar' ? 'كل العروض' : 'All Deals'}</span>
        </button>

        {/* Quick Collection Switcher Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {Object.values(AGGREGATIONS).map((agg) => {
            const isActive = agg.slug === collectionKey;
            const AggIcon = COLLECTION_ICONS[agg.slug] || Sparkles;
            return (
              <button
                key={agg.slug}
                type="button"
                onClick={() => onNavigateCollection(agg.slug)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                  isActive
                    ? 'border border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                    : 'border border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <AggIcon className="h-3 w-3" />
                <span>{lang === 'ar' ? agg.badgeLabelAr : agg.badgeLabelEn}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Collection Hero Banner */}
      <header className="relative mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-8">
        <div
          className="pointer-events-none absolute -top-24 end-[-5%] h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl"
          aria-hidden
        />
        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
            <Icon className="h-3.5 w-3.5" />
            <span>{lang === 'ar' ? config.badgeLabelAr : config.badgeLabelEn}</span>
          </div>

          <h1 className="font-heading mt-3 text-2xl font-extrabold leading-tight text-white sm:text-3xl">
            {lang === 'ar' ? config.headingAr : config.headingEn}
          </h1>

          <p className="mt-2.5 text-sm leading-relaxed text-slate-300 sm:text-base">
            {lang === 'ar' ? config.descriptionAr : config.descriptionEn}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>
                {matchingDeals.length}{' '}
                {lang === 'ar'
                  ? matchingDeals.length === 1
                    ? 'عرض متوفر وموثّق'
                    : matchingDeals.length === 2
                      ? 'عرضان متوفران'
                      : 'عروض متوفرة'
                  : matchingDeals.length === 1
                    ? 'verified deal'
                    : 'verified deals'}
              </span>
            </span>
            <span className="text-slate-600">·</span>
            <span>
              {lang === 'ar'
                ? 'محدّثة دورياً من المصادر والصفحات الرسمية'
                : 'Regularly updated from official provider sources'}
            </span>
          </div>
        </div>
      </header>

      {/* 3. Deals Grid */}
      <section className="mt-8">
        {matchingDeals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 py-16 text-center text-slate-400">
            <Inbox className="mx-auto mb-3 h-8 w-8 text-slate-600" />
            <p className="text-sm font-medium">
              {lang === 'ar'
                ? 'لا توجد عروض نشطة حالياً في هذه المجموعة.'
                : 'No active deals currently in this collection.'}
            </p>
            <button
              type="button"
              onClick={onBackToHome}
              className="mt-4 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
            >
              {lang === 'ar' ? 'تصفح كل العروض الأخرى' : 'Browse all other deals'}
            </button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {matchingDeals.map((deal, idx) => (
              <DealCard
                key={deal.slug}
                deal={deal}
                index={idx}
                onOpen={onOpenDeal}
                isFavorited={favorites.includes(deal.slug)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  GraduationCap,
  CreditCard,
  Code2,
  Clock,
  Inbox,
  ExternalLink,
} from 'lucide-react';
import type { Deal } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { AGGREGATIONS, type AggregationConfig } from '@/lib/aggregations';
import { isVerifiedReview } from '@/lib/verification';
import { getTimingState } from '@/lib/dealTiming';
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

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand';

export default function CollectionPage({
  collectionKey,
  deals,
  onOpenDeal,
  onNavigateCollection,
  onBackToHome,
}: CollectionPageProps) {
  const { lang, dir } = useLanguage();
  const [referenceNow, setReferenceNow] = useState(() => new Date());
  useEffect(() => {
    const refresh = () => setReferenceNow(new Date());
    const timer = window.setInterval(refresh, 60000);
    document.addEventListener('visibilitychange', refresh);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', refresh); };
  }, []);

  const config: AggregationConfig | undefined = AGGREGATIONS[collectionKey];
  const Icon = COLLECTION_ICONS[collectionKey] || Inbox;
  const ArrowIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  const matchingDeals = useMemo(() => {
    if (!config) return [];
    return deals.filter((deal) => getTimingState(deal, referenceNow).offer.state !== 'expired' && config.filter(deal, referenceNow));
  }, [deals, config, referenceNow]);

  // Use the same explicit current/legacy review signals as the homepage.
  const verifiedCount = useMemo(
    () => matchingDeals.filter((deal) => isVerifiedReview(deal.review)).length,
    [matchingDeals]
  );

  if (!config) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-stone-100">
          {lang === 'ar' ? 'المجموعة غير موجودة' : 'Collection not found'}
        </h1>
        <button
          type="button"
          onClick={onBackToHome}
          className={`mt-4 inline-flex min-h-11 items-center rounded-lg border border-line bg-surface-raised px-4 py-2 text-sm font-semibold text-stone-100 hover:border-line-hover ${focusRing}`}
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
          className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg text-sm font-medium text-stone-400 transition-colors hover:text-stone-100 ${focusRing}`}
        >
          <ArrowIcon className="h-4 w-4" aria-hidden="true" />
          <span>{lang === 'ar' ? 'كل العروض' : 'All Deals'}</span>
        </button>

        {/* Quick Collection Switcher Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {Object.values(AGGREGATIONS).map((agg) => {
            const isActive = agg.slug === collectionKey;
            const AggIcon = COLLECTION_ICONS[agg.slug] || Inbox;
            return (
              <button
                key={agg.slug}
                type="button"
                onClick={() => onNavigateCollection(agg.slug)}
                className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${focusRing} ${
                  isActive
                    ? 'border border-line-hover bg-surface-overlay text-white font-semibold'
                    : 'border border-line bg-surface-raised text-stone-300 hover:border-line-hover hover:text-stone-100'
                }`}
              >
                <AggIcon className="h-3.5 w-3.5 text-stone-400" aria-hidden="true" />
                <span>{lang === 'ar' ? agg.badgeLabelAr : agg.badgeLabelEn}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Collection Hero Banner */}
      <header className="relative mt-6 overflow-hidden rounded-card border border-line bg-surface-raised shadow-card p-6 sm:p-8">
        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-md border border-line bg-surface-card-inner px-3 py-1 text-xs font-semibold text-stone-300">
            <Icon className="h-3.5 w-3.5 text-stone-400" aria-hidden="true" />
            <span>{lang === 'ar' ? config.badgeLabelAr : config.badgeLabelEn}</span>
          </div>

          <h1 className="font-heading mt-3 text-2xl font-bold leading-tight tracking-tight text-stone-100 sm:text-3xl">
            {lang === 'ar' ? config.headingAr : config.headingEn}
          </h1>

          <p className="mt-2.5 text-sm leading-relaxed text-stone-300 sm:text-base">
            {lang === 'ar' ? config.descriptionAr : config.descriptionEn}
          </p>
          <p className="mt-2 text-xs text-stone-400">
            {lang === 'ar'
              ? 'تستبعد هذه المجموعة العروض التي ثبت انتهاءها؛ عدم ظهور الانتهاء لا يضمن التوفر.'
              : 'Offers known to have ended are excluded; absence of an expiry does not guarantee availability.'}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-stone-400">
            <span className="inline-flex items-center gap-1.5 font-semibold text-stone-200">
              <span className="h-2 w-2 rounded-full bg-stone-400" aria-hidden="true" />
              {/* Counts are separated from the "verified" adjective so neither is
                  claimed for rows that were never verified. */}
              <span className="tabular-nums">
                {lang === 'ar'
                  ? `العروض: ${matchingDeals.length.toLocaleString('ar-EG')}`
                  : `Deals: ${matchingDeals.length}`}
              </span>
            </span>
            <span className="text-stone-600" aria-hidden="true">·</span>
            <span className="tabular-nums text-stone-300">
              {lang === 'ar'
                ? `سجلات تمت مراجعتها: ${verifiedCount.toLocaleString('ar-EG')}`
                : `Records reviewed: ${verifiedCount}`}
            </span>
            <span className="text-stone-600" aria-hidden="true">·</span>
            <span>
              {lang === 'ar'
                ? 'محدّثة دورياً من صفحات الجهات المزوّدة'
                : 'Regularly updated from official provider sources'}
            </span>
          </div>
        </div>
      </header>

      {collectionKey === 'for-students' && config.studentVerificationGuide && (
        <section
          aria-labelledby="student-verification-heading"
          className="mt-6 rounded-card border border-line bg-surface-raised shadow-card p-5 sm:p-6"
        >
          <div className="max-w-3xl">
            <h2
              id="student-verification-heading"
              className="font-heading text-lg font-bold text-stone-100 sm:text-xl"
            >
              {config.studentVerificationGuide.heading[lang]}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-300">
              {config.studentVerificationGuide.intro[lang]}
            </p>
          </div>

          <ol className="mt-5 grid gap-3 md:grid-cols-3">
            {config.studentVerificationGuide.steps.map((step, index) => (
              <li
                key={step.title.en}
                className="flex flex-col rounded-lg border border-line bg-surface p-4"
              >
                <div className="flex items-start gap-2.5">
                  <span
                    aria-hidden="true"
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line bg-surface-raised text-xs font-bold tabular-nums text-stone-200"
                  >
                    {index + 1}
                  </span>
                  <h3 className="pt-0.5 text-sm font-semibold text-stone-100">
                    {step.title[lang]}
                  </h3>
                </div>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-stone-300">
                  {step.body[lang]}
                </p>
                <a
                  href={step.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-stone-200 underline underline-offset-4 hover:text-white ${focusRing}`}
                >
                  <bdi>{step.sourceLabel[lang]}</bdi>
                  <ExternalLink className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ol>

          <aside className="mt-4 rounded-lg border border-line bg-surface p-4">
            <p className="text-sm leading-relaxed text-stone-300">
              {config.studentVerificationGuide.creditNote[lang]}
            </p>
            <a
              href={config.studentVerificationGuide.packTermsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-2 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-amber-300 underline underline-offset-4 hover:text-amber-200 ${focusRing}`}
            >
              <bdi>{config.studentVerificationGuide.packTermsLabel[lang]}</bdi>
              <ExternalLink className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden="true" />
            </a>
          </aside>
        </section>
      )}

      {/* 3. Deals Grid */}
      <section className="mt-8">
        {matchingDeals.length === 0 ? (
          <div className="rounded-card border border-line bg-surface-raised shadow-card py-16 text-center text-stone-400">
            <Inbox className="mx-auto mb-3 h-8 w-8 text-stone-500" aria-hidden="true" />
            <p className="text-sm font-medium">
              {lang === 'ar'
                ? 'لا توجد عروض نشطة حالياً في هذه المجموعة.'
                : 'No active deals currently in this collection.'}
            </p>
            <button
              type="button"
              onClick={onBackToHome}
              className={`mt-4 inline-flex min-h-11 items-center rounded-lg border border-line bg-surface-card-inner px-4 py-2 text-xs font-semibold text-stone-200 transition-colors hover:border-line-hover hover:text-stone-100 ${focusRing}`}
            >
              {lang === 'ar' ? 'العودة للصفحة الرئيسية' : 'Back to Home'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {matchingDeals.map((deal) => (
              <DealCard
                key={deal.slug}
                deal={deal}
                referenceNow={referenceNow}
                onOpen={onOpenDeal}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

import { useMemo, useState, useEffect } from 'react';
import { Search, X, SlidersHorizontal, Inbox, ShieldAlert } from 'lucide-react';
import type { Deal, SiteConfig } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { matchesQuery } from '@/lib/normalize';
import { tristateLabel } from '@/lib/tristate';
import { getDealDisplayName } from '@/lib/dealMetadata';
import DealCard from '@/components/DealCard';
import InfoBanner from '@/components/InfoBanner';

type ApplicantFilter = 'all' | 'student' | 'any';
type CardFilter = 'all' | 'not_required';

interface HomePageProps {
  deals: Deal[];
  config: SiteConfig | null;
  loading: boolean;
  error: string | null;
  onOpenDeal: (slug: string) => void;
}

export default function HomePage({ deals, config, loading, error, onOpenDeal }: HomePageProps) {
  const { lang, pick } = useLanguage();
  const [query, setQuery] = useState('');
  const [applicant, setApplicant] = useState<ApplicantFilter>('all');
  const [cardFilter, setCardFilter] = useState<CardFilter>('all');
  const [showFilters, setShowFilters] = useState(false);

  const overview = config?.overview?.[lang] ?? {};

  const filtered = useMemo(() => {
    return deals.filter((deal) => {
      if (applicant === 'student' && deal.eligibility.student_status !== 'required') return false;
      if (cardFilter === 'not_required' && deal.eligibility.card_required !== 'not_required')
        return false;
      if (query.trim()) {
        const officialName = getDealDisplayName(deal);
        const nameAr = deal.name_ar;
        const desc = lang === 'ar' ? deal.description_ar : deal.description_en;
        if (
          !matchesQuery(officialName, query) &&
          !matchesQuery(nameAr, query) &&
          !matchesQuery(desc, query)
        )
          return false;
      }
      return true;
    });
  }, [deals, query, applicant, cardFilter, lang]);

  const hasActiveFilters = applicant !== 'all' || cardFilter !== 'all' || query.trim() !== '';

  useEffect(() => {
    if (query.trim() || hasActiveFilters) return;
  }, [query, hasActiveFilters]);

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="skeleton h-40 w-full" />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-56" />
          ))}
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <InfoBanner kind="warning" text={error} />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 pb-8 pt-10 sm:px-6">
      <section className="animate-fade-up">
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-8 sm:p-12">
          <div
            className="pointer-events-none absolute -top-24 end-[-10%] h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-24 start-[-5%] h-64 w-64 rounded-full bg-gold/5 blur-3xl"
            aria-hidden
          />
          <div className="relative max-w-2xl">
            <h1 className="font-heading text-3xl font-extrabold leading-tight text-white sm:text-4xl">
              {overview.title ?? (lang === 'ar' ? 'دليل التسجيل وفهم قيود العروض' : 'Offer registration and limitations guide')}
            </h1>
            <p className="mt-3 text-base leading-relaxed text-slate-300">
              {overview.description ??
                (lang === 'ar'
                  ? 'دليل عربي لمراجعة الأهلية والتسجيل والقيود والرسوم وما يحدث عند انتهاء المنفعة، وفق الأدلة المتاحة والمصادر الرسمية.'
                  : 'A bilingual guide to eligibility, registration, limits and fees, and what is known after a benefit ends.')}
            </p>
            <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-gold/30 bg-gold/5 p-4">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
              <p className="text-sm leading-relaxed text-gold-100 text-amber-100">
                {overview.unknown_note ??
                  (lang === 'ar'
                    ? 'لا تستنتج توفرًا في بلد بعينه، أو شرط بطاقة/هاتف، أو خصمًا أو رسومًا محددة، أو استمرار عرض من معلومة غير مذكورة. تحقق من الشروط الحالية لدى الجهة الرسمية.'
                    : 'Do not infer availability in a particular country, card or phone requirements, a discount or specific fee, or that an offer is ongoing from unstated information. Check current terms with the official provider.')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 ltr:left-3.5 rtl:right-3.5" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                lang === 'ar'
                  ? 'ابحث بالاسم أو الوصف (يدعم الهمزات والتشكيل)...'
                  : 'Search by name or description...'
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-900/80 py-3 pe-10 ps-11 text-sm text-slate-100 placeholder-slate-500 outline-none transition-colors focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20"
              aria-label={lang === 'ar' ? 'بحث في العروض' : 'Search deals'}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-500 transition-colors hover:text-slate-300 ltr:right-3 rtl:left-3"
                aria-label={lang === 'ar' ? 'مسح البحث' : 'Clear search'}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
              hasActiveFilters
                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                : 'border-slate-700 bg-slate-900/80 text-slate-300 hover:border-slate-600'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {lang === 'ar' ? 'تصفية' : 'Filters'}
          </button>
        </div>

        {showFilters && (
          <div className="animate-fade-up mt-3 flex flex-wrap items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {lang === 'ar' ? 'نوع المستفيد' : 'Applicant type'}
              </p>
              <div className="flex gap-1.5">
                {(
                  [
                    ['all', lang === 'ar' ? 'الكل' : 'All'],
                    ['student', lang === 'ar' ? 'الطلاب' : 'Students'],
                    ['any', lang === 'ar' ? 'مفتوحة للجميع' : 'Open to all'],
                  ] as [ApplicantFilter, string][]
                ).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setApplicant(value)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      applicant === value
                        ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {lang === 'ar' ? 'بطاقة ائتمان' : 'Credit card'}
              </p>
              <div className="flex gap-1.5">
                {(
                  [
                    ['all', lang === 'ar' ? 'الكل' : 'All'],
                    ['not_required', lang === 'ar' ? 'بدون بطاقة' : 'No card needed'],
                  ] as [CardFilter, string][]
                ).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setCardFilter(value)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      cardFilter === value
                        ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setApplicant('all');
                  setCardFilter('all');
                  setQuery('');
                }}
                className="ms-auto text-xs font-medium text-slate-400 underline-offset-4 transition-colors hover:text-white hover:underline"
              >
                {lang === 'ar' ? 'مسح الكل' : 'Clear all'}
              </button>
            )}
          </div>
        )}
      </section>

      <section className="mt-6">
        <p className="text-sm text-slate-500">
          {lang === 'ar'
            ? `${filtered.length.toLocaleString('ar-EG')} عرض من أصل ${deals.length.toLocaleString('ar-EG')}`
            : `${filtered.length} of ${deals.length} offers`}
        </p>

        {filtered.length === 0 ? (
          <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 py-16 text-center">
            <Inbox className="h-10 w-10 text-slate-600" />
            <p className="text-slate-400">
              {lang === 'ar'
                ? 'لا توجد عروض مطابقة. جرّب تعديل البحث أو التصفية.'
                : 'No matching offers. Try adjusting your search or filters.'}
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((deal, i) => (
              <DealCard key={deal.id} deal={deal} onOpen={onOpenDeal} index={i} />
            ))}
          </div>
        )}
      </section>

      {config && overview.distinction_title && (
        <section className="mt-14 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8">
          <h2 className="font-heading text-xl font-bold text-white">
            {pick({
              ar: overview.distinction_title ?? '',
              en: config.overview.en.distinction_title ?? '',
            })}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300">
            {overview.distinction ?? ''}
          </p>
          <div className="mt-4 grid gap-3 text-xs text-slate-500 sm:grid-cols-2">
            <p>
              {lang === 'ar' ? 'موعد التسجيل' : 'Registration deadline'}:{' '}
              <span className="text-slate-300">
                {overview.last_reviewed_label ?? ''}
              </span>{' '}
              <bdi>{config.last_reviewed}</bdi>
            </p>
            <p>
              {lang === 'ar' ? 'التصنيفات' : 'Labels'}:{' '}
              <span className="text-slate-300">
                {tristateLabel('unknown', lang)} = {lang === 'ar' ? 'غير مثبت بالأدلة' : 'not established by evidence'}
              </span>
            </p>
          </div>
        </section>
      )}
    </main>
  );
}

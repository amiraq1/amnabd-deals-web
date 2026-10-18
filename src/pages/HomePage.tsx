import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, SlidersHorizontal, Inbox, ShieldAlert, Share2, Check } from 'lucide-react';
import type { Deal, FilterState, SiteConfig, SortOption } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { buildDealCorpus, categoryOptions, matchesCategory, matchesCorpus } from '@/lib/discovery';
import { matchesEligibility, type ApplicantFilter, type CardFilter } from '@/lib/eligibility';
import { compileQuery } from '@/lib/normalize';
import { reviewDateLabel } from '@/lib/format';
import { tristateLabel } from '@/lib/tristate';
import { sortDeals } from '@/lib/dealSort';
import { copyLink } from '@/lib/share';
import { DEFAULT_FILTER_STATE } from '@/lib/filterState';
import DealCard from '@/components/DealCard';
import InfoBanner from '@/components/InfoBanner';

interface HomePageProps {
  deals: Deal[];
  config: SiteConfig | null;
  loading: boolean;
  error: string | null;
  onOpenDeal: (slug: string) => void;
  filterState?: FilterState;
  getSearchLink?: () => string;
  onFilterChange?: (update: Partial<FilterState>, method?: 'push' | 'replace') => void;
  onResetFilters?: () => void;
}

export default function HomePage({
  deals,
  config,
  loading,
  error,
  onOpenDeal,
  filterState = DEFAULT_FILTER_STATE,
  getSearchLink = () => window.location.href,
  onFilterChange = () => undefined,
  onResetFilters = () => undefined,
}: HomePageProps) {
  const { lang, pick } = useLanguage();
  const [showFilters, setShowFilters] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copying' | 'success' | 'manual'>('idle');
  const [manualLink, setManualLink] = useState('');
  const generation = useRef(0);
  const busy = useRef(false);
  useEffect(() => {
    generation.current += 1;
    busy.current = false;
    setCopyStatus('idle');
    setManualLink('');
    return () => {
      generation.current += 1;
    };
  }, [
    filterState.q,
    filterState.category,
    filterState.uncategorized,
    filterState.applicant,
    filterState.card,
    filterState.sort,
  ]);
  useEffect(() => {
    if (copyStatus !== 'success') return;
    const timeout = window.setTimeout(() => setCopyStatus('idle'), 4000);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);
  const queryGroups = useMemo(() => compileQuery(filterState.q), [filterState.q]);
  const categories = useMemo(() => categoryOptions(deals, lang), [deals, lang]);

  // Precompute searchable corpora once per deals load
  const corpora = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of deals) {
      map.set(d.id, buildDealCorpus(d));
    }
    return map;
  }, [deals]);

  const overview = config?.overview?.[lang] ?? {};

  const filtered = useMemo(() => {
    return deals.filter((deal) => {
      if (filterState.categoryValidation === 'pending') return false;
      if (filterState.uncategorized && !matchesCategory(deal.category.value, '')) return false;
      if (
        filterState.category !== null &&
        !matchesCategory(deal.category?.value, filterState.category)
      ) {
        return false;
      }
      if (!matchesEligibility(deal.eligibility, filterState.applicant, filterState.card)) {
        return false;
      }
      if (filterState.q.trim()) {
        const corpus = corpora.get(deal.id) ?? '';
        if (!matchesCorpus(corpus, queryGroups)) {
          return false;
        }
      }
      return true;
    });
  }, [deals, corpora, filterState, queryGroups]);

  const sorted = useMemo(() => {
    return sortDeals(filtered, filterState.sort, new Date());
  }, [filtered, filterState.sort]);

  const hasActiveFilters =
    filterState.applicant !== 'all' ||
    filterState.card !== 'all' ||
    filterState.category !== null ||
    filterState.uncategorized ||
    Boolean(filterState.filterError) ||
    filterState.sort !== 'default' ||
    filterState.q.trim() !== '';

  async function handleCopySearchLink() {
    if (busy.current) return;
    const url = getSearchLink();
    const version = generation.current;
    busy.current = true;
    setManualLink(url);
    setCopyStatus('copying');
    let ok = false;
    try {
      const clipboard = navigator.clipboard;
      ok = await copyLink(url, clipboard?.writeText?.bind(clipboard));
    } catch {
      /* Clipboard getter may be denied. */
    }
    if (generation.current === version) {
      busy.current = false;
      setCopyStatus(ok ? 'success' : 'manual');
    }
  }

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
              {overview.title ??
                (lang === 'ar'
                  ? 'دليل التسجيل وفهم قيود العروض'
                  : 'Offer registration and limitations guide')}
            </h1>
            <p className="mt-3 text-base leading-relaxed text-slate-300">
              {overview.description ??
                (lang === 'ar'
                  ? 'دليل عربي لمراجعة الأهلية والتسجيل والقيود والرسوم وما يحدث عند انتهاء المنفعة، وفق الأدلة المتاحة والمصادر الرسمية.'
                  : 'A bilingual guide to eligibility, registration, limits and fees, and what is known after a benefit ends.')}
            </p>
            <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-gold/30 bg-gold/5 p-4">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
              <p className="text-sm leading-relaxed text-amber-100">
                {overview.unknown_note ??
                  (lang === 'ar'
                    ? 'لا تستنتج توفرًا في بلد بعينه، أو شرط بطاقة/هاتف، أو خصمًا أو رسومًا محددة، أو استمرار عرض من معلومة غير مذكورة. تحقق من الشروط الحالية لدى الجهة الرسمية.'
                    : 'Do not infer availability in a particular country, card or phone requirements, a discount or specific fee, or that an offer is ongoing from unstated information. Check current terms with the official provider.')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {filterState.categoryValidation === 'invalid' && (
        <section
          role="alert"
          className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200"
        >
          <p>
            {filterState.filterError !== 'category'
              ? lang === 'ar'
                ? 'معاملات الفئة غير صالحة أو متعارضة ولم تُطبّق.'
                : 'Category parameters are invalid or conflicting and were not applied.'
              : lang === 'ar'
                ? `الفئة «${filterState.invalidCategory}» غير معتمدة ولم يتم تطبيقها.`
                : `Category "${filterState.invalidCategory}" is unrecognized and was not applied.`}
          </p>
          <button
            type="button"
            onClick={onResetFilters}
            className="rounded-lg border border-amber-400/50 bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-100 hover:bg-amber-500/30"
          >
            {lang === 'ar' ? 'مسح الفئة' : 'Clear category'}
          </button>
        </section>
      )}

      <section className="mt-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 ltr:left-3.5 rtl:right-3.5" />
            <input
              type="search"
              value={filterState.q}
              onChange={(e) => onFilterChange({ q: e.target.value }, 'replace')}
              maxLength={120}
              placeholder={
                lang === 'ar'
                  ? 'ابحث بالاسم، الوصف، المنافع أو الفئات...'
                  : 'Search by name, description, benefits or categories...'
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-900/80 py-3 pe-10 ps-11 text-sm text-slate-100 placeholder-slate-500 outline-none transition-colors focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20"
              aria-label={lang === 'ar' ? 'بحث في العروض' : 'Search deals'}
            />
            {filterState.q && (
              <button
                type="button"
                onClick={() => {
                  onFilterChange({ q: '' }, 'replace');
                }}
                className="absolute top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-500 transition-colors hover:text-slate-300 ltr:right-3 rtl:left-3"
                aria-label={lang === 'ar' ? 'مسح البحث' : 'Clear search'}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopySearchLink}
              disabled={copyStatus === 'copying'}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm font-medium text-slate-300 transition-colors hover:border-emerald-500/50 hover:text-emerald-300"
              title={lang === 'ar' ? 'نسخ رابط البحث المفلتر' : 'Copy filtered search link'}
            >
              {copyStatus === 'success' ? (
                <Check className="h-4 w-4 text-emerald-400" />
              ) : (
                <Share2 className="h-4 w-4" />
              )}
              {copyStatus === 'success'
                ? lang === 'ar'
                  ? 'تم النسخ!'
                  : 'Copied!'
                : lang === 'ar'
                  ? 'مشاركة البحث'
                  : 'Share search'}
            </button>

            <button
              type="button"
              onClick={() => setShowFilters((s) => !s)}
              aria-expanded={showFilters}
              aria-controls="home-filter-panel"
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
        </div>

        <p role="status" aria-live="polite" className="mt-2 text-sm text-emerald-300">
          {copyStatus === 'success'
            ? lang === 'ar'
              ? 'تم نسخ رابط البحث.'
              : 'Search link copied.'
            : copyStatus === 'manual'
              ? lang === 'ar'
                ? 'تعذر النسخ التلقائي؛ استخدم الحقل التالي.'
                : 'Automatic copying unavailable; use the field below.'
              : ''}
        </p>
        {copyStatus === 'manual' && (
          <div className="mt-3 rounded-xl border border-slate-700 bg-slate-900/90 p-3">
            <label className="block text-xs font-medium text-slate-300">
              {lang === 'ar'
                ? 'انسخ رابط البحث المفلتر من الحقل أدناه:'
                : 'Copy the filtered search link from the field below:'}
              <input
                type="text"
                readOnly
                value={manualLink}
                dir="ltr"
                onFocus={(e) => e.currentTarget.select()}
                className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </label>
          </div>
        )}

        <div
          role="group"
          aria-label={lang === 'ar' ? 'فئات العروض' : 'Deal categories'}
          className="mt-4 flex flex-wrap items-center gap-2"
        >
          <button
            type="button"
            onClick={() => onFilterChange({ category: null, uncategorized: false }, 'push')}
            aria-pressed={filterState.category === null && !filterState.uncategorized}
            className={`min-h-11 max-w-full break-words rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              filterState.category === null && !filterState.uncategorized
                ? 'bg-emerald-500 text-slate-950 font-semibold'
                : 'border border-slate-800 bg-slate-900/70 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            {lang === 'ar' ? 'كل الفئات' : 'All categories'}{' '}
            <span className="text-[11px] opacity-75">
              ({deals.length.toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')})
            </span>
          </button>
          {categories.map((opt) => (
            <button
              key={`category:${opt.key}`}
              type="button"
              onClick={() =>
                onFilterChange({ category: opt.key || null, uncategorized: opt.key === '' }, 'push')
              }
              aria-pressed={
                opt.key === '' ? filterState.uncategorized : filterState.category === opt.key
              }
              className={`min-h-11 max-w-full break-words rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                (opt.key === '' ? filterState.uncategorized : filterState.category === opt.key)
                  ? 'bg-emerald-500 text-slate-950 font-semibold'
                  : 'border border-slate-800 bg-slate-900/70 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {opt.label}{' '}
              <span className="text-[11px] opacity-75">
                ({opt.count.toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')})
              </span>
            </button>
          ))}
        </div>

        {showFilters && (
          <div
            id="home-filter-panel"
            className="animate-fade-up mt-3 flex flex-wrap items-center gap-5 rounded-xl border border-slate-800 bg-slate-900/60 p-4"
          >
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {lang === 'ar' ? 'نوع المستفيد' : 'Applicant type'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    ['all', lang === 'ar' ? 'الكل' : 'All'],
                    ['student', lang === 'ar' ? 'الطلاب' : 'Students'],
                    ['any', lang === 'ar' ? 'مفتوحة للجميع' : 'Open to all'],
                  ] as [ApplicantFilter, string][]
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onFilterChange({ applicant: value }, 'push')}
                    aria-pressed={filterState.applicant === value}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      filterState.applicant === value
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
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    ['all', lang === 'ar' ? 'الكل' : 'All'],
                    ['not_required', lang === 'ar' ? 'بدون بطاقة' : 'No card needed'],
                  ] as [CardFilter, string][]
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onFilterChange({ card: value }, 'push')}
                    aria-pressed={filterState.card === value}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      filterState.card === value
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
              <label
                htmlFor="sort-select"
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                {lang === 'ar' ? 'الترتيب' : 'Sort by'}
              </label>
              <select
                id="sort-select"
                value={filterState.sort}
                onChange={(e) => onFilterChange({ sort: e.target.value as SortOption }, 'push')}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 outline-none transition-colors focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30"
              >
                <option value="default">{lang === 'ar' ? 'الافتراضي' : 'Default'}</option>
                <option value="reviewed">
                  {lang === 'ar' ? 'تاريخ المراجعة (الأحدث)' : 'Review date (newest)'}
                </option>
                <option value="deadline">
                  {lang === 'ar' ? 'موعد التسجيل' : 'Registration deadline'}
                </option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="ms-auto text-xs font-medium text-slate-400 underline-offset-4 transition-colors hover:text-white hover:underline"
              >
                {lang === 'ar' ? 'مسح الكل' : 'Clear all'}
              </button>
            )}
          </div>
        )}
      </section>

      {filterState.applicant === 'any' && (
        <p className="mt-3 text-xs text-slate-400">
          {lang === 'ar'
            ? 'تظهر هنا فقط الأهلية العامة المثبتة صراحةً؛ غياب شرط الطالب لا يكفي، والمجهول لا يُعد متاحًا للجميع.'
            : 'Only explicitly established general eligibility is included; no student requirement alone is insufficient, and unknown is not open to all.'}
        </p>
      )}

      <section className="mt-6">
        <p className="text-sm text-slate-500" role="status" aria-live="polite">
          {lang === 'ar'
            ? `${sorted.length.toLocaleString('ar-EG')} عرض من أصل ${deals.length.toLocaleString('ar-EG')}`
            : `${sorted.length} of ${deals.length} offers`}
        </p>

        {sorted.length === 0 ? (
          <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 py-16 text-center">
            <Inbox className="h-10 w-10 text-slate-600" />
            <p className="text-slate-400">
              {lang === 'ar'
                ? 'لا توجد عروض مطابقة. جرّب تعديل البحث أو التصفية.'
                : 'No matching offers. Try adjusting your search or filters.'}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="mt-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-medium text-emerald-300 transition-colors hover:bg-emerald-500/20"
              >
                {lang === 'ar' ? 'مسح الفلاتر والبحث' : 'Clear filters and search'}
              </button>
            )}
          </div>
        ) : (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((deal, i) => (
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
              {lang === 'ar' ? 'آخر مراجعة للمصادر' : 'Last reviewed'}:{' '}
              <bdi>{reviewDateLabel(config.last_reviewed, lang)}</bdi>
            </p>
            <p>
              {lang === 'ar' ? 'التصنيفات' : 'Labels'}:{' '}
              <span className="text-slate-300">
                {tristateLabel('unknown', lang)} ={' '}
                {lang === 'ar' ? 'غير مثبت بالأدلة' : 'not established by evidence'}
              </span>
            </p>
          </div>
        </section>
      )}
    </main>
  );
}

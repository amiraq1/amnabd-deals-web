import { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import {
  SMS_SUPPLIERS,
  type SmsSupplier,
  type SmsSupplierPrivacy,
  type SmsSupplierServiceType,
  type SmsSupplierSourceClassification,
} from '@/content/smsSuppliersDirectory';
import {
  buildSmsDirectorySummary,
  filterSuppliers,
  getListedSourceUrl,
  hasActiveSmsFilters,
  isListedAsOfficial,
  LINK_REASON_MESSAGES,
  paginateSuppliers,
  parseSmsDirectoryUrlParams,
  serializeSmsDirectoryUrlParams,
  SMS_PAGE_SIZE,
} from '@/lib/smsSuppliers';

const SERVICE_TYPES: readonly SmsSupplierServiceType[] = [
  'activation', 'rental', 'public', 'app', 'messaging', 'bot', 'unknown',
];
const PRIVACY_TYPES: readonly SmsSupplierPrivacy[] = ['private', 'mixed', 'public', 'unknown'];
const STATUS_TYPES: readonly SmsSupplierSourceClassification[] = ['official', 'needsReview'];

const serviceLabels: Record<SmsSupplierServiceType, { ar: string; en: string }> = {
  activation: { ar: 'تفعيل لمرة واحدة', en: 'One-time activation' },
  rental: { ar: 'استئجار رقم', en: 'Number rental' },
  public: { ar: 'صندوق وارد عام', en: 'Public inbox' },
  app: { ar: 'تطبيق أو رقم ثانٍ', en: 'App or second number' },
  messaging: { ar: 'خدمة رسائل SMS', en: 'SMS messaging' },
  bot: { ar: 'بوت', en: 'Bot' },
  unknown: { ar: 'نوع الخدمة غير محدد', en: 'Service type not specified' },
};

const privacyLabels: Record<SmsSupplierPrivacy, { ar: string; en: string }> = {
  private: { ar: 'خاص — حسب الملف', en: 'Private — per supplied file' },
  mixed: { ar: 'مختلط — حسب الملف', en: 'Mixed — per supplied file' },
  public: { ar: 'عام — حسب الملف', en: 'Public — per supplied file' },
  unknown: { ar: 'الخصوصية غير معلومة', en: 'Privacy not stated' },
};

function SupplierCard({ supplier, lang }: { supplier: SmsSupplier; lang: 'ar' | 'en' }) {
  const isOfficial = isListedAsOfficial(supplier);
  const statusText = isOfficial
    ? lang === 'ar' ? 'المصدر مصنّف رسميًا في الملف' : 'Source marked official in supplied file'
    : lang === 'ar' ? 'بحاجة إلى مراجعة' : 'Needs review';
  const sourceResult = getListedSourceUrl(supplier);

  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words font-heading text-lg font-bold text-white">{supplier.name}</h3>
          <p className="mt-1 break-all text-sm text-slate-400"><bdi dir="ltr">{supplier.domain}</bdi></p>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
          isOfficial
            ? 'border-slate-700 bg-slate-800 text-slate-200'
            : 'border-amber-500/30 bg-amber-500/10 text-amber-200'
        }`}>
          {statusText}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" aria-label={lang === 'ar' ? 'تصنيف الخدمة' : 'Service categories'}>
        {supplier.serviceTypes.map((type) => (
          <span key={type} className="rounded-full border border-slate-700/80 px-2.5 py-1 text-xs text-slate-300">
            {serviceLabels[type][lang]}
          </span>
        ))}
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-semibold text-slate-400">{lang === 'ar' ? 'الخصوصية كما وردت' : 'Privacy as supplied'}</dt>
          <dd className="mt-1 text-slate-200">{privacyLabels[supplier.privacy][lang]}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-400">{lang === 'ar' ? 'دعم API كما ورد' : 'API support as supplied'}</dt>
          <dd className="mt-1 text-slate-200">
            {supplier.apiSupport === 'yes'
              ? lang === 'ar' ? 'مذكور في الملف' : 'Listed in the file'
              : lang === 'ar' ? 'غير معلوم في الملف' : 'Not stated in the file'}
          </dd>
        </div>
      </dl>

      {sourceResult.ok ? (
        <a
          href={sourceResult.url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 text-sm font-semibold text-emerald-200 underline-offset-4 hover:border-emerald-400/50 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
        >
          {lang === 'ar' ? 'فتح الرابط المدرج' : 'Open listed link'}
          <span className="sr-only"> — {supplier.name}</span>
        </a>
      ) : (
        <p className="mt-4 text-xs leading-relaxed text-slate-500">
          {LINK_REASON_MESSAGES[sourceResult.reason][lang]}
        </p>
      )}
    </article>
  );
}

export default function SmsSuppliersDirectoryPage() {
  const { lang } = useLanguage();
  const initialParams = useMemo(() => {
    return parseSmsDirectoryUrlParams(typeof window !== 'undefined' ? window.location.search : '');
  }, []);

  const [query, setQuery] = useState(initialParams.query);
  const [serviceType, setServiceType] = useState<'all' | SmsSupplierServiceType>(initialParams.serviceType);
  const [privacy, setPrivacy] = useState<'all' | SmsSupplierPrivacy>(initialParams.privacy);
  const [status, setStatus] = useState<'all' | SmsSupplierSourceClassification>(initialParams.status);
  const [page, setPage] = useState(initialParams.page);
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const ar = lang === 'ar';
  const summary = useMemo(() => buildSmsDirectorySummary(SMS_SUPPLIERS), []);
  const copy = ar
    ? {
        title: summary.title.ar,
        intro: summary.intro.ar,
        caution: 'تنبيه خصوصية: لا تستخدم صناديق الوارد العامة لاستقبال رموز دخول أو رسائل شخصية حساسة؛ قد تكون الرسائل مرئية للآخرين. قد ترفض الخدمات الخارجية الأرقام الافتراضية أو تشترط رقمًا تملكه. راجع شروط كل خدمة قبل الاستخدام.',
        total: 'إجمالي السجلات', markedOfficial: 'مصنّف رسميًا في الملف', needsReview: 'بحاجة إلى مراجعة',
        search: 'ابحث بالاسم أو النطاق', searchPlaceholder: 'مثال: SMSPool أو example.com',
        type: 'نوع الخدمة', privacy: 'مؤشر الخصوصية', status: 'حالة السجل', all: 'الكل',
        allTypes: 'كل أنواع الخدمات', allPrivacy: 'كل حالات الخصوصية', allStatus: 'كل الحالات',
        resultCount: 'نتيجة', page: 'صفحة', previous: 'السابق', next: 'التالي',
        empty: 'لا توجد سجلات تطابق هذه الفلاتر.', reset: 'مسح البحث والفلاتر',
        dataNote: 'التصنيفات ومؤشرات الخصوصية ودعم API وحالة المصدر منقولة من البيانات المرفقة، وليست ضمانًا للتوفر أو تدقيقًا مستقلًا. لم تُدرج الأسعار أو شروط القبول لأنها غير متوفرة بصورة موثوقة هنا.',
      }
    : {
        title: summary.title.en,
        intro: summary.intro.en,
        caution: 'Privacy note: do not use public inboxes for login codes or sensitive personal messages; messages may be visible to others. Third-party services may reject virtual numbers or require a number you control. Check each service’s terms before use.',
        total: 'Total entries', markedOfficial: 'Marked official in file', needsReview: 'Need review',
        search: 'Search by name or domain', searchPlaceholder: 'e.g. SMSPool or example.com',
        type: 'Service type', privacy: 'Privacy indicator', status: 'Record status', all: 'All',
        allTypes: 'All service types', allPrivacy: 'All privacy states', allStatus: 'All statuses',
        resultCount: 'results', page: 'Page', previous: 'Previous', next: 'Next',
        empty: 'No entries match these filters.', reset: 'Clear search and filters',
        dataNote: 'Categories, privacy indicators, API support and source status are carried over from the supplied data; they are not a guarantee of availability or an independent audit. Prices and account-acceptance terms are omitted because they are not reliably established here.',
      };

  const filtered = useMemo(() => {
    return filterSuppliers(
      SMS_SUPPLIERS,
      { query, serviceType, privacy, status },
      ar ? 'ar' : 'en'
    );
  }, [ar, privacy, query, serviceType, status]);

  const { page: safePage, pageCount, pageRows } = paginateSuppliers(filtered, page, SMS_PAGE_SIZE);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const currentSearch = window.location.search;
    const newSearch = serializeSmsDirectoryUrlParams(
      { query, serviceType, privacy, status, page: safePage },
      currentSearch
    );
    const newUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}${window.location.hash}`;
    const currentUrl = `${window.location.pathname}${currentSearch}${window.location.hash}`;
    if (newUrl !== currentUrl) {
      try {
        window.history.replaceState(window.history.state, '', newUrl);
      } catch {
        // Ignored in environments where replaceState throws
      }
    }
  }, [privacy, query, safePage, serviceType, status]);

  useEffect(() => {
    const onPopState = () => {
      const updated = parseSmsDirectoryUrlParams(window.location.search);
      setQuery(updated.query);
      setServiceType(updated.serviceType);
      setPrivacy(updated.privacy);
      setStatus(updated.status);
      setPage(updated.page);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const hasActiveFilters = hasActiveSmsFilters({ query, serviceType, privacy, status });

  const resetFilters = () => {
    setQuery('');
    setServiceType('all');
    setPrivacy('all');
    setStatus('all');
    setPage(1);
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    if (resultsRef.current) {
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      resultsRef.current.focus({ preventScroll: true });
      resultsRef.current.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    }
  };

  return (
    <main dir={ar ? 'rtl' : 'ltr'} className="mx-auto w-full max-w-5xl px-4 pb-10 pt-8 sm:px-6 sm:pt-10">
      <header>
        <p className="text-sm font-semibold text-emerald-300">{summary.badge[lang]}</p>
        <h1 className="mt-2 font-heading text-3xl font-extrabold leading-tight text-white">{copy.title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300">{copy.intro}</p>
        <aside className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm leading-relaxed text-amber-100" aria-label={ar ? 'تنبيه الخصوصية' : 'Privacy notice'}>
          {copy.caution}
        </aside>
      </header>

      <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label={ar ? 'ملخص الدليل' : 'Directory summary'}>
        {[
          { label: copy.total, value: summary.totalCount },
          { label: copy.markedOfficial, value: summary.officialCount },
          { label: copy.needsReview, value: summary.reviewCount },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
            <p className="text-sm text-slate-400">{stat.label}</p>
            <p className="mt-1 font-heading text-2xl font-extrabold text-white" dir="ltr">{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5" aria-label={ar ? 'بحث وفلاتر الدليل' : 'Directory search and filters'}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="sms-supplier-search" className="mb-1.5 block text-sm font-semibold text-slate-200">{copy.search}</label>
            <input
              id="sms-supplier-search"
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder={copy.searchPlaceholder}
              autoComplete="off"
              className="min-h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
              dir="auto"
            />
          </div>
          <div>
            <label htmlFor="sms-supplier-type" className="mb-1.5 block text-sm font-semibold text-slate-200">{copy.type}</label>
            <select
              id="sms-supplier-type"
              value={serviceType}
              onChange={(event) => {
                setServiceType(event.target.value as 'all' | SmsSupplierServiceType);
                setPage(1);
              }}
              className="min-h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
            >
              <option value="all">{copy.allTypes}</option>
              {SERVICE_TYPES.map((type) => <option key={type} value={type}>{serviceLabels[type][lang]}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="sms-supplier-privacy" className="mb-1.5 block text-sm font-semibold text-slate-200">{copy.privacy}</label>
            <select
              id="sms-supplier-privacy"
              value={privacy}
              onChange={(event) => {
                setPrivacy(event.target.value as 'all' | SmsSupplierPrivacy);
                setPage(1);
              }}
              className="min-h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
            >
              <option value="all">{copy.allPrivacy}</option>
              {PRIVACY_TYPES.map((value) => <option key={value} value={value}>{privacyLabels[value][lang]}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="sms-supplier-status" className="mb-1.5 block text-sm font-semibold text-slate-200">{copy.status}</label>
            <select
              id="sms-supplier-status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as 'all' | SmsSupplierSourceClassification);
                setPage(1);
              }}
              className="min-h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
            >
              <option value="all">{copy.allStatus}</option>
              {STATUS_TYPES.map((value) => (
                <option key={value} value={value}>
                  {value === 'official' ? copy.markedOfficial : copy.needsReview}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2 pt-2">
            <p className="text-sm text-slate-300" aria-live="polite">
              <span dir="ltr">{filtered.length}</span> {copy.resultCount}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex min-h-9 items-center rounded-lg border border-slate-700 bg-slate-800/80 px-3 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
              >
                {copy.reset}
              </button>
            )}
          </div>
        </div>
      </section>

      <p className="mt-4 text-xs leading-relaxed text-slate-500">{copy.dataNote}</p>

      <div ref={resultsRef} tabIndex={-1} className="focus:outline-none">
        {pageRows.length ? (
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
            {pageRows.map((supplier) => <SupplierCard key={supplier.id} supplier={supplier} lang={lang} />)}
          </div>
        ) : (
          <section className="mt-6 rounded-xl border border-slate-800 bg-slate-900/50 p-6 text-center" aria-live="polite">
            <p className="text-slate-300">{copy.empty}</p>
            <button type="button" onClick={resetFilters} className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-emerald-500/40 px-4 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400">
              {copy.reset}
            </button>
          </section>
        )}
      </div>

      {filtered.length > 0 && (
        <nav className="mt-6 flex flex-wrap items-center justify-center gap-3" aria-label={ar ? 'صفحات النتائج' : 'Result pages'}>
          <button type="button" disabled={safePage <= 1} onClick={() => handlePageChange(Math.max(1, safePage - 1))} className="min-h-11 rounded-lg border border-slate-700 px-4 text-sm font-semibold text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400">
            {copy.previous}
          </button>
          <span className="text-sm text-slate-400" aria-live="polite">
            {copy.page} <bdi dir="ltr">{safePage} / {pageCount}</bdi>
          </span>
          <button type="button" disabled={safePage >= pageCount} onClick={() => handlePageChange(Math.min(pageCount, safePage + 1))} className="min-h-11 rounded-lg border border-slate-700 px-4 text-sm font-semibold text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400">
            {copy.next}
          </button>
        </nav>
      )}
    </main>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, SlidersHorizontal, Inbox, Share2, Check, Bookmark, Sparkles, Clock } from 'lucide-react';
import type { Deal, FilterState, SiteConfig, SortOption } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { buildDealCorpus, categoryOptions, matchesCategory, matchesCorpus } from '@/lib/discovery';
import { matchesEligibility } from '@/lib/eligibility';
import { compileQuery } from '@/lib/normalize';
import { reviewDateLabel } from '@/lib/format';
import { tristateLabel } from '@/lib/tristate';
import { classifyDeadline, deadlineTierLabel, sortDeals } from '@/lib/dealSort';
import { copyLink } from '@/lib/share';
import { DEFAULT_FILTER_STATE, cleanQuery } from '@/lib/filterState';
import DealCard from '@/components/DealCard';
import InfoBanner from '@/components/InfoBanner';
import ScrollToTop from '@/components/ScrollToTop';
import { useSavedDeals } from '@/hooks/useSavedDeals';
import { countValidSavedDeals, saveDeal } from '@/lib/savedDeals';
import { parseSharedListParam } from '@/lib/shareFavorites';

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

const USE_CASE_LABELS: Record<string, { ar: string; en: string }> = {
  'برمجة': { ar: 'برمجة وتطوير', en: 'Coding & Dev' },
  'بحث': { ar: 'محادثة وبحث', en: 'Search & Chat' },
  'وكلاء ذكاء اصطناعي': { ar: 'وكلاء ذكاء اصطناعي', en: 'AI Agents' },
  'استضافة': { ar: 'استضافة ونشر سحابي', en: 'Cloud & Hosting' },
  'صوت': { ar: 'صوتيات', en: 'Audio' },
  'فيديو وصور': { ar: 'تصميم وفيديو', en: 'Design & Video' },
  coding: { ar: 'برمجة وتطوير', en: 'Coding & Dev' },
  chat: { ar: 'محادثة وبحث', en: 'Search & Chat' },
  agents: { ar: 'وكلاء ذكاء اصطناعي', en: 'AI Agents' },
  deployment: { ar: 'استضافة ونشر سحابي', en: 'Cloud & Hosting' },
  design: { ar: 'تصميم وتوليد صور', en: 'Design & Images' },
  audio_video: { ar: 'صوتيات وفيديو', en: 'Audio & Video' },
  writing: { ar: 'كتابة وصياغة محتوى', en: 'Writing & Content' },
  learning: { ar: 'تعلّم وتدريب', en: 'Learning & Ed' },
  data: { ar: 'تحليل بيانات', en: 'Data Analytics' },
};

const SEARCH_DEBOUNCE_MS = 250;

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
  const { savedList, savedSet, toggle, degraded, atLimit } = useSavedDeals();
  const [savedOnly, setSavedOnly] = useState(false);
  const [endingSoon, setEndingSoon] = useState(false);
  const [selectedUseCases, setSelectedUseCases] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copying' | 'success' | 'manual'>('idle');
  const [manualLink, setManualLink] = useState('');
  const [sharedListDismissed, setSharedListDismissed] = useState(false);
  const [sharedSaveSuccess, setSharedSaveSuccess] = useState(false);
  const sharedListSlugs = useMemo(() => {
    if (typeof window === 'undefined') return [];
    return parseSharedListParam(window.location.search || window.location.hash);
  }, []);
  const generation = useRef(0);
  const busy = useRef(false);

  // نص البحث يُكتب في حالة محلية ويُدفع إلى الرابط بعد توقف الكتابة،
  // حتى لا يتغير الرابط ولا تُعاد الصفحة إلى أعلاها مع كل حرف.
  const [qDraft, setQDraft] = useState(filterState.q);
  // آخر قيمة (بعد التنظيف) أرسلناها إلى الرابط. cleanQuery يحذف المسافات الطرفية،
  // وبدون المقارنة بعد التنظيف تُحذف المسافة التي يكتبها المستخدم بين الكلمات.
  const lastSentQ = useRef(filterState.q);

  useEffect(() => {
    // تغيّر الرابط من الخارج (زر الرجوع، إعادة الضبط): نزامن الحقل معه.
    if (filterState.q !== lastSentQ.current) {
      lastSentQ.current = filterState.q;
      setQDraft(filterState.q);
    }
  }, [filterState.q]);

  useEffect(() => {
    if (cleanQuery(qDraft) === lastSentQ.current) return;
    const id = window.setTimeout(() => {
      lastSentQ.current = cleanQuery(qDraft);
      onFilterChange({ q: qDraft }, 'replace');
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [qDraft, onFilterChange]);

  useEffect(() => {
    const resetLocalFilter = () => {
      setSavedOnly(false);
      setEndingSoon(false);
      setSelectedUseCases([]);
    };
    window.addEventListener('popstate', resetLocalFilter);
    window.addEventListener('hashchange', resetLocalFilter);
    return () => {
      window.removeEventListener('popstate', resetLocalFilter);
      window.removeEventListener('hashchange', resetLocalFilter);
    };
  }, []);

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

  const [referenceNow, setReferenceNow] = useState(() => new Date());
  useEffect(() => {
    const refresh = () => setReferenceNow(new Date());
    const timer = window.setInterval(refresh, 60000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  const queryGroups = useMemo(() => compileQuery(filterState.q), [filterState.q]);
  const categories = useMemo(() => categoryOptions(deals, lang), [deals, lang]);

  const validSavedCount = useMemo(
    () =>
      countValidSavedDeals(
        savedList,
        deals.map((deal) => deal.slug)
      ),
    [savedList, deals]
  );

  // Precompute searchable corpora once per deals load
  const corpora = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of deals) {
      map.set(d.id, buildDealCorpus(d));
    }
    return map;
  }, [deals]);

  const overview = config?.overview?.[lang] ?? {};

  // Active deals (excluding expired) for counters and hero stats
  const activeDeals = useMemo(
    () => deals.filter((d) => d.status !== 'expired'),
    [deals]
  );

  // نصف بـ«موثّق» فقط ما حالته verified فعلًا، لا كل ما ليس منتهيًا.
  const verifiedActiveCount = useMemo(
    () => activeDeals.filter((d) => d.review?.verification_status === 'verified').length,
    [activeDeals]
  );
  const allActiveVerified = verifiedActiveCount === activeDeals.length;
  const activeCountLabel =
    lang === 'ar'
      ? allActiveVerified
        ? `${activeDeals.length} عرضًا نشطًا وموثّقًا`
        : `${activeDeals.length} عرضًا نشطًا، ${verifiedActiveCount} منها موثّق`
      : allActiveVerified
        ? `${activeDeals.length} active verified offers`
        : `${activeDeals.length} active offers, ${verifiedActiveCount} verified`;

  // Safe calculation of days since last review
  const daysSinceLastReview = useMemo(() => {
    const now = Date.now();
    const validDays = deals
      .map((d) => {
        if (!d.review?.reviewed_on) return null;
        const t = new Date(d.review.reviewed_on).getTime();
        if (Number.isNaN(t)) return null;
        return Math.max(0, Math.floor((now - t) / (1000 * 60 * 60 * 24)));
      })
      .filter((days): days is number => days !== null);

    return validDays.length > 0 ? Math.min(...validDays) : null;
  }, [deals]);

  // Available use-cases extracted from active deals
  const useCaseOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const deal of activeDeals) {
      for (const uc of deal.use_cases ?? []) {
        counts.set(uc, (counts.get(uc) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([value, count]) => {
        const localized = USE_CASE_LABELS[value];
        const label = localized ? (lang === 'ar' ? localized.ar : localized.en) : value;
        return { value, label, count };
      });
  }, [activeDeals, lang]);

  const toggleUseCase = (uc: string) => {
    setSelectedUseCases((prev) =>
      prev.includes(uc) ? prev.filter((item) => item !== uc) : [...prev, uc]
    );
  };

  // Unified matcher for filtering & smart empty state calculation
  const matchesAllCriteria = useCallback(
    (
      deal: Deal,
      overrides?: {
        q?: string;
        category?: string | null;
        uncategorized?: boolean;
        useCases?: string[];
        applicant?: 'all' | 'student' | 'any';
        card?: 'all' | 'not_required';
        endingSoon?: boolean;
        saved?: boolean;
      }
    ) => {
      const q = overrides?.q !== undefined ? overrides.q : filterState.q;
      const category = overrides?.category !== undefined ? overrides.category : filterState.category;
      const uncategorized =
        overrides?.uncategorized !== undefined ? overrides.uncategorized : filterState.uncategorized;
      const useCases = overrides?.useCases !== undefined ? overrides.useCases : selectedUseCases;
      const applicant = overrides?.applicant !== undefined ? overrides.applicant : filterState.applicant;
      const card = overrides?.card !== undefined ? overrides.card : filterState.card;
      const isEndingSoon = overrides?.endingSoon !== undefined ? overrides.endingSoon : endingSoon;
      const saved = overrides?.saved !== undefined ? overrides.saved : savedOnly;

      if (saved && !savedSet.has(deal.slug)) return false;
      if (uncategorized && !matchesCategory(deal.category.value, '')) return false;
      if (category !== null && !matchesCategory(deal.category?.value, category)) return false;
      if (!matchesEligibility(deal.eligibility, applicant, card)) return false;
      if (isEndingSoon && deal.status !== 'ending_soon') return false;

      // OR logic for multiple use_cases
      if (useCases.length > 0 && !useCases.some((uc) => deal.use_cases?.includes(uc))) {
        return false;
      }

      if (q.trim()) {
        const groups = overrides?.q !== undefined ? compileQuery(q) : queryGroups;
        const corpus = corpora.get(deal.id) ?? buildDealCorpus(deal);
        if (!matchesCorpus(corpus, groups)) return false;
      }

      return true;
    },
    [
      filterState.q,
      filterState.category,
      filterState.uncategorized,
      filterState.applicant,
      filterState.card,
      selectedUseCases,
      endingSoon,
      savedOnly,
      savedSet,
      queryGroups,
      corpora,
    ]
  );

  const filtered = useMemo(() => {
    if (filterState.categoryValidation === 'pending') return [];
    return deals.filter((deal) => matchesAllCriteria(deal));
  }, [deals, matchesAllCriteria, filterState.categoryValidation]);

  const sorted = useMemo(() => {
    return sortDeals(filtered, filterState.sort, referenceNow);
  }, [filtered, filterState.sort, referenceNow]);

  const hasAnyActiveFilter = Boolean(
    savedOnly ||
    filterState.applicant !== 'all' ||
    filterState.card !== 'all' ||
    filterState.category !== null ||
    filterState.uncategorized ||
    Boolean(filterState.filterError) ||
    filterState.sort !== 'default' ||
    filterState.q.trim() !== '' ||
    endingSoon ||
    selectedUseCases.length > 0
  );

  const handleResetAll = () => {
    setSavedOnly(false);
    setEndingSoon(false);
    setSelectedUseCases([]);
    onResetFilters();
  };

  // Quick filter options with accurate non-expired counts
  const quickFilterOptions = useMemo(
    () => [
      {
        key: 'student' as const,
        label: lang === 'ar' ? 'أنا طالب' : 'Students',
        count: activeDeals.filter((d) => d.eligibility?.student_status === 'required').length,
        isActive: filterState.applicant === 'student',
        onToggle: () =>
          onFilterChange(
            { applicant: filterState.applicant === 'student' ? 'all' : 'student' },
            'push'
          ),
      },
      {
        key: 'noCard' as const,
        label: lang === 'ar' ? 'بدون بطاقة' : 'No card required',
        count: activeDeals.filter((d) => d.eligibility?.card_required === 'not_required').length,
        isActive: filterState.card === 'not_required',
        onToggle: () =>
          onFilterChange(
            { card: filterState.card === 'not_required' ? 'all' : 'not_required' },
            'push'
          ),
      },
      {
        key: 'endingSoon' as const,
        label: lang === 'ar' ? 'ينتهي قريبًا' : 'Ending soon',
        count: activeDeals.filter((d) => d.status === 'ending_soon').length,
        isActive: endingSoon,
        onToggle: () => setEndingSoon((prev) => !prev),
      },
    ],
    [activeDeals, filterState.applicant, filterState.card, endingSoon, lang, onFilterChange]
  );

  // "Reviewed this week" section: strictly hidden when any filter/search is active
  const newThisWeek = useMemo(() => {
    if (hasAnyActiveFilter) return [];
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    return activeDeals
      .filter((d) => {
        if (!d.review?.reviewed_on) return false;
        const reviewed = new Date(d.review.reviewed_on).getTime();
        return !Number.isNaN(reviewed) && reviewed >= weekAgo && reviewed <= now;
      })
      .sort((a, b) => {
        const aRev = new Date(a.review.reviewed_on).getTime();
        const bRev = new Date(b.review.reviewed_on).getTime();
        return bRev - aRev;
      })
      .slice(0, 3);
  }, [activeDeals, hasAnyActiveFilter]);

  // عروض «هذا الأسبوع» تظهر في قسمها فقط ولا تتكرر في القائمة العامة تحتها.
  const newSlugs = useMemo(() => new Set(newThisWeek.map((d) => d.slug)), [newThisWeek]);
  const listed = useMemo(
    () => (newSlugs.size === 0 ? sorted : sorted.filter((d) => !newSlugs.has(d.slug))),
    [sorted, newSlugs]
  );

  // Smart suggestion for empty states: calculates which active filter frees the most deals
  const mostRestrictiveFilter = useMemo(() => {
    if (sorted.length > 0) return null;

    const candidates: { label: string; count: number; clear: () => void }[] = [];

    if (endingSoon) {
      const count = deals.filter((d) => matchesAllCriteria(d, { endingSoon: false })).length;
      if (count > 0) {
        candidates.push({
          label: lang === 'ar' ? 'ينتهي قريبًا' : 'Ending soon',
          count,
          clear: () => setEndingSoon(false),
        });
      }
    }

    if (filterState.applicant === 'student') {
      const count = deals.filter((d) => matchesAllCriteria(d, { applicant: 'all' })).length;
      if (count > 0) {
        candidates.push({
          label: lang === 'ar' ? 'أنا طالب' : 'Students only',
          count,
          clear: () => onFilterChange({ applicant: 'all' }, 'push'),
        });
      }
    }

    if (filterState.card === 'not_required') {
      const count = deals.filter((d) => matchesAllCriteria(d, { card: 'all' })).length;
      if (count > 0) {
        candidates.push({
          label: lang === 'ar' ? 'بدون بطاقة' : 'No credit card',
          count,
          clear: () => onFilterChange({ card: 'all' }, 'push'),
        });
      }
    }

    if (selectedUseCases.length > 0) {
      const count = deals.filter((d) => matchesAllCriteria(d, { useCases: [] })).length;
      if (count > 0) {
        candidates.push({
          label: lang === 'ar' ? 'حالات الاستخدام' : 'Use cases',
          count,
          clear: () => setSelectedUseCases([]),
        });
      }
    }

    if (filterState.category !== null) {
      const count = deals.filter((d) => matchesAllCriteria(d, { category: null })).length;
      if (count > 0) {
        candidates.push({
          label: lang === 'ar' ? 'الفئة المحددة' : 'Selected category',
          count,
          clear: () => onFilterChange({ category: null }, 'push'),
        });
      }
    }

    if (savedOnly) {
      const count = deals.filter((d) => matchesAllCriteria(d, { saved: false })).length;
      if (count > 0) {
        candidates.push({
          label: lang === 'ar' ? 'المحفوظة فقط' : 'Saved deals only',
          count,
          clear: () => setSavedOnly(false),
        });
      }
    }

    if (filterState.q.trim()) {
      const count = deals.filter((d) => matchesAllCriteria(d, { q: '' })).length;
      if (count > 0) {
        candidates.push({
          label: lang === 'ar' ? 'نص البحث' : 'Search query',
          count,
          clear: () => {
            lastSentQ.current = '';
            setQDraft('');
            onFilterChange({ q: '' }, 'replace');
          },
        });
      }
    }

    if (candidates.length === 0) return null;
    return candidates.sort((a, b) => b.count - a.count)[0];
  }, [
    sorted.length,
    deals,
    endingSoon,
    filterState.applicant,
    filterState.card,
    filterState.category,
    filterState.q,
    selectedUseCases,
    savedOnly,
    lang,
    matchesAllCriteria,
    onFilterChange,
  ]);

  const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: 'default', label: lang === 'ar' ? 'الافتراضي' : 'Default' },
    { value: 'reviewed', label: lang === 'ar' ? 'الأحدث مراجعة' : 'Recently reviewed' },
    { value: 'ending_soon', label: lang === 'ar' ? 'الأقرب انتهاءً' : 'Ending soon' },
    { value: 'highest_value', label: lang === 'ar' ? 'الأعلى قيمة' : 'Highest value' },
    { value: 'deadline', label: lang === 'ar' ? 'موعد التسجيل' : 'Registration deadline' },
  ];

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
      <main
        className="mx-auto max-w-6xl px-4 py-10 sm:px-6"
        aria-busy="true"
        aria-label={lang === 'ar' ? 'جارٍ تحميل العروض' : 'Loading deals'}
      >
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

  const categoryButtonBase =
    'min-h-11 shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors';
  const categoryIdle =
    'border border-slate-800 bg-slate-900/70 text-slate-400 hover:border-slate-700 hover:text-slate-200';
  const categoryActive = 'bg-emerald-500 text-slate-950 font-semibold';

  return (
    <main className="mx-auto max-w-6xl px-4 pb-8 pt-6 sm:px-6">
      {/* Shared List Banner */}
      {!sharedListDismissed && sharedListSlugs.length > 0 && (
        <section
          role="region"
          aria-label={lang === 'ar' ? 'قائمة عروض مشاركة' : 'Shared deals list'}
          className="mb-6 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-slate-900/40 p-4 shadow-lg sm:p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                <Share2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white sm:text-base">
                  {lang === 'ar'
                    ? `قائمة عروض مختارة تم مشاركتها معك (${sharedListSlugs.length} ${sharedListSlugs.length === 1
                      ? 'عرض'
                      : sharedListSlugs.length === 2
                        ? 'عرضان'
                        : 'عروض'
                    })`
                    : `Shared Deals Collection (${sharedListSlugs.length} ${sharedListSlugs.length === 1 ? 'deal' : 'deals'
                    })`}
                </h2>
                <p className="mt-0.5 text-xs text-slate-300">
                  {lang === 'ar'
                    ? 'يمكنك حفظ هذه العروض مباشرة في مفضلتك المحلية للرجوع إليها لاحقاً.'
                    : 'You can save these deals directly to your local favorites for future reference.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {sharedSaveSuccess ? (
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/20 px-4 py-2 text-xs font-semibold text-emerald-300">
                  <Check className="h-4 w-4" />
                  <span>{lang === 'ar' ? 'تم الحفظ في مفضلتك!' : 'Saved to favorites!'}</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    for (const s of sharedListSlugs) {
                      saveDeal(s);
                    }
                    setSharedSaveSuccess(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-600/20 px-4 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-600/30"
                >
                  <Bookmark className="h-3.5 w-3.5" />
                  <span>{lang === 'ar' ? 'حفظ الكل في مفضلتي' : 'Save all to favorites'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setSharedListDismissed(true)}
                className="rounded-xl border border-slate-700 bg-slate-800/60 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
                aria-label={lang === 'ar' ? 'إغلاق التنبيه' : 'Dismiss notice'}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 1. Hero Section with Interactive Prompts & Stats */}
      <section className="animate-fade-up">
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-8">
          <div
            className="pointer-events-none absolute -top-24 end-[-10%] h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-24 start-[-5%] h-56 w-56 rounded-full bg-gold/5 blur-3xl"
            aria-hidden
          />
          <div className="relative max-w-3xl">
            <h1 className="font-heading text-2xl font-extrabold leading-tight text-white sm:text-3xl">
              {pick({
                ar: overview.title ?? 'أرصدة وأدوات ذكاء اصطناعي مجانية، موثّقة من مصادرها الرسمية',
                en: config?.overview?.en?.title ?? 'Verified Free AI Tool Deals, Credits & Benefits',
              })}
            </h1>
            <p className="mt-2.5 text-sm leading-relaxed text-slate-300 sm:text-base">
              {pick({
                ar:
                  overview.subtitle ??
                  'دليل موثّق يربطك بالمصادر الرسمية لمنافع وحزم أدوات الذكاء الاصطناعي مع توثيق شروط الأهلية والأدلة.',
                en:
                  config?.overview?.en?.subtitle ??
                  'A documented directory linking you to official sources of AI benefits with verified eligibility and evidence.',
              })}
            </p>

            <div className="mt-3.5 flex flex-wrap items-center gap-3 text-xs text-slate-300">
              <span className="flex items-center gap-1.5 font-medium text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                {activeCountLabel}
              </span>
              {daysSinceLastReview !== null && (
                <span className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1 text-slate-400">
                  <Clock className="h-3 w-3 text-slate-400" />
                  {lang === 'ar'
                    ? daysSinceLastReview === 0
                      ? 'آخر تدقيق وتحديث اليوم'
                      : `آخر تدقيق قبل ${daysSinceLastReview} يومًا`
                    : daysSinceLastReview === 0
                      ? 'Last reviewed today'
                      : `Last reviewed ${daysSinceLastReview}d ago`}
                </span>
              )}
            </div>

            {/* Interactive "What do you want to build?" Use-Case Prompt */}
            {useCaseOptions.length > 0 && (
              <div className="mt-5 border-t border-slate-800/80 pt-4">
                <div className="mb-2.5 flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                    {lang === 'ar' ? 'ماذا تريد أن تبني؟' : 'What are you building?'}
                  </p>
                  {selectedUseCases.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedUseCases([])}
                      className="text-xs text-slate-400 transition hover:text-emerald-400"
                    >
                      {lang === 'ar'
                        ? `مسح الاختيار (${selectedUseCases.length})`
                        : `Clear (${selectedUseCases.length})`}
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {useCaseOptions.map((uc) => {
                    const isSelected = selectedUseCases.includes(uc.value);
                    return (
                      <button
                        key={uc.value}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => toggleUseCase(uc.value)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${isSelected
                            ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300 font-semibold shadow-sm shadow-emerald-950/40'
                            : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:text-white'
                          }`}
                      >
                        <span>{uc.label}</span>
                        <span className="ms-1.5 opacity-60">({uc.count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
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
            onClick={handleResetAll}
            className="rounded-lg border border-amber-400/50 bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-100 hover:bg-amber-500/30"
          >
            {lang === 'ar' ? 'مسح الفئة' : 'Clear category'}
          </button>
        </section>
      )}

      {/* 2. شريط لاصق بصف واحد: البحث والمشاركة والفلاتر */}
      <section className="sticky top-16 z-30 -mx-4 mt-6 border-b border-slate-800/80 bg-slate-950/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 ltr:left-3.5 rtl:right-3.5" />
            <input
              type="search"
              value={qDraft}
              onChange={(e) => setQDraft(e.target.value)}
              maxLength={120}
              placeholder={
                lang === 'ar'
                  ? 'ابحث بالاسم، الوصف، المنافع أو الفئات...'
                  : 'Search by name, description, benefits or categories...'
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-900/80 py-3 pe-10 ps-11 text-sm text-slate-100 placeholder-slate-500 outline-none transition-colors focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20"
              aria-label={lang === 'ar' ? 'بحث في العروض' : 'Search deals'}
            />
            {qDraft && (
              <button
                type="button"
                onClick={() => {
                  lastSentQ.current = '';
                  setQDraft('');
                  onFilterChange({ q: '' }, 'replace');
                }}
                className="absolute top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-500 transition-colors hover:text-slate-300 ltr:right-3 rtl:left-3"
                aria-label={lang === 'ar' ? 'مسح البحث' : 'Clear search'}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleCopySearchLink}
            disabled={copyStatus === 'copying'}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-3 text-sm font-medium text-slate-300 transition-colors hover:border-emerald-500/50 hover:text-emerald-300 sm:px-4"
            title={lang === 'ar' ? 'نسخ رابط البحث المفلتر' : 'Copy filtered search link'}
            aria-label={lang === 'ar' ? 'مشاركة البحث' : 'Share search'}
          >
            {copyStatus === 'success' ? (
              <Check className="h-4 w-4 text-emerald-400" />
            ) : (
              <Share2 className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
              {copyStatus === 'success'
                ? lang === 'ar'
                  ? 'تم النسخ!'
                  : 'Copied!'
                : lang === 'ar'
                  ? 'مشاركة البحث'
                  : 'Share search'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowFilters((s) => !s)}
            aria-expanded={showFilters}
            aria-controls="home-filter-panel"
            aria-label={lang === 'ar' ? 'تصفية وترتيب' : 'Filters & Sort'}
            className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition-colors sm:px-4 ${hasAnyActiveFilter
                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                : 'border-slate-700 bg-slate-900/80 text-slate-300 hover:border-slate-600'
              }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">
              {lang === 'ar' ? 'تصفية وترتيب' : 'Filters & Sort'}
            </span>
          </button>
        </div>

        {showFilters && (
          <div
            id="home-filter-panel"
            className="animate-fade-up mt-3 flex flex-wrap items-center gap-5 rounded-xl border border-slate-800 bg-slate-900/60 p-4"
          >
            <div className="flex items-center gap-2">
              <label htmlFor="applicant-select" className="text-xs text-slate-400">
                {lang === 'ar' ? 'فئة المتقدم:' : 'Applicant:'}
              </label>
              <select
                id="applicant-select"
                value={filterState.applicant}
                onChange={(e) =>
                  onFilterChange(
                    {
                      applicant: e.target.value as 'all' | 'student' | 'any',
                    },
                    'push'
                  )
                }
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 outline-none transition-colors focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30"
              >
                <option value="all">{lang === 'ar' ? 'الكل' : 'All'}</option>
                <option value="student">{lang === 'ar' ? 'للطلاب' : 'Students'}</option>
                <option value="any">
                  {lang === 'ar' ? 'متاح للجميع (مثبت)' : 'Open to all (verified)'}
                </option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="card-select" className="text-xs text-slate-400">
                {lang === 'ar' ? 'البطاقة:' : 'Card:'}
              </label>
              <select
                id="card-select"
                value={filterState.card}
                onChange={(e) =>
                  onFilterChange(
                    {
                      card: e.target.value as 'all' | 'not_required',
                    },
                    'push'
                  )
                }
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 outline-none transition-colors focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30"
              >
                <option value="all">{lang === 'ar' ? 'الكل' : 'All'}</option>
                <option value="not_required">
                  {lang === 'ar' ? 'بدون بطاقة ائتمان' : 'No credit card'}
                </option>
              </select>
            </div>

            {hasAnyActiveFilter && (
              <button
                type="button"
                onClick={handleResetAll}
                className="ms-auto text-xs font-medium text-slate-400 underline-offset-4 transition-colors hover:text-white hover:underline"
              >
                {lang === 'ar' ? 'مسح كل الفلاتر' : 'Clear all filters'}
              </button>
            )}
          </div>
        )}
      </section>

      {/* الفئات والشرائح والترتيب: خارج الشريط اللاصق حتى لا تغطي النتائج على الجوال */}
      <div className="mt-4">
        <p role="status" aria-live="polite" className="mb-3 text-sm text-emerald-300 empty:mb-0">
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
          <div className="mb-3 rounded-xl border border-slate-700 bg-slate-900/90 p-3">
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

        {/* Categories Bar: صف أفقي قابل للتمرير على الجوال، ويلتف على الشاشات الأكبر */}
        <div
          role="group"
          aria-label={lang === 'ar' ? 'فئات العروض' : 'Deal categories'}
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
        >
          <button
            type="button"
            onClick={() => onFilterChange({ category: null, uncategorized: false }, 'push')}
            aria-pressed={filterState.category === null && !filterState.uncategorized}
            className={`${categoryButtonBase} ${filterState.category === null && !filterState.uncategorized
                ? categoryActive
                : categoryIdle
              }`}
          >
            {lang === 'ar' ? 'كل الفئات' : 'All categories'}{' '}
            <span className="text-[11px] opacity-75">
              ({deals.length.toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSavedOnly((s) => !s)}
            aria-describedby="saved-deals-scope"
            aria-pressed={savedOnly}
            className={`${categoryButtonBase} inline-flex items-center gap-1.5 ${savedOnly
                ? `${categoryActive} shadow-md shadow-emerald-950/30`
                : categoryIdle
              }`}
          >
            <Bookmark
              className={`h-3.5 w-3.5 ${savedOnly ? 'fill-slate-950 text-slate-950' : 'text-slate-400'
                }`}
            />
            <span>{lang === 'ar' ? 'المحفوظة' : 'Saved'}</span>
            <span className="text-[11px] opacity-75">
              ({validSavedCount.toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')})
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
              className={`${categoryButtonBase} ${(opt.key === '' ? filterState.uncategorized : filterState.category === opt.key)
                  ? categoryActive
                  : categoryIdle
                }`}
            >
              {opt.label}{' '}
              <span className="text-[11px] opacity-75">
                ({opt.count.toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')})
              </span>
            </button>
          ))}
        </div>

        {/* Quick Filter Chips & Sort Controls */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/60 pt-3">
          <div className="flex flex-wrap items-center gap-2">
            {quickFilterOptions.map((qf) => (
              <button
                key={qf.key}
                type="button"
                aria-pressed={qf.isActive}
                disabled={qf.count === 0 && !qf.isActive}
                onClick={qf.onToggle}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${qf.isActive
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300 font-semibold'
                    : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 disabled:cursor-not-allowed disabled:opacity-40'
                  }`}
              >
                <span>{qf.label}</span>
                <span className="rounded bg-slate-950/60 px-1.5 py-0.5 text-[11px] text-slate-400">
                  {qf.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 ms-auto">
            <label htmlFor="deal-sort" className="text-xs text-slate-400">
              {lang === 'ar' ? 'الترتيب:' : 'Sort:'}
            </label>
            <select
              id="deal-sort"
              value={filterState.sort}
              onChange={(e) => onFilterChange({ sort: e.target.value as SortOption }, 'push')}
              className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-200 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="mt-2.5 text-xs text-slate-500" id="saved-deals-scope">
          {lang === 'ar'
            ? 'المحفوظات تخص هذا المتصفح ولا تنتقل مع رابط البحث. فلتر المحفوظة يعمل مع بقية الفلاتر.'
            : 'Saved deals belong to this browser and are not included in shared search links.'}
        </p>

        {atLimit && (
          <p role="status" className="mt-2 text-sm text-amber-200">
            {lang === 'ar'
              ? 'بلغت حد 500 عرض محفوظ؛ أزل عرضاً لحفظ آخر.'
              : '500-save limit reached. Remove a saved deal before adding another.'}
          </p>
        )}
        {degraded && (
          <p role="status" className="mt-2 text-sm text-amber-200">
            {lang === 'ar'
              ? 'التخزين المحلي غير متاح؛ الحفظ مؤقت في هذا التبويب ما لم تنجح محاولة كتابة لاحقة؛ قد يُفقد عند إعادة التحميل أو الإغلاق.'
              : 'Local storage is unavailable. Saves are temporary in this tab until a later write succeeds.'}
          </p>
        )}
      </div>

      {/* 3. "Reviewed & Verified This Week" Section (Hidden when any filter is active) */}
      {newThisWeek.length > 0 && (
        <section className="mt-8 rounded-2xl border border-emerald-500/30 bg-emerald-950/15 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-emerald-300">
                {lang === 'ar' ? 'مُراجَع ومؤكَّد هذا الأسبوع' : 'Reviewed & Confirmed This Week'}
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              {lang === 'ar' ? 'أحدث 3 عروض تم التحقق منها' : 'Top 3 newly verified deals'}
            </span>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {newThisWeek.map((deal) => (
              <DealCard
                key={`new-${deal.slug}`}
                deal={deal}
                onOpen={onOpenDeal}
                isSaved={savedSet.has(deal.slug)}
                onToggleSave={toggle}
              />
            ))}
          </div>
        </section>
      )}

      {/* 4. Main Results Section */}
      <section className="mt-6">
        {filterState.sort === 'deadline' && (
          <p className="mb-3 text-sm text-slate-300">
            {lang === 'ar'
              ? 'مرجع المقارنة UTC. المواعيد الدقيقة القادمة أولاً، ثم الأيام التقويمية، ثم المواعيد السابقة، ثم المجهول.'
              : 'UTC reference. Upcoming exact times first, then calendar dates, past records, and unknowns.'}
          </p>
        )}
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400" role="status" aria-live="polite">
            {lang === 'ar'
              ? `${sorted.length.toLocaleString('ar-EG')} عرض من أصل ${deals.length.toLocaleString('ar-EG')}`
              : `${sorted.length} of ${deals.length} offers`}
          </p>
          {hasAnyActiveFilter && (
            <button
              type="button"
              onClick={handleResetAll}
              className="text-xs text-slate-400 transition hover:text-emerald-400"
            >
              {lang === 'ar' ? 'إعادة ضبط الكل' : 'Reset all'}
            </button>
          )}
        </div>

        {sorted.length === 0 ? (
          <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 py-14 px-4 text-center">
            <Inbox className="h-10 w-10 text-slate-600" />
            {savedOnly && validSavedCount === 0 ? (
              <>
                <p className="max-w-md text-sm text-slate-300">
                  {lang === 'ar'
                    ? 'لم تقم بحفظ أي عروض بعد. اضغط على أيقونة الإشارة المرجعية في بطاقة أي عرض لحفظه هنا والرجوع إليه بسرعة.'
                    : 'No saved deals yet. Click the bookmark icon on any deal card to save it here for quick access.'}
                </p>
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="mt-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-medium text-emerald-300 transition-colors hover:bg-emerald-500/20"
                >
                  {lang === 'ar' ? 'استكشاف كل العروض' : 'Explore all deals'}
                </button>
              </>
            ) : (
              <>
                <p className="text-base font-medium text-slate-200">
                  {lang === 'ar'
                    ? 'لا توجد عروض تطابق الفلاتر المحددة حالياً'
                    : 'No deals match your current filters.'}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {lang === 'ar'
                    ? 'جرّب تخفيف أحد الشروط التالية لإظهار العروض المتاحة.'
                    : 'Try removing or adjusting filters to see available deals.'}
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                  {mostRestrictiveFilter && (
                    <button
                      type="button"
                      onClick={mostRestrictiveFilter.clear}
                      className="rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/25 shadow-sm shadow-emerald-950/40"
                    >
                      {lang === 'ar'
                        ? `إزالة فلتر «${mostRestrictiveFilter.label}» (سيُظهر ${mostRestrictiveFilter.count} عروض)`
                        : `Remove "${mostRestrictiveFilter.label}" (shows ${mostRestrictiveFilter.count} deals)`}
                    </button>
                  )}
                  {hasAnyActiveFilter && (
                    <button
                      type="button"
                      onClick={handleResetAll}
                      className="rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2 text-xs font-medium text-slate-300 transition hover:border-slate-500"
                    >
                      {lang === 'ar' ? 'إزالة جميع الفلاتر' : 'Clear all filters'}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        ) : listed.length > 0 ? (
          <>
            {newSlugs.size > 0 && (
              <h2 className="mt-8 text-sm font-bold text-slate-200">
                {lang === 'ar' ? 'كل العروض' : 'All deals'}
              </h2>
            )}
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {listed.map((deal, i) => {
                const tier = classifyDeadline(deal.registration.deadline, referenceNow).tier;
                const previous = i > 0 ? listed[i - 1] : undefined;
                const firstInGroup =
                  !previous ||
                  classifyDeadline(previous.registration.deadline, referenceNow).tier !== tier;
                const headings =
                  lang === 'ar'
                    ? [
                      'مواعيد قادمة بتوقيت صريح',
                      'تواريخ تقويمية دون ساعة',
                      'مواعيد أو تواريخ سابقة',
                      'مواعيد غير معلومة',
                    ]
                    : [
                      'Upcoming exact times',
                      'Calendar dates without hours',
                      'Past recorded dates or times',
                      'Unknown deadlines',
                    ];
                return (
                  <div key={deal.id} className="contents">
                    {filterState.sort === 'deadline' && firstInGroup && (
                      <h2 className="col-span-full mt-4 text-base font-semibold text-slate-200">
                        {headings[tier - 1]}
                      </h2>
                    )}
                    {filterState.sort === 'deadline' ? (
                      <div className="flex min-w-0 flex-col gap-2">
                        <p className="text-xs text-slate-300">
                          {deadlineTierLabel(deal.registration.deadline, lang, referenceNow)}
                        </p>
                        <DealCard
                          deal={deal}
                          onOpen={onOpenDeal}
                          index={i}
                          isSaved={savedSet.has(deal.slug)}
                          onToggleSave={toggle}
                        />
                      </div>
                    ) : (
                      <DealCard
                        deal={deal}
                        onOpen={onOpenDeal}
                        index={i}
                        isSaved={savedSet.has(deal.slug)}
                        onToggleSave={toggle}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : null}
      </section>

      {/* 5. Distinction & Methodology Section */}
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

      <ScrollToTop />
    </main>
  );
}

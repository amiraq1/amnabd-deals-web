import { useEffect, useMemo, useRef, useState } from 'react';
import { Heart, ArrowLeft, ArrowRight, Share2, Copy, Check, Search, Clock3 } from 'lucide-react';
import type { Deal, Lang } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { useFavorites } from '@/hooks/useFavorites';
import { buildSharedFavoritesUrl, formatFavoritesAsText } from '@/lib/shareFavorites';
import { copyLink } from '@/lib/share';
import { getFavorites, saveFavorites } from '@/lib/favorites';
import { exportFavorites, importFavorites, FAVORITES_TRANSFER_MAX_BYTES } from '@/lib/favoritesTransfer';
import { offerExpiryInstant } from '@/lib/dealTiming';
import { getSavedOffersEndingSoon } from '@/lib/savedOfferExpiry';
import DealCard from '@/components/DealCard';

interface FavoritesPageProps {
  deals: Deal[];
  onOpenDeal: (slug: string) => void;
  onBackToHome: () => void;
}

type CopyStatus = 'link' | 'text' | 'error' | null;

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand';

const buttonClass =
  `inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-line bg-surface-raised px-3.5 py-2 text-xs font-medium text-stone-200 transition-colors hover:border-line-hover hover:text-stone-100 ${focusRing} active:scale-[0.99]`;

function countLabel(n: number, lang: Lang): string {
  if (lang === 'ar') {
    if (n === 1) return 'عرض واحد';
    if (n === 2) return 'عرضان';
    if (n <= 10) return `${n} عروض`;
    return `${n} عرضًا`;
  }
  return `${n} ${n === 1 ? 'deal' : 'deals'}`;
}

function formatExpiryDate(value: string, lang: Lang): string {
  const expiry = offerExpiryInstant(value);
  if (expiry === null) return '';
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar' : 'en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(expiry);
}

export default function FavoritesPage({ deals, onOpenDeal, onBackToHome }: FavoritesPageProps) {
  const { lang, dir } = useLanguage();
  const isAr = lang === 'ar';
  const { favorites, toggleFavorite } = useFavorites();
  const [transferState, setTransferState] = useState<{ message: string; isError: boolean } | null>(null);
  const [status, setStatus] = useState<CopyStatus>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const flash = (next: CopyStatus) => {
    setStatus(next);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus(null), 3000);
  };

  const favoriteDeals = useMemo(() => {
    const dealMap = new Map(deals.map((d) => [d.slug, d]));
    return favorites
      .map((slug) => dealMap.get(slug))
      .filter((deal): deal is Deal => Boolean(deal));
  }, [favorites, deals]);

  const [referenceNow, setReferenceNow] = useState(() => new Date());
  useEffect(() => {
    const refresh = () => setReferenceNow(new Date());
    const timer = window.setInterval(refresh, 60000);
    document.addEventListener('visibilitychange', refresh);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', refresh); };
  }, []);
  const missingSlugs = useMemo(() => favorites.filter((slug) => !deals.some((deal) => deal.slug === slug)), [favorites, deals]);
  const soonEndingDeals = getSavedOffersEndingSoon(favoriteDeals, referenceNow);

  // نشارك العروض الموجودة فعلًا فقط، فلا تصل لمن يفتح الرابط مفضلات لعروض محذوفة.
  const validSlugs = useMemo(() => favoriteDeals.map((d) => d.slug), [favoriteDeals]);

  const writeText = navigator.clipboard?.writeText?.bind(navigator.clipboard);

  const handleShareList = async () => {
    const url = buildSharedFavoritesUrl(validSlugs);
    // على الجوال تفتح قائمة المشاركة الأصلية، وعلى سطح المكتب ننسخ الرابط.
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: isAr ? 'مفضلتي في نبض' : 'My Nabd favorites', url });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
      }
    }
    flash((await copyLink(url, writeText)) ? 'link' : 'error');
  };

  const handleCopyText = async () => {
    const text = formatFavoritesAsText(deals, validSlugs);
    flash((await copyLink(text, writeText)) ? 'text' : 'error');
  };

  const handleExport = () => {
    let url: string | null = null;
    try {
      const blob = new Blob([exportFavorites(favorites)], { type: 'application/json' });
      url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'nabd-favorites.json';
      link.hidden = true;
      document.body.appendChild(link);
      try { link.click(); } finally { link.remove(); }
      const objectUrl = url;
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      setTransferState(null);
    } catch {
      if (url) URL.revokeObjectURL(url);
      setTransferState({
        message: isAr
          ? 'تعذر التصدير: تحقق من المعرّفات وأزل الزائد عن 500 عنصر أو قلّل حجم القائمة إلى أقل من 100 كيلوبايت. لم تُحذف أي محفوظات.'
          : 'Export failed: check the identifiers and reduce the list to 500 items and 100 KB or less. No saved items were removed.',
        isError: true,
      });
    }
  };
  const handleImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      if (file.size > FAVORITES_TRANSFER_MAX_BYTES) throw new Error('file_too_large');
      const result = importFavorites(await file.text(), getFavorites());
      const persisted = saveFavorites(result.slugs);
      setTransferState({
        message: isAr
          ? `أضيف ${result.added}، وتُرك ${result.skipped} بسبب الحد الأقصى.${persisted ? '' : ' تعذر الحفظ الدائم؛ القائمة متاحة لهذه الجلسة فقط.'}`
          : `Added ${result.added}; ${result.skipped} skipped at the limit.${persisted ? '' : ' Persistent storage failed; this list is available only for this session.'}`,
        isError: false,
      });
    } catch {
      setTransferState({
        message: isAr ? 'تعذر الاستيراد: اختر ملف مفضلة صالحًا لا يتجاوز 100 كيلوبايت.' : 'Import failed: choose a valid favorites file no larger than 100 KB.',
        isError: true,
      });
    }
  };

  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  const statusMessage =
    status === 'link'
      ? isAr ? 'تم نسخ الرابط' : 'Link copied'
      : status === 'text'
        ? isAr ? 'تم نسخ النص' : 'Text copied'
        : status === 'error'
          ? isAr ? 'تعذّر النسخ. جرّب مرة أخرى أو انسخ يدويًا.' : 'Copy failed. Try again or copy manually.'
          : '';

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onBackToHome}
            className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg text-sm font-medium text-stone-400 transition-colors hover:text-stone-100 ${focusRing}`}
          >
            <BackIcon className="h-4 w-4" aria-hidden="true" />
            <span>{isAr ? 'كل العروض' : 'All deals'}</span>
          </button>
          <h1 className="font-heading mt-3 text-2xl font-bold tracking-tight text-stone-100 sm:text-3xl">
            {isAr ? 'مفضلتي' : 'My Favorites'}
          </h1>
          <p className="mt-1 text-sm text-stone-400">
            {isAr
              ? 'العروض المحفوظة محليًا في هذا المتصفح'
              : 'Deals saved locally in this browser'}
          </p>
        </div>

        {favoriteDeals.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-line bg-surface-raised px-3 py-1.5 text-xs font-semibold tabular-nums text-stone-200">
              <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" aria-hidden="true" />
              <span>{countLabel(favoriteDeals.length, lang)}</span>
            </span>

            <button type="button" onClick={handleShareList} className={buttonClass}>
              {status === 'link' ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
              ) : (
                <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>
                {status === 'link'
                  ? isAr ? 'تم نسخ الرابط' : 'Link copied'
                  : isAr ? 'مشاركة القائمة' : 'Share list'}
              </span>
            </button>

            <button type="button" onClick={handleCopyText} className={buttonClass}>
              {status === 'text' ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>
                {status === 'text'
                  ? isAr ? 'تم نسخ النص' : 'Text copied'
                  : isAr ? 'نسخ لتيليغرام/X' : 'Copy for Telegram/X'}
              </span>
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2.5">
        <button type="button" onClick={handleExport} className={buttonClass}>{isAr ? 'تصدير المفضلة' : 'Export favorites'}</button>
        <label className={`${buttonClass} cursor-pointer`}>
          {isAr ? 'استيراد ودمج المفضلة' : 'Import and merge favorites'}
          <input type="file" accept="application/json,.json" className="sr-only" onChange={(event) => { void handleImport(event.target.files?.[0]); event.target.value = ''; }} />
        </label>
      </div>
      <p className="mt-2 text-xs text-stone-400">{isAr ? 'ملف التصدير يحتوي معرفات المحفوظات؛ شاركه فقط مع من تثق به. الاستيراد يضيف للقائمة ولا يستبدلها.' : 'The export contains saved identifiers; share it only with people you trust. Import merges rather than replaces.'}</p>
      
      {transferState && (
        <p
          role={transferState.isError ? 'alert' : 'status'}
          aria-live={transferState.isError ? undefined : 'polite'}
          className={`mt-2 text-sm ${transferState.isError ? 'font-medium text-amber-400' : 'text-stone-300'}`}
        >
          {transferState.message}
        </p>
      )}

      {missingSlugs.length > 0 && (
        <section className="mt-6 rounded-card border border-line bg-surface-raised p-4 sm:p-5" aria-labelledby="missing-saved-title">
          <h2 id="missing-saved-title" className="font-heading text-sm font-semibold text-amber-300">{isAr ? 'محفوظات غير موجودة في الكتالوج المحمّل' : 'Saved items missing from the loaded catalog'}</h2>
          <p className="mt-1 text-xs text-stone-400">{isAr ? 'قد يكون العرض أزيل أو غير متاح حاليًا؛ هذه الحالة تختلف عن انتهاء العرض.' : 'An item may have been removed or be temporarily unavailable; this is distinct from an expired offer.'}</p>
          <ul className="mt-3 space-y-2">{missingSlugs.map((slug) => <li key={slug} className="flex flex-wrap items-center gap-3 text-sm"><bdi className="font-mono text-xs text-stone-300">{slug}</bdi><button type="button" onClick={() => toggleFavorite(slug)} className={buttonClass}>{isAr ? 'إزالة من المفضلة' : 'Remove from favorites'}</button></li>)}</ul>
        </section>
      )}

      {/* يقرؤها قارئ الشاشة عند نجاح النسخ أو فشله، ويراها الجميع عند الفشل */}
      <p
        role="status"
        className={
          status === 'error'
            ? 'mt-3 text-xs font-medium text-amber-400'
            : 'sr-only'
        }
      >
        {statusMessage}
      </p>

      {soonEndingDeals.length > 0 && (
        <section className="mt-8 rounded-card border border-line bg-surface-raised p-5 sm:p-6" aria-labelledby="saved-ending-soon-title">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="saved-ending-soon-title" className="font-heading flex items-center gap-2 text-base font-bold text-stone-100">
                <Clock3 className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
                <span>{isAr ? 'عروض محفوظة تنتهي خلال 14 يومًا' : 'Saved offers ending within 14 days'}</span>
              </h2>
              <p className="mt-1 text-xs text-stone-400">
                {isAr
                  ? 'يعرض هذا القسم العروض التي لها تاريخ انتهاء مسجّل وصالح فقط.'
                  : 'Only saved offers with a valid recorded end date appear here.'}
              </p>
            </div>
            <span className="rounded-md border border-line bg-surface px-2.5 py-1 text-xs font-semibold tabular-nums text-amber-300">
              {countLabel(soonEndingDeals.length, lang)}
            </span>
          </div>
          <ul className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {soonEndingDeals.map((deal) => {
              const name = isAr ? deal.name_ar : deal.name_en;
              const endsAt = deal.ends_at?.trim() ?? '';
              return (
                <li key={deal.slug} className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-line bg-surface px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-stone-100">{name}</p>
                    <p className="mt-1 text-xs text-stone-400">
                      <time dateTime={endsAt} className="tabular-nums">
                        {isAr ? 'ينتهي في' : 'Ends'} {formatExpiryDate(endsAt, lang)}
                      </time>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenDeal(deal.slug)}
                    aria-label={isAr ? `فتح ${name}` : `Open ${name}`}
                    className={`shrink-0 rounded-md border border-line bg-surface-raised px-3 py-1.5 text-xs font-medium text-stone-200 transition-colors hover:border-line-hover hover:text-stone-100 ${focusRing}`}
                  >
                    {isAr ? 'التفاصيل' : 'Details'}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {favoriteDeals.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center rounded-card border border-line bg-surface-raised px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-surface text-stone-400">
            <Heart className="h-6 w-6 stroke-[1.5]" aria-hidden="true" />
          </div>
          <h2 className="mt-4 font-heading text-lg font-bold text-stone-100">
            {isAr ? 'لم تحفظ أي عرض بعد' : 'No saved deals yet'}
          </h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-stone-400">
            {isAr
              ? 'اضغط على القلب في أي عرض لحفظه هنا، وارجع إليه قبل أن ينتهي.'
              : 'Tap the heart on any deal to save it here and come back before it ends.'}
          </p>
          <button
            type="button"
            onClick={onBackToHome}
            className={`mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium text-stone-200 transition-colors hover:border-line-hover hover:text-stone-100 ${focusRing}`}
          >
            <Search className="h-4 w-4 text-stone-400" aria-hidden="true" />
            <span>{isAr ? 'تصفّح العروض' : 'Browse deals'}</span>
          </button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {favoriteDeals.map((deal) => (
            <DealCard
              key={deal.slug}
              deal={deal}
              referenceNow={referenceNow}
              onOpen={onOpenDeal}
            />
          ))}
        </div>
      )}
    </main>
  );
}

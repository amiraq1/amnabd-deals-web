import { useEffect, useMemo, useRef, useState } from 'react';
import { Heart, ArrowLeft, ArrowRight, Share2, Copy, Check, Search, Clock3 } from 'lucide-react';
import type { Deal, Lang } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { useFavorites } from '@/hooks/useFavorites';
import { buildSharedFavoritesUrl, formatFavoritesAsText } from '@/lib/shareFavorites';
import { copyLink } from '@/lib/share';
import { offerExpiryInstant } from '@/lib/dealTiming';
import { getSavedOffersEndingSoon } from '@/lib/savedOfferExpiry';
import DealCard from '@/components/DealCard';

interface FavoritesPageProps {
  deals: Deal[];
  onOpenDeal: (slug: string) => void;
  onBackToHome: () => void;
}

type CopyStatus = 'link' | 'text' | 'error' | null;

const buttonClass =
  'inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2 text-xs font-medium text-slate-200 transition hover:border-emerald-500/50 hover:text-emerald-300';

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
  const { favorites } = useFavorites();
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

  const soonEndingDeals = getSavedOffersEndingSoon(favoriteDeals, new Date());

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
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-white"
          >
            <BackIcon className="h-4 w-4" aria-hidden="true" />
            <span>{isAr ? 'كل العروض' : 'All deals'}</span>
          </button>
          <h1 className="font-heading mt-3 text-3xl font-extrabold text-white">
            {isAr ? 'مفضلتي' : 'My Favorites'}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {isAr
              ? 'العروض المحفوظة محليًا في هذا المتصفح'
              : 'Deals saved locally in this browser'}
          </p>
        </div>

        {favoriteDeals.length > 0 && (
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3.5 py-1.5 text-xs font-semibold text-rose-300">
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

      {/* يقرؤها قارئ الشاشة عند نجاح النسخ أو فشله، ويراها الجميع عند الفشل */}
      <p
        role="status"
        className={
          status === 'error'
            ? 'mt-3 text-xs font-medium text-amber-300'
            : 'sr-only'
        }
      >
        {statusMessage}
      </p>

      {soonEndingDeals.length > 0 && (
        <section className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 sm:p-6" aria-labelledby="saved-ending-soon-title">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="saved-ending-soon-title" className="font-heading flex items-center gap-2 text-lg font-bold text-amber-200">
                <Clock3 className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span>{isAr ? 'عروض محفوظة تنتهي خلال 14 يومًا' : 'Saved offers ending within 14 days'}</span>
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                {isAr
                  ? 'يعرض هذا القسم العروض التي لها تاريخ انتهاء مسجّل وصالح فقط.'
                  : 'Only saved offers with a valid recorded end date appear here.'}
              </p>
            </div>
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200">
              {countLabel(soonEndingDeals.length, lang)}
            </span>
          </div>
          <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {soonEndingDeals.map((deal) => {
              const name = isAr ? deal.name_ar : deal.name_en;
              const endsAt = deal.ends_at?.trim() ?? '';
              return (
                <li key={deal.slug} className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{name}</p>
                    <p className="mt-1 text-xs text-amber-200/80">
                      <time dateTime={endsAt}>
                        {isAr ? 'ينتهي في' : 'Ends'} {formatExpiryDate(endsAt, lang)}
                      </time>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenDeal(deal.slug)}
                    aria-label={isAr ? `فتح ${name}` : `Open ${name}`}
                    className="shrink-0 rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-amber-400/60 hover:text-amber-200"
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
        <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/40 px-6 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400">
            <Heart className="h-8 w-8 stroke-[1.5]" aria-hidden="true" />
          </div>
          <h2 className="mt-5 text-xl font-bold text-white">
            {isAr ? 'لم تحفظ أي عرض بعد' : 'No saved deals yet'}
          </h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-400">
            {isAr
              ? 'اضغط على القلب في أي عرض لحفظه هنا، وارجع إليه قبل أن ينتهي.'
              : 'Tap the heart on any deal to save it here and come back before it ends.'}
          </p>
          <button
            type="button"
            onClick={onBackToHome}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            <span>{isAr ? 'تصفّح العروض' : 'Browse deals'}</span>
          </button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {favoriteDeals.map((deal) => (
            <DealCard key={deal.slug} deal={deal} onOpen={onOpenDeal} />
          ))}
        </div>
      )}
    </main>
  );
}

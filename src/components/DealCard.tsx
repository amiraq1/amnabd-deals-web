import type { MouseEvent } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type { Deal, Lang } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { resolveDealOfficialUrl } from '@/lib/safeUrl';
import { getDealDisplayName, getDealHeadlineValue, getDealKeyCondition } from '@/lib/dealMetadata';
import { getTimingState } from '@/lib/dealTiming';
import { isVerifiedReview } from '@/lib/verification';
import { countryAvailability } from '@/lib/countryAvailability';
import { routeUrl } from '@/lib/routes';
import { languageSearchForLocation } from '@/lib/languageStorage';
import DealIcon from '@/components/DealIcon';
import FavoriteButton from '@/components/FavoriteButton';

export interface DealCardProps {
  deal: Deal;
  referenceNow: Date;
  country?: string;
  onOpen?: (slug: string) => void;
  // الخصائص التالية أبقيتها للتوافق مع الاستدعاءات الحالية، وهي غير مستخدمة داخل البطاقة.
  index?: number;
  isSaved?: boolean;
  onToggleSave?: (slug: string) => void;
  isFavorited?: boolean;
  onToggleFavorite?: (slug: string) => void;
  isComparisonSelected?: boolean;
  comparisonDisabled?: boolean;
  onToggleComparison?: (slug: string) => void;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function endsLabel(days: number, lang: Lang): string {
  if (lang === 'ar') {
    if (days === 1) return 'ينتهي خلال 24 ساعة';
    if (days === 2) return 'ينتهي بعد يومين';
    if (days <= 10) return `ينتهي خلال ${days} أيام`;
    return `ينتهي خلال ${days} يومًا`;
  }
  return days === 1 ? 'Ends within 24h' : `Ends in ${days} days`;
}

function registrationLabel(date: string, passed: boolean, lang: Lang): string {
  const prefix = lang === 'ar' ? 'آخر موعد للتسجيل' : 'Registration closes';
  if (passed) return lang === 'ar' ? `انتهى موعد التسجيل (${date})` : `Registration closed (${date})`;
  return `${prefix}: ${date}`;
}

function isRecentlyReviewed(
  reviewedOn: string | null | undefined,
  createdAt: string | null | undefined,
  referenceNow: Date
): boolean {
  const value = reviewedOn || createdAt;
  if (!value) return false;
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return false;
  const diffDays = (referenceNow.getTime() - time) / DAY_MS;
  return diffDays >= 0 && diffDays <= 7;
}

export default function DealCard({
  deal,
  referenceNow,
  country,
  onOpen,
  isComparisonSelected = false,
  comparisonDisabled = false,
  onToggleComparison,
}: DealCardProps) {
  const { lang, dir } = useLanguage();
  const isAr = lang === 'ar';

  const displayName = getDealDisplayName(deal);
  const headlineValue = getDealHeadlineValue(deal);
  const keyCondition = getDealKeyCondition(deal, lang);
  const officialUrl = resolveDealOfficialUrl(deal);
  const description = isAr
    ? deal.description_ar || deal.description_en
    : deal.description_en || deal.description_ar;

  // One timing model for the card, the sort and the collections (PR-2).
  const timing = getTimingState(deal, referenceNow);
  const expired = timing.offer.state === 'expired';
  const endingSoon = timing.offer.state === 'ending_soon';
  const daysLeft = timing.offer.daysLeft;
  const expiredByDate = expired && timing.offer.reason === 'ends_at';
  const registration = timing.registration;
  const isNew = !expired && isRecentlyReviewed(deal.review.reviewed_on, deal.created_at, referenceNow);
  const verified = isVerifiedReview(deal.review);

  const noCard = deal.eligibility.card_required === 'not_required';
  const studentsOnly = deal.eligibility.applicant_type === 'student';
  const countryStatus = country?.trim() ? countryAvailability(deal, country) : null;

  const languageQuery = languageSearchForLocation('', lang, window.location.search);
  const href = routeUrl({ name: 'deal', slug: deal.slug }, languageQuery);

  // نقرة عادية = تنقل داخل التطبيق. Ctrl/Cmd/Shift/Alt أو الزر الأوسط = يتولاها المتصفح.
  const handleOpen = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!onOpen) return;
    const plainClick = e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
    if (!plainClick) return;
    e.preventDefault();
    onOpen(deal.slug);
  };

  const Arrow = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <article
      className={`deal-spotlight group relative flex flex-col justify-between rounded-2xl border bg-slate-900/60 p-5 transition-colors focus-within:border-emerald-500/60 hover:bg-slate-900/90 ${
        expired ? 'border-slate-800/60 opacity-70' : 'border-slate-800/80 hover:border-slate-700'
      }`}
    >
      <div>
        {/* الشارات وزر المفضلة */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {expired && (
              <span
                className="inline-flex items-center rounded-full border border-slate-700 bg-slate-800/80 px-2.5 py-0.5 text-[11px] font-semibold text-slate-300"
                title={
                  expiredByDate
                    ? isAr
                      ? 'انتهى حسب تاريخ الانتهاء المسجّل'
                      : 'Ended per the recorded end date'
                    : isAr
                      ? 'حسب حالة العرض المسجّلة'
                      : 'Per the recorded offer status'
                }
              >
                {isAr ? 'انتهى العرض' : 'Expired'}
                {expiredByDate && (
                  <span className="ms-1 font-normal text-slate-400">
                    {isAr ? '· حسب التاريخ المسجّل' : '· per recorded date'}
                  </span>
                )}
              </span>
            )}
            {endingSoon && daysLeft !== null && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60 motion-reduce:animate-none" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
                </span>
                <Clock className="h-3 w-3" aria-hidden="true" />
                <span>{endsLabel(daysLeft, lang)}</span>
              </span>
            )}
            {isNew && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                <span>{isAr ? 'جديد' : 'New'}</span>
              </span>
            )}
            {verified && (
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                <ShieldCheck className="h-3 w-3 text-emerald-400" aria-hidden="true" />
                <span>{isAr ? 'موثّق' : 'Verified'}</span>
              </span>
            )}
          </div>

          {/* z-10 حتى يبقى الزر قابلًا للنقر فوق رابط البطاقة الممتد */}
          <div className="relative z-10">
            <FavoriteButton
              slug={deal.slug}
              dealName={displayName}
              className="rounded-lg border border-slate-800/80 bg-slate-950/50 p-2 text-slate-400 transition hover:border-slate-700 hover:text-white"
            />
          </div>
        </div>

        {/* الأيقونة والاسم. رابط العنوان يمتد ليغطي البطاقة كلها. */}
        <div className="mt-4 flex items-start gap-3.5">
          <DealIcon deal={deal} size="md" className="shrink-0" />
          <h3 className="font-heading min-w-0 flex-1 text-base font-bold leading-snug text-white">
            <a
              href={href}
              onClick={handleOpen}
              className="line-clamp-2 rounded transition-colors after:absolute after:inset-0 after:rounded-2xl group-hover:text-emerald-300"
            >
              {displayName}
            </a>
          </h3>
        </div>

        {/* القيمة هي أهم معلومة في البطاقة. لا نفترض أن العرض مجاني إن غابت. */}
        {headlineValue && (
          <p className="font-heading mt-4 text-lg font-bold leading-snug text-emerald-300">
            {headlineValue}
          </p>
        )}
        {keyCondition && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-300">
            <span className="text-slate-400">{isAr ? 'الشرط: ' : 'Condition: '}</span>
            {keyCondition}
          </p>
        )}

        {(noCard || studentsOnly) && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {noCard && (
              <li className="rounded-md border border-slate-700/80 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                {isAr ? 'بدون بطاقة ائتمان' : 'No credit card'}
              </li>
            )}
            {studentsOnly && (
              <li className="rounded-md border border-slate-700/80 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                {isAr ? 'للطلاب' : 'Students'}
              </li>
            )}
          </ul>
        )}

        {countryStatus && country && (
          <p
            className={`mt-3 inline-flex flex-wrap items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium ${
              countryStatus === 'supported'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                : countryStatus === 'excluded'
                  ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
                  : 'border-slate-700 bg-slate-800/70 text-slate-300'
            }`}
          >
            <span>{isAr ? 'في' : 'In'}</span>
            <span dir="auto">{country}</span>
            <span>
              {countryStatus === 'supported'
                ? isAr
                  ? 'مثبت بالمصدر'
                  : 'confirmed by source'
                : countryStatus === 'excluded'
                  ? isAr
                    ? 'مستثنى صراحةً'
                    : 'explicitly excluded'
                  : isAr
                    ? 'غير مثبت'
                    : 'not verified'}
            </span>
          </p>
        )}

        {/* The registration deadline is reported as itself, never as "the offer ends". */}
        {registration.date && registration.state !== 'unknown' && (
          <p
            className={`mt-2 text-[11px] ${
              registration.state === 'soon' ? 'text-amber-300' : 'text-slate-400'
            }`}
          >
            {registrationLabel(registration.date, registration.state === 'passed', lang)}
          </p>
        )}

        {description && (
          <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-400">
            {description}
          </p>
        )}
      </div>

      {/* الذيل */}
      <div className="relative z-10 mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/60 pt-3.5">
        <span
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 transition-colors group-hover:text-white"
          aria-hidden="true"
        >
          {isAr ? 'تفاصيل العرض' : 'View details'}
          <Arrow className="h-3.5 w-3.5 transition-transform motion-reduce:transition-none rtl:group-hover:-translate-x-1 ltr:group-hover:translate-x-1" />
        </span>

        {onToggleComparison && (
          <button
            type="button"
            aria-pressed={isComparisonSelected}
            aria-label={`${isComparisonSelected ? (isAr ? 'إزالة من المقارنة' : 'Remove from comparison') : (isAr ? 'أضف للمقارنة' : 'Add to comparison')}: ${displayName}`}
            disabled={comparisonDisabled}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onToggleComparison(deal.slug);
            }}
            className="inline-flex min-h-11 items-center rounded-lg border border-emerald-500/25 bg-slate-900/90 px-2.5 py-1.5 text-xs font-medium text-emerald-200 transition hover:border-emerald-400/50 hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {isComparisonSelected
              ? isAr
                ? 'إزالة من المقارنة'
                : 'Remove from comparison'
              : isAr
                ? 'أضف للمقارنة'
                : 'Add to comparison'}
          </button>
        )}

        {officialUrl && (
          <a
            href={officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="relative z-10 inline-flex items-center gap-1 rounded-lg border border-slate-700/80 bg-slate-800/60 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:text-white"
          >
            <span>{isAr ? 'المصدر' : 'Source'}</span>
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
            <span className="sr-only">
              {isAr ? `لرابط مصدر عرض ${displayName} (يفتح في نافذة جديدة)` : `for ${displayName} (opens in a new tab)`}
            </span>
          </a>
        )}
      </div>
    </article>
  );
}

import { memo } from 'react';
import IsolatedText from '@/components/IsolatedText';
import type { MouseEvent } from 'react';
import { ArrowLeft, ArrowRight, ExternalLink, Search } from 'lucide-react';
import type { Deal } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { resolveDealOfficialUrl } from '@/lib/safeUrl';
import { getDealDisplayName } from '@/lib/dealMetadata';
import { primaryBenefit, searchMatchReason } from '@/lib/offerPresentation';
import { extraBenefitsLabel } from '@/lib/cardFacts';
import { countryAvailability } from '@/lib/countryAvailability';
import { routeUrl } from '@/lib/routes';
import { languageSearchForLocation } from '@/lib/languageStorage';
import DealIcon from '@/components/DealIcon';
import FavoriteButton from '@/components/FavoriteButton';
import EvidenceBadge from '@/components/EvidenceBadge';
import CategoryBadge from '@/components/CategoryBadge';
import OfferFacts from '@/components/OfferFacts';
import { getTimingState } from '@/lib/dealTiming';
import { offerTimingLabel } from '@/lib/evidence';

export interface DealCardProps {
  deal: Deal;
  referenceNow: Date;
  country?: string;
  onOpen?: (slug: string) => void;
  searchQuery?: string;
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

function DealCard({
  deal,
  referenceNow,
  country,
  onOpen,
  searchQuery,
  isComparisonSelected = false,
  comparisonDisabled = false,
  onToggleComparison,
}: DealCardProps) {
  const { lang, dir } = useLanguage();
  const isAr = lang === 'ar';
  const displayName = getDealDisplayName(deal);
  const matchReason = searchQuery
    ? searchMatchReason(deal, searchQuery, lang)
    : null;
  const value = primaryBenefit(deal, lang);
  const unknown = isAr ? 'غير معلوم' : 'Unknown';
  const description =
    deal.key_condition ||
    deal.headline_value ||
    (isAr ? deal.description_ar : deal.description_en);
  const additional = extraBenefitsLabel(deal.benefits.length, lang);
  const officialUrl = resolveDealOfficialUrl(deal);
  const countryStatus = country?.trim()
    ? countryAvailability(deal, country)
    : null;
  const href = routeUrl(
    { name: 'deal', slug: deal.slug },
    languageSearchForLocation('', lang, window.location.search),
  );
  const handleOpen = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      !onOpen ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    onOpen(deal.slug);
  };
  const Arrow = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <article
      className={`deal-spotlight group relative flex h-full min-w-0 flex-col rounded-card border border-line-card bg-surface-card p-5 shadow-card transition-[border-color,box-shadow] duration-200 hover:border-line-card-hover focus-within:border-brand [overflow-wrap:anywhere]`}
    >
      {/* 1. Header: Monogram, Title, Category Badge, and Quick Favorite */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <DealIcon deal={deal} size="sm" />
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-base font-bold leading-snug text-ink">
              <bdi>{displayName}</bdi>
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <CategoryBadge value={deal.category.value} lang={lang} />
              {matchReason && (
                <span className="inline-flex min-w-0 max-w-full items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-xs font-medium text-emerald-300">
                  <Search className="h-3 w-3 shrink-0 text-emerald-400" aria-hidden="true" />
                  <bdi className="truncate">{matchReason}</bdi>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="relative z-10 shrink-0">
          <FavoriteButton
            slug={deal.slug}
            dealName={displayName}
            className="border border-line-card bg-surface-card-inner hover:border-line-card-hover"
          />
        </div>
      </div>

      {getTimingState(deal, referenceNow).offer.state === 'expired' && (
        <p className="mt-3 rounded border border-amber-500/30 border-s-2 border-s-amber-400 bg-amber-500/10 px-2.5 py-1.5 text-xs font-medium tabular-nums text-amber-200">
          {offerTimingLabel(getTimingState(deal, referenceNow).offer, deal.review.offer_status, lang)}
        </p>
      )}

      {/* 2. Core Benefit & Editorial Context (No heavy divider, clean whitespace) */}
      <div className="mt-4">
        <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">
          {isAr ? 'القيمة الأساسية' : 'Core Benefit'}
        </p>
        <p
          className={`mt-1 line-clamp-2 text-lg sm:text-xl font-bold leading-snug tabular-nums ${
            value === unknown ? 'text-ink-secondary' : 'text-ink'
          }`}
        >
          <bdi>
            <IsolatedText text={value} />
          </bdi>
        </p>
        <p className="mt-1.5 line-clamp-2 text-xs sm:text-sm leading-relaxed text-ink-secondary">
          <bdi>
            <IsolatedText text={description || unknown} />
          </bdi>
        </p>
        {additional && (
          <p className="mt-1 text-xs text-ink-muted tabular-nums">
            <bdi>{additional}</bdi>
          </p>
        )}
      </div>

      {/* 3. Structural Divider 1: Structured Facts Grid & Verification Status */}
      <div className="mt-4 border-t border-line-subtle pt-3.5">
        <OfferFacts deal={deal} lang={lang} />

        {countryStatus && country && (
          <p className="mt-2.5 rounded border border-line-subtle bg-surface-card-inner px-2.5 py-1.5 text-xs text-ink-secondary">
            {isAr ? 'في ' : 'In '}
            <bdi>{country}</bdi>
            {' · '}
            {countryStatus === 'supported'
              ? isAr
                ? 'مثبت بالمصدر'
                : 'Confirmed by source'
              : countryStatus === 'excluded'
                ? isAr
                  ? 'مستثنى صراحةً'
                  : 'Explicitly excluded'
                : isAr
                  ? 'غير مثبت'
                  : 'Not verified'}
          </p>
        )}

        <div className="mt-auto pt-3">
          <EvidenceBadge
            status={deal.review.verification_status}
            review={deal.review}
            reviewedOn={deal.review.reviewed_on}
            lang={lang}
          />
        </div>
      </div>

      {/* 4. Structural Divider 2: Decisive Actions & Accessible Tap Layers */}
      <div className="mt-3 border-t border-line-subtle pt-3">
        <div className="flex items-center gap-2">
          <a
            href={href}
            onClick={handleOpen}
            className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-control border border-line-card bg-surface-card-inner px-3 py-2 text-sm font-semibold text-stone-100 transition-[colors,transform] duration-150 active:scale-[0.98] after:absolute after:inset-0 after:rounded-card hover:border-emerald-500/50 hover:bg-surface-overlay hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <span>{isAr ? 'تفاصيل العرض' : 'View details'}</span>
            <span className="sr-only">: {displayName}</span>
            <Arrow aria-hidden="true" className="h-4 w-4 shrink-0 text-stone-400 group-hover:text-stone-200" />
          </a>

          {officialUrl && (
            <a
              href={officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-10 inline-flex min-h-11 items-center gap-1.5 rounded-control border border-line-card bg-surface-card-inner px-3 text-xs font-medium text-stone-300 transition-colors hover:border-line-card-hover hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <span>{isAr ? 'المصدر' : 'Source'}</span>
              <ExternalLink aria-hidden="true" className="h-3.5 w-3.5 text-stone-400" />
              <span className="sr-only">
                {isAr
                  ? ` لعرض ${displayName} (يفتح في نافذة جديدة)`
                  : ` for ${displayName} (opens in a new tab)`}
              </span>
            </a>
          )}
        </div>

        {onToggleComparison && (
          <div className="mt-2 flex items-center justify-end">
            <button
              type="button"
              aria-pressed={isComparisonSelected}
              disabled={comparisonDisabled}
              aria-label={`${isComparisonSelected ? (isAr ? 'إزالة من المقارنة' : 'Remove from comparison') : isAr ? 'أضف للمقارنة' : 'Add to comparison'}: ${displayName}`}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onToggleComparison(deal.slug);
              }}
              className="relative z-10 min-h-11 rounded-control px-2 text-xs text-stone-400 hover:text-stone-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isComparisonSelected
                ? isAr
                  ? 'إزالة من المقارنة'
                  : 'Remove from comparison'
                : isAr
                  ? 'أضف للمقارنة'
                  : 'Add to comparison'}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

export default memo(DealCard);

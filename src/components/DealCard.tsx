import IsolatedText from '@/components/IsolatedText';
import type { MouseEvent } from 'react';
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react';
import type { Deal } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { resolveDealOfficialUrl } from '@/lib/safeUrl';
import { getDealDisplayName } from '@/lib/dealMetadata';
import { primaryBenefit } from '@/lib/offerPresentation';
import { extraBenefitsLabel } from '@/lib/cardFacts';
import { countryAvailability } from '@/lib/countryAvailability';
import { routeUrl } from '@/lib/routes';
import { languageSearchForLocation } from '@/lib/languageStorage';
import DealIcon from '@/components/DealIcon';
import FavoriteButton from '@/components/FavoriteButton';
import EvidenceBadge from '@/components/EvidenceBadge';
import CategoryBadge from '@/components/CategoryBadge';
import OfferFacts from '@/components/OfferFacts';

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

export default function DealCard({
  deal,
  country,
  onOpen,
  isComparisonSelected = false,
  comparisonDisabled = false,
  onToggleComparison,
}: DealCardProps) {
  const { lang, dir } = useLanguage();
  const isAr = lang === 'ar';
  const displayName = getDealDisplayName(deal);
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
      className={`deal-spotlight group relative flex min-h-offer min-w-0 flex-col rounded-card border border-line bg-surface-raised p-5 transition-colors hover:border-slate-500 focus-within:border-brand [overflow-wrap:anywhere]`}
    >
      <div className="flex min-h-[6.5rem] items-start gap-3">
        <DealIcon deal={deal} />
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-base font-bold leading-relaxed text-ink">
            <bdi>{displayName}</bdi>
          </h3>
          <div className="mt-1">
            <CategoryBadge value={deal.category.value} lang={lang} />
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-line-subtle pt-4">
        <p className="text-sm text-ink-muted">
          {isAr ? 'المنفعة المسجّلة' : 'Recorded benefit'}
        </p>
        <p
          className={`mt-1 line-clamp-3 min-h-[4.5rem] text-2xl font-bold leading-normal ${value === unknown ? 'text-ink-secondary' : 'text-ink'}`}
        >
          <bdi>
            <IsolatedText text={value} />
          </bdi>
        </p>
        <p className="mt-2 line-clamp-3 min-h-[4.5rem] text-sm leading-relaxed text-ink-secondary">
          <bdi>
            <IsolatedText text={description || unknown} />
          </bdi>
        </p>
        <p className="mt-2 min-h-6 text-sm text-ink-muted">
          <bdi>{additional || '\u00a0'}</bdi>
        </p>
      </div>

      <div className="mt-4 border-t border-line-subtle pt-4">
        <OfferFacts deal={deal} lang={lang} />
      </div>
      {countryStatus && country && (
        <p className="mt-3 rounded-lg border border-line px-3 py-2 text-sm text-ink-secondary">
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
      <div className="mt-auto pt-5">
        <EvidenceBadge
          status={deal.review.verification_status}
          reviewedOn={deal.review.reviewed_on}
          lang={lang}
        />
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-line-subtle pt-4">
        <a
          href={href}
          onClick={handleOpen}
          className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-control bg-brand px-3 py-2 text-sm font-semibold text-slate-950 transition-colors after:absolute after:inset-0 after:rounded-2xl hover:bg-brand-soft"
        >
          {isAr ? 'تفاصيل العرض' : 'View details'}
          <span className="sr-only">: {displayName}</span>
          <Arrow aria-hidden="true" className="h-4 w-4 shrink-0" />
        </a>
        <div className="relative z-10">
          <FavoriteButton
            slug={deal.slug}
            dealName={displayName}
            className="border border-line bg-surface"
          />
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        {onToggleComparison && (
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
            className="relative z-10 min-h-11 rounded-control px-2 text-sm text-ink-secondary hover:bg-surface-overlay disabled:cursor-not-allowed disabled:opacity-50"
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
            className="relative z-10 inline-flex min-h-11 items-center gap-1.5 rounded-control px-2 text-sm text-ink-secondary hover:bg-surface-overlay"
          >
            {isAr ? 'المصدر' : 'Source'}
            <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
            <span className="sr-only">
              {isAr
                ? ` لعرض ${displayName} (يفتح في نافذة جديدة)`
                : ` for ${displayName} (opens in a new tab)`}
            </span>
          </a>
        )}
      </div>
    </article>
  );
}

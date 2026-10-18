import { extraBenefitsLabel, recordedPrice, registrationDeadlineValue } from '@/lib/cardFacts';
import EvidenceBadge from './EvidenceBadge';
import { ArrowLeft, ArrowRight, ExternalLink, CircleAlert, Bookmark } from 'lucide-react';
import type { Deal } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { benefitAmount, durationLabel, frequencyLabel, benefitTypeLabel } from '@/lib/format';
import { resolveDealOfficialUrl } from '@/lib/safeUrl';
import { getDealDisplayName } from '@/lib/dealMetadata';
import DealIcon from '@/components/DealIcon';
import { useSavedDeals } from '@/hooks/useSavedDeals';

interface DealCardProps {
  deal: Deal;
  onOpen: (slug: string) => void;
  index: number;
  isSaved?: boolean;
  onToggleSave?: (slug: string) => void;
}

export default function DealCard({
  deal,
  onOpen,
  index,
  isSaved,
  onToggleSave,
}: DealCardProps) {
  const { lang, dir } = useLanguage();
  const savedHook = useSavedDeals();
  const saved = isSaved !== undefined ? isSaved : savedHook.isSaved(deal.slug);

  const displayName = getDealDisplayName(deal);
  const description = lang === 'ar' ? deal.description_ar : deal.description_en;
  const firstBenefit = deal.benefits[0];
  const additional = extraBenefitsLabel(deal.benefits.length, lang);
  const deadline = registrationDeadlineValue(deal.registration.deadline);
  const offerUrl = resolveDealOfficialUrl(deal);

  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  const handleToggleSave = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleSave) {
      onToggleSave(deal.slug);
    } else {
      savedHook.toggle(deal.slug);
    }
  };

  return (
    <article
      className="animate-fade-up group flex h-full flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-950/40"
      style={{ animationDelay: `${Math.min(index * 60, 400)}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => onOpen(deal.slug)}
          className="flex min-w-0 flex-1 items-center gap-3 text-start rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
        >
          <DealIcon deal={deal} size="md" />
          <h3 className="font-heading min-w-0 break-words text-lg font-bold text-white transition-colors group-hover:text-emerald-300">
            {displayName}
          </h3>
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          <EvidenceBadge
            status={deal.review.verification_status}
            reviewedOn={deal.review.reviewed_on}
            lang={lang}
          />
          <button
            type="button"
            onClick={handleToggleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleToggleSave(e);
              }
            }}
            aria-pressed={saved}
            aria-label={
              lang === 'ar'
                ? saved
                  ? `إزالة ${displayName} من المحفوظات`
                  : `حفظ ${displayName} في المفضلة`
                : saved
                  ? `Remove ${displayName} from saved`
                  : `Save ${displayName}`
            }
            className={`rounded-lg p-1.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 ${
              saved
                ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Bookmark
              className={`h-4 w-4 transition-transform duration-200 active:scale-90 ${
                saved ? 'fill-emerald-400 text-emerald-400' : ''
              }`}
            />
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onOpen(deal.slug)}
        className="mt-3 min-w-0 w-full text-start rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
      >
        <p className="line-clamp-3 text-sm leading-relaxed text-slate-400">{description}</p>
      </button>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {firstBenefit && (
          <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300">
            <bdi>{benefitTypeLabel(firstBenefit.type, lang)}</bdi>
            {' · '}
            <bdi>{benefitAmount(firstBenefit.amount, lang)}</bdi>
          </span>
        )}
        {firstBenefit && (
          <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-400">
            <bdi>{durationLabel(firstBenefit.duration, lang)}</bdi>
          </span>
        )}
        {firstBenefit && frequencyLabel(firstBenefit.frequency, lang) && (
          <span className="rounded-lg bg-gold/10 px-2.5 py-1 text-xs font-medium text-gold">
            <bdi>{frequencyLabel(firstBenefit.frequency, lang)}</bdi>
          </span>
        )}
      </div>

      <div className="mt-3 min-w-0 space-y-2 break-words text-xs text-slate-300">
        {additional && <p className="font-medium text-emerald-300">{additional}</p>}
        <p>
          <bdi>{recordedPrice(deal.pricing, lang)}</bdi>
        </p>
        <p>
          {lang === 'ar' ? 'موعد التسجيل' : 'Registration deadline'}:{' '}
          {deadline ? <bdi dir="ltr">{deadline}</bdi> : lang === 'ar' ? 'غير معلوم' : 'Unknown'}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
        <button
          type="button"
          onClick={() => onOpen(deal.slug)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400 transition-colors hover:text-emerald-300"
        >
          {lang === 'ar' ? 'التفاصيل' : 'Details'}
          <ArrowIcon className="h-4 w-4 transition-transform group-hover:-translate-x-0.5 rtl:group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0" />
        </button>
        {offerUrl ? (
          <a
            href={offerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-300 transition-all hover:border-emerald-400 hover:bg-emerald-500/20"
          >
            <bdi>{lang === 'ar' ? 'المصدر الرسمي' : 'Official Source'}</bdi>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <CircleAlert className="h-3.5 w-3.5" />
            {lang === 'ar' ? 'رابط غير متاح' : 'Link unavailable'}
          </span>
        )}
      </div>
    </article>
  );
}

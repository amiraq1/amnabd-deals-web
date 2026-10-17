import { ArrowLeft, ArrowRight, ExternalLink, BadgeCheck, CircleAlert } from 'lucide-react';
import type { Deal } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { benefitAmount, durationLabel, frequencyLabel, benefitTypeLabel } from '@/lib/format';
import { resolveDealOfficialUrl } from '@/lib/safeUrl';
import { getDealDisplayName } from '@/lib/dealMetadata';
import DealIcon from '@/components/DealIcon';

interface DealCardProps {
  deal: Deal;
  onOpen: (slug: string) => void;
  index: number;
}

export default function DealCard({ deal, onOpen, index }: DealCardProps) {
  const { lang, dir } = useLanguage();
  const displayName = getDealDisplayName(deal);
  const description = lang === 'ar' ? deal.description_ar : deal.description_en;
  const firstBenefit = deal.benefits[0];
  const offerUrl = resolveDealOfficialUrl(deal);

  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <article
      className="animate-fade-up group flex h-full flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-950/40"
      style={{ animationDelay: `${Math.min(index * 60, 400)}ms` }}
    >
      <button onClick={() => onOpen(deal.slug)} className="text-start focus:outline-none">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <DealIcon deal={deal} size="md" />
            <h3 className="font-heading text-lg font-bold text-white transition-colors group-hover:text-emerald-300">
              {displayName}
            </h3>
          </div>
          {deal.review.verification_status === 'supported' && (
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
              <BadgeCheck className="h-3.5 w-3.5" />
              {lang === 'ar' ? 'موثق' : 'Verified'}
            </span>
          )}
        </div>
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-400">{description}</p>
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

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-800 pt-4">
        <button
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

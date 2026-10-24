import { Sparkles, Info, ArrowUpRight, CalendarDays, ExternalLink } from 'lucide-react';
import type { ReviewedActivationGuide } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { reviewDateLabel } from '@/lib/format';
import { safeUrl } from '@/lib/safeUrl';

export interface ActivationGuideProps {
  guide: ReviewedActivationGuide;
  officialUrl?: string | null;
}

function SourceLinks({ sources, lang }: { sources: string[]; lang: 'ar' | 'en' }) {
  const links = Array.from(
    new Set(sources.map((source) => safeUrl(source)).filter((url): url is string => !!url))
  );
  if (links.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2" aria-label={lang === 'ar' ? 'مصادر رسمية' : 'Official sources'}>
      {links.map((url) => {
        let label = url;
        try {
          label = new URL(url).hostname;
        } catch {
          // safeUrl already rejects malformed links; retain a safe fallback label.
        }
        return (
          <a
            key={url}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs text-emerald-300 transition-colors hover:bg-slate-700"
          >
            <bdi className="truncate">{label}</bdi>
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
        );
      })}
    </div>
  );
}

export function ActivationGuide({ guide, officialUrl }: ActivationGuideProps) {
  const { lang } = useLanguage();
  const reviewedWithUnknowns = guide.review_status === 'reviewed_with_unknowns';

  return (
    <section
      id="how-to-activate"
      aria-labelledby="activation-guide-title"
      className="mt-8 scroll-mt-24 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/25 via-slate-900/50 to-slate-900/30 p-6 shadow-lg sm:p-7"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
          <Sparkles className="h-3.5 w-3.5" />
          <span>{lang === 'ar' ? 'دليل تفعيل مُراجَع' : 'Reviewed Activation Guide'}</span>
        </div>
        {officialUrl && (
          <a
            href={officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 transition hover:text-emerald-300"
          >
            <span>{lang === 'ar' ? 'صفحة العرض الرسمية' : 'Official offer page'}</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800/80 px-2.5 py-1">
          {lang === 'ar' ? 'حالة المراجعة' : 'Review status'}:{' '}
          {reviewedWithUnknowns
            ? lang === 'ar'
              ? 'مراجَع؛ بعض الشروط غير معلومة'
              : 'Reviewed; some terms remain unknown'
            : lang === 'ar'
              ? 'مراجَع بالمصادر الرسمية'
              : 'Reviewed against official sources'}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" />
          {lang === 'ar' ? 'تاريخ المراجعة' : 'Reviewed'}: <bdi>{reviewDateLabel(guide.reviewed_on, lang)}</bdi>
        </span>
      </div>

      <h2
        id="activation-guide-title"
        className="font-heading mt-3 text-lg font-bold text-white sm:text-xl"
      >
        {lang === 'ar' ? 'كيف تحصل على هذا العرض وتفعّله؟' : 'How to Claim & Activate This Deal?'}
      </h2>

      <p className="mt-2 text-sm leading-relaxed text-slate-300">{guide.summary[lang]}</p>
      <SourceLinks sources={guide.summary_sources} lang={lang} />

      <div className="mt-6 space-y-3">
        {guide.steps.map((step, idx) => (
          <div
            key={`${idx}-${step.sources[0]}`}
            className="flex items-start gap-3 rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5 transition hover:border-slate-700/80 sm:gap-4"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-xs font-bold text-emerald-300">
              {idx + 1}
            </span>
            <div className="min-w-0">
              <p className="pt-0.5 text-xs leading-relaxed text-slate-200 sm:text-sm">{step[lang]}</p>
              <SourceLinks sources={step.sources} lang={lang} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-950/20 p-3.5 text-xs leading-relaxed text-amber-200/90">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
        <div>
          <strong className="font-semibold text-amber-300">
            {lang === 'ar' ? 'ملاحظة مهمة: ' : 'Important note: '}
          </strong>
          <span>{guide.notes[lang]}</span>
          <SourceLinks sources={guide.notes_sources} lang={lang} />
        </div>
      </div>
    </section>
  );
}

export default ActivationGuide;

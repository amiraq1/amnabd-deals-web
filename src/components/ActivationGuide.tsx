import { Sparkles, Info, ArrowUpRight } from 'lucide-react';
import type { ActivationGuide as ActivationGuideType } from '@/content/activationGuides';
import { useLanguage } from '@/context/LanguageContext';

export interface ActivationGuideProps {
  guide: ActivationGuideType;
  officialUrl?: string | null;
}

export function ActivationGuide({ guide, officialUrl }: ActivationGuideProps) {
  const { lang } = useLanguage();

  return (
    <section
      id="how-to-activate"
      aria-labelledby="activation-guide-title"
      className="mt-8 scroll-mt-24 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/25 via-slate-900/50 to-slate-900/30 p-6 shadow-lg sm:p-7"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
          <Sparkles className="h-3.5 w-3.5" />
          <span>{lang === 'ar' ? 'دليل التفعيل العملي' : 'Step-by-step Guide'}</span>
        </div>

        {officialUrl && (
          <a
            href={officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 transition hover:text-emerald-300"
          >
            <span>{lang === 'ar' ? 'فتح صفحة التفعيل' : 'Open Activation Page'}</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      <h2
        id="activation-guide-title"
        className="font-heading mt-3 text-lg font-bold text-white sm:text-xl"
      >
        {lang === 'ar' ? 'كيف تحصل على هذا العرض وتفعّله؟' : 'How to Claim & Activate This Deal?'}
      </h2>

      <p className="mt-2 text-sm leading-relaxed text-slate-300">
        {guide.summary}
      </p>

      {/* Numbered Steps List */}
      <div className="mt-6 space-y-3">
        {guide.steps.map((step, idx) => (
          <div
            key={idx}
            className="flex items-start gap-3 rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5 transition hover:border-slate-700/80 sm:gap-4"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-xs font-bold text-emerald-300">
              {idx + 1}
            </span>
            <p className="pt-0.5 text-xs leading-relaxed text-slate-200 sm:text-sm">
              {step}
            </p>
          </div>
        ))}
      </div>

      {/* Important Notes Callout */}
      {guide.notes && (
        <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-950/20 p-3.5 text-xs leading-relaxed text-amber-200/90">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <div>
            <strong className="font-semibold text-amber-300">
              {lang === 'ar' ? 'ملاحظة مهمة: ' : 'Important note: '}
            </strong>
            <span>{guide.notes}</span>
          </div>
        </div>
      )}
    </section>
  );
}

export default ActivationGuide;

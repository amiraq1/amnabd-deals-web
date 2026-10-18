import { CalendarDays, ExternalLink } from 'lucide-react';
import type { GuideSectionKey, SiteConfig, UsageGuide } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { safeUrl } from '@/lib/safeUrl';
import { reviewDateLabel } from '@/lib/format';
import { OFFICIAL_TOOL_NAMES } from '@/lib/dealMetadata';

interface UsageGuidePageProps {
  guides: UsageGuide[];
  config: SiteConfig | null;
  guideNames: Record<string, { ar: string; en: string }>;
  loading: boolean;
}

export default function UsageGuidePage({ guides, config, guideNames, loading }: UsageGuidePageProps) {
  const { lang } = useLanguage();
  const overview = config?.overview?.[lang] ?? {};
  const labels = config?.section_labels?.[lang] ?? {};

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="skeleton h-32 w-full" />
        <div className="skeleton mt-6 h-96 w-full" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 pb-8 pt-10 sm:px-6">
      <header className="animate-fade-up">
        <h1 className="font-heading text-3xl font-extrabold text-white">
          {overview.title ?? (lang === 'ar' ? 'دليل التسجيل وفهم قيود العروض' : 'Offer registration and limitations guide')}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slate-300">{overview.intro ?? ''}</p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-800/80 px-3 py-1.5 text-xs text-slate-400">
          <CalendarDays className="h-3.5 w-3.5" />
          {overview.last_reviewed_label ?? ''}: <bdi>{reviewDateLabel(config?.last_reviewed, lang)}</bdi>
        </div>
      </header>

      <section className="animate-fade-up mt-8 rounded-2xl border border-gold/30 bg-gold/5 p-6">
        <h2 className="font-heading text-lg font-bold text-gold">{overview.distinction_title ?? ''}</h2>
        <p className="mt-2 text-sm leading-relaxed text-amber-100">{overview.distinction ?? ''}</p>
        <p className="mt-4 border-t border-gold/20 pt-4 text-sm leading-relaxed text-amber-100/80">
          {overview.unknown_note ?? ''}
        </p>
      </section>

      <div className="mt-10 space-y-8">
        {guides.map((guide) => {
          const names = guideNames[guide.slug];
          const officialName = names?.en || OFFICIAL_TOOL_NAMES[guide.slug] || guide.slug;
          const arabicName = names?.ar;
          return (
            <section
              key={guide.slug}
              className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8"
            >
              <div className="flex flex-wrap items-baseline gap-2.5">
                <h2 className="font-heading text-2xl font-bold text-emerald-400">{officialName}</h2>
                {lang === 'ar' && arabicName && arabicName !== officialName && (
                  <span className="text-sm font-medium text-slate-400">({arabicName})</span>
                )}
              </div>

              {(
                [
                  ['eligibility', labels.eligibility ?? (lang === 'ar' ? 'الأهلية' : 'Eligibility')],
                  [
                    'registration',
                    labels.registration ??
                      (lang === 'ar' ? 'التسجيل والموعد النهائي' : 'Registration and deadline'),
                  ],
                  [
                    'limitations',
                    labels.limitations ?? (lang === 'ar' ? 'القيود والرسوم' : 'Limits and fees'),
                  ],
                  [
                    'after_expiry',
                    labels.after_expiry ??
                      (lang === 'ar' ? 'بعد انتهاء المنفعة' : 'After the benefit ends'),
                  ],
                ] as [GuideSectionKey, string][]
              ).map(([key, label]) => {
                const section = guide.sections[key];
                return (
                  <div key={key} className="mt-5">
                    <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-slate-400">
                      {label}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-300">{section[lang]}</p>
                  </div>
                );
              })}

              <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-800 pt-4">
                {Array.from(
                  new Set(
                    Object.values(guide.sections)
                      .flatMap((s) => s.sources.map((u) => safeUrl(u)).filter((u): u is string => !!u))
                  )
                ).map((url) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-emerald-300 transition-colors hover:bg-slate-700"
                  >
                    <bdi className="truncate">{url}</bdi>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}

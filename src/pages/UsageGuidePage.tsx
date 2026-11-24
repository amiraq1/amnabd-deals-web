import { CalendarDays, ExternalLink } from 'lucide-react';
import type { GuideSectionKey, SiteConfig, UsageGuide } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { safeDealUrl } from '@/lib/safeUrl';
import { reviewDateLabel } from '@/lib/format';
import { OFFICIAL_TOOL_NAMES } from '@/lib/dealMetadata';

interface UsageGuidePageProps {
  guides: UsageGuide[];
  config: SiteConfig | null;
  guideNames: Record<string, { ar: string; en: string }>;
  loading: boolean;
}

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand';

export default function UsageGuidePage({ guides, config, guideNames, loading }: UsageGuidePageProps) {
  const { lang } = useLanguage();
  const overview = config?.overview?.[lang] ?? {};
  const labels = config?.section_labels?.[lang] ?? {};

  if (loading) {
    return (
      <main
        className="mx-auto max-w-4xl px-4 py-10 sm:px-6"
        aria-busy="true"
        aria-label={lang === 'ar' ? 'جارٍ تحميل الدليل' : 'Loading guide'}
      >
        <div className="skeleton h-32 w-full rounded-card" />
        <div className="skeleton mt-6 h-96 w-full rounded-card" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 pb-12 pt-10 sm:px-6">
      <header className="animate-fade-up">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-stone-100 sm:text-3xl">
          {overview.title ?? (lang === 'ar' ? 'دليل التسجيل وفهم قيود العروض' : 'Offer registration and limitations guide')}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-stone-300">{overview.intro ?? ''}</p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-md border border-line bg-surface-raised px-3 py-1.5 text-xs text-stone-400">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            {overview.last_reviewed_label ?? ''}: <bdi className="tabular-nums">{reviewDateLabel(config?.last_reviewed, lang)}</bdi>
          </span>
        </div>
      </header>

      <section className="animate-fade-up mt-8 rounded-card border border-line bg-surface-raised shadow-card p-5 sm:p-6">
        <h2 className="font-heading text-base font-bold text-stone-100 sm:text-lg">
          {overview.distinction_title ?? ''}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-300">{overview.distinction ?? ''}</p>
        <p className="mt-4 border-t border-line-subtle pt-4 text-xs leading-relaxed text-stone-400">
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
              className="rounded-card border border-line bg-surface-raised shadow-card p-6 sm:p-8"
            >
              <div className="flex flex-wrap items-baseline gap-2.5">
                <h2 className="font-heading text-xl font-bold tracking-tight text-stone-100 sm:text-2xl">
                  {officialName}
                </h2>
                {lang === 'ar' && arabicName && arabicName !== officialName && (
                  <span className="text-sm font-medium text-stone-400">({arabicName})</span>
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
                  <div key={key} className="mt-5 border-t border-line-subtle pt-4">
                    <h3 className="font-heading text-xs font-semibold uppercase tracking-wider text-stone-400">
                      {label}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-stone-300">{section[lang]}</p>
                  </div>
                );
              })}

              <div className="mt-6 flex flex-wrap gap-2 border-t border-line-subtle pt-4">
                {Array.from(
                  new Set(
                    Object.values(guide.sections)
                      .flatMap((s) => s.sources.map((u) => safeDealUrl(u)).filter((u): u is string => !!u))
                  )
                ).map((url) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex max-w-full items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs text-stone-300 transition-colors hover:border-line-hover hover:text-stone-100 ${focusRing}`}
                  >
                    <bdi className="truncate">{url}</bdi>
                    <ExternalLink className="h-3 w-3 shrink-0 rtl:-scale-x-100" aria-hidden="true" />
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

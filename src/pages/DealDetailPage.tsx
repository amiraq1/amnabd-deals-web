import { useEffect, useRef } from 'react';
import CopyDealLink from '@/components/CopyDealLink';
import EvidenceBadge from '@/components/EvidenceBadge';
import { offerTimingLabel } from '@/lib/evidence';
import { Sparkles, ExternalLink, FileText, ShieldCheck, CircleAlert } from 'lucide-react';
import type { Deal, UsageGuide } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import {
  benefitAmount,
  durationLabel,
  frequencyLabel,
  benefitTypeLabel,
  reviewDateLabel,
} from '@/lib/format';
import { requirementLabel } from '@/lib/tristate';
import { safeUrl, resolveDealOfficialUrl } from '@/lib/safeUrl';
import InfoBanner from '@/components/InfoBanner';
import { getDealDisplayName } from '@/lib/dealMetadata';
import { getTimingState } from '@/lib/dealTiming';
import DealIcon from '@/components/DealIcon';
import ScrollToTop from '@/components/ScrollToTop';
import FavoriteButton from '@/components/FavoriteButton';
import ReportDealBox from '@/components/ReportDealBox';
import { filterActivationGuide } from '@/lib/activationGuideSafety';
import { unknownFieldLabel } from '@/lib/unknownFieldLabels';
import { ActivationGuide } from '@/components/ActivationGuide';

interface DealDetailPageProps {
  deal: Deal;
  guide: UsageGuide | null;
  sectionLabels: Record<string, string>;
  onBack: () => void;
  onToggleComparison: (slug: string) => void;
  comparisonSelected: boolean;
  comparisonDisabled: boolean;
}

export default function DealDetailPage({
  deal,
  guide,
  sectionLabels,
  onBack,
  onToggleComparison,
  comparisonSelected,
  comparisonDisabled,
}: DealDetailPageProps) {
  const { lang, dir } = useLanguage();

  const displayName = getDealDisplayName(deal);
  const description = lang === 'ar' ? deal.description_ar : deal.description_en;
  const offerUrl = resolveDealOfficialUrl(deal);
  const firstBenefit = deal.benefits[0];

  const mobileBar = useRef<HTMLElement>(null);
  useEffect(() => {
    const bar = mobileBar.current;
    if (!bar) return;
    const root = document.documentElement;
    const property = '--amnabd-mobile-actions-height';
    const previous = root.style.getPropertyValue(property);
    const measure = () =>
      root.style.setProperty(property, `${Math.ceil(bar.getBoundingClientRect().height)}px`);
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(bar, { box: 'border-box' });
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
      if (previous) root.style.setProperty(property, previous);
      else root.style.removeProperty(property);
    };
  }, []);

  // The document metadata for this route is applied once in App.tsx (A12), so
  // leaving the page restores the destination's canonical and JSON-LD.

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#how-to-activate') {
      const timer = setTimeout(() => {
        const el = document.getElementById('how-to-activate');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [deal.slug]);

  const e = deal.eligibility;
  // One timing model (PR-2). A recorded `ends_at` in the past expires the
  // offer even when the raw review status still reads "active", so the page
  // must not print `offer_status` on its own.
  const timing = getTimingState(deal, new Date());
  const unknownCount = deal.review.unknown_fields.length;
  const unknownFieldNames = deal.review.unknown_fields.map((field) => unknownFieldLabel(field, lang));
  const activationGuide = filterActivationGuide(guide?.activation, deal.review.unknown_fields);

  return (
    <>
      {/* Mounted only on detail routes. Compensate the actual bar height even at
          large text/safe-area sizes, including the Footer outside this component. */}
      <style>{`@media (max-width: 639px) {
        .deal-detail-content { padding-bottom: calc(var(--amnabd-mobile-actions-height, 7rem) + 1rem); }
        footer { padding-bottom: calc(var(--amnabd-mobile-actions-height, 7rem) + 1rem); }
      }`}</style>
      <main className="deal-detail-content mx-auto max-w-4xl px-4 pb-8 pt-8 sm:px-6 [overflow-wrap:anywhere]">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-white"
        >
          {dir === 'rtl' ? <ArrowRTL /> : <ArrowLTR />}
          {lang === 'ar' ? 'كل العروض' : 'All deals'}
        </button>

        <header className="animate-fade-up mt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-3.5">
              <DealIcon deal={deal} size="lg" className="shrink-0" />
              <div className="min-w-0 flex-1">
                <h1 className="font-heading text-3xl font-extrabold text-white [overflow-wrap:anywhere]">{displayName}</h1>
                {lang === 'ar' && deal.name_ar && deal.name_ar !== displayName && (
                  <p className="mt-0.5 text-sm font-medium text-slate-400 [overflow-wrap:anywhere]">{deal.name_ar}</p>
                )}
              </div>
            </div>
            <EvidenceBadge
              status={deal.review.verification_status}
              reviewedOn={deal.review.reviewed_on}
              lang={lang}
            />
          </div>

          <p className="mt-4 text-base leading-relaxed text-slate-300">{description}</p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {offerUrl && (
              <a
                href={offerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-950/40 transition-all hover:bg-emerald-400"
              >
                <bdi>{lang === 'ar' ? 'رابط المصدر' : 'Source link'}</bdi>
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
            {!offerUrl && (
              <span
                aria-disabled="true"
                className="inline-flex min-h-11 items-center rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-400"
              >
                {lang === 'ar' ? 'رابط المصدر غير متاح' : 'Source link unavailable'}
              </span>
            )}

            <FavoriteButton slug={deal.slug} dealName={displayName} showText={true} />

            <button
              type="button"
              aria-pressed={comparisonSelected}
              disabled={comparisonDisabled}
              onClick={() => onToggleComparison(deal.slug)}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-emerald-500/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {comparisonSelected
                ? lang === 'ar'
                  ? 'إزالة من المقارنة'
                  : 'Remove from comparison'
                : lang === 'ar'
                  ? 'أضف للمقارنة'
                  : 'Add to comparison'}
            </button>

            <CopyDealLink key={deal.slug} slug={deal.slug} />

            {activationGuide && (
              <a
                href="#how-to-activate"
                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:border-emerald-500/50 hover:bg-emerald-500/20 active:scale-95"
              >
                <Sparkles className="h-4 w-4" />
                <bdi>{lang === 'ar' ? 'طريقة التفعيل' : 'Activation guide'}</bdi>
              </a>
            )}
          </div>
          <p className="mt-3 text-sm text-slate-400">
            {lang === 'ar' ? 'الحفظ محلي في هذا المتصفح فقط.' : 'Saves stay in this browser only.'}
          </p>
        </header>



        <section
          aria-labelledby="deal-truth-heading"
          className="mt-8 rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 via-slate-900/50 to-slate-900/30 p-5 shadow-lg sm:p-7"
        >
          <div className="mb-5">
            <h2 id="deal-truth-heading" className="font-heading text-xl font-bold text-white sm:text-2xl">
              {lang === 'ar' ? 'ماذا نعرف وماذا لا نعرف؟' : 'What We Know and What Remains Unknown'}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              {lang === 'ar'
                ? 'ملخص شروط الأهلية وسجل المراجعة كما تثبتها الأدلة. راجع هذه المعلومات قبل اتباع أي دليل.'
                : 'A summary of eligibility and review facts supported by evidence. Check it before following any guide.'}
            </p>
          </div>
          <section className="mt-5 grid min-w-0 gap-4 sm:grid-cols-2">
            <div className="min-w-0 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-slate-400">
                {lang === 'ar' ? 'شروط الأهلية' : 'Eligibility facts'}
              </h3>
              <dl className="mt-4 space-y-2.5 text-sm">
                <FactRow
                  label={lang === 'ar' ? 'حالة الطالب' : 'Student status'}
                  value={requirementLabel(e.student_status, lang)}
                />
                <FactRow
                  label={lang === 'ar' ? 'حساب جديد' : 'New account'}
                  value={requirementLabel(e.new_account, lang)}
                />
                <FactRow
                  label={lang === 'ar' ? 'بطاقة ائتمان' : 'Credit card'}
                  value={requirementLabel(e.card_required, lang)}
                />
                <FactRow
                  label={lang === 'ar' ? 'هاتف' : 'Phone'}
                  value={requirementLabel(e.phone_required, lang)}
                />
              </dl>
              <p className="mt-4 text-xs leading-relaxed text-slate-400">{e.conditions[lang]}</p>
            </div>

            <div className="min-w-0 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-slate-400">
                {lang === 'ar' ? 'المنافع' : 'Benefits'}
              </h3>
              <ul className="mt-4 space-y-4">
                {deal.benefits.map((b, i) => (
                  <li key={i} className="text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-300">
                        <bdi>{benefitTypeLabel(b.type, lang)}</bdi>
                      </span>
                      <span className="font-semibold text-white">
                        <bdi>{benefitAmount(b.amount, lang)}</bdi>
                      </span>
                      <span className="text-xs text-slate-400">
                        <bdi>{durationLabel(b.duration, lang)}</bdi>
                      </span>
                      {frequencyLabel(b.frequency, lang) && (
                        <span className="rounded-md bg-gold/10 px-2 py-0.5 text-xs text-gold">
                          <bdi>{frequencyLabel(b.frequency, lang)}</bdi>
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 leading-relaxed text-slate-300">{b.description[lang]}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {unknownCount > 0 && (
            <section className="mt-8">
              <InfoBanner
                kind="info"
                textClassName="min-w-0 [overflow-wrap:anywhere]"
                text={
                  lang === 'ar'
                    ? `حقول غير مثبتة بالأدلة (${unknownCount.toLocaleString('ar-EG')}): ${unknownFieldNames.join('، ')}. تعني «غير معلوم» أن المصادر المتاحة لا تؤكد القيمة أو القاعدة.`
                    : `Fields not established by evidence (${unknownCount}): ${unknownFieldNames.join(', ')}. “Unknown” means the available sources do not confirm the value or rule.`
                }
              />
            </section>
          )}

          <p className="mt-6 text-xs text-slate-400">
            {lang === 'ar'
              ? `حقول مسجلة غير مثبتة: ${unknownCount.toLocaleString('ar-EG')}. عددها لا يثبت اكتمال المعلومات، ودعم المصدر لا يضمن استمرار العرض أو الأهلية.`
              : `Recorded unestablished fields: ${unknownCount}. This count does not prove completeness; source support does not guarantee availability or eligibility.`}
          </p>

          <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="font-heading flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
              <ShieldCheck className="h-4 w-4" />
              {lang === 'ar' ? 'المصادر والأدلة' : 'Sources and evidence'}
            </h3>
            <div className="mt-4 space-y-5">
              {deal.official_sources.map((src, i) => (
                <div key={i} className="min-w-0">
                  <a
                    href={safeUrl(src.url) ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(ev) => {
                      if (!safeUrl(src.url)) ev.preventDefault();
                    }}
                    className="inline-flex max-w-full items-center gap-1.5 text-sm font-medium text-emerald-400 hover:text-emerald-300"
                  >
                    <bdi className="min-w-0 [overflow-wrap:anywhere]">{src.title}</bdi>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  {src.context && (
                    <p className="mt-1 text-xs italic leading-relaxed text-slate-400">
                      {src.context}
                    </p>
                  )}
                  <ul className="mt-2 space-y-1.5">
                    {src.claims.map((claim, j) => (
                      <li
                        key={j}
                        className="flex items-start gap-2 text-xs leading-relaxed text-slate-400"
                      >
                        <FileText className="mt-0.5 h-3 w-3 shrink-0 text-slate-600" />
                        <span className="min-w-0 [overflow-wrap:anywhere]">{claim.evidence}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="mt-5 border-t border-slate-800 pt-4 text-xs text-slate-400">
              {lang === 'ar' ? 'تاريخ المراجعة' : 'Reviewed on'}:{' '}
              <bdi>{reviewDateLabel(deal.review.reviewed_on, lang)}</bdi>
              {' · '}
              {lang === 'ar' ? 'حالة العرض' : 'Offer status'}:{' '}
              <span className="text-slate-300">
                {offerTimingLabel(timing.offer, deal.review.offer_status, lang)}
              </span>
            </p>
          </section>

          <section className="mt-8 min-w-0 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-slate-400">
              {lang === 'ar' ? 'ملاحظات المراجعة' : 'Review notes'}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">{deal.review.notes[lang]}</p>
          </section>
        </section>

        {guide && (
          <section className="mt-10">
            <h2 className="font-heading text-xl font-bold text-white">
              {sectionLabels.eligibility ?? (lang === 'ar' ? 'الأهلية' : 'Eligibility')}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              {guide.sections.eligibility[lang]}
            </p>

            <h2 className="font-heading mt-8 text-xl font-bold text-white">
              {sectionLabels.registration ??
                (lang === 'ar' ? 'التسجيل والموعد النهائي' : 'Registration and deadline')}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              {guide.sections.registration[lang]}
            </p>

            <h2 className="font-heading mt-8 text-xl font-bold text-white">
              {sectionLabels.limitations ?? (lang === 'ar' ? 'القيود والرسوم' : 'Limits and fees')}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              {guide.sections.limitations[lang]}
            </p>

            <h2 className="font-heading mt-8 text-xl font-bold text-white">
              {sectionLabels.after_expiry ??
                (lang === 'ar' ? 'بعد انتهاء المنفعة' : 'After the benefit ends')}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              {guide.sections.after_expiry[lang]}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {Array.from(
                new Set(
                  Object.values(guide.sections).flatMap((s) =>
                    s.sources.map((u) => safeUrl(u)).filter((u): u is string => !!u)
                  )
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
        )}

        {activationGuide && <ActivationGuide guide={activationGuide} officialUrl={offerUrl} />}

        <ReportDealBox key={deal.slug} dealSlug={deal.slug} />
      </main>

      {/* Sticky Mobile Action Bar */}
      <aside
        ref={mobileBar}
        aria-label={lang === 'ar' ? 'إجراءات العرض السريعة' : 'Quick deal actions'}
        className="sm:hidden fixed inset-x-0 bottom-0 z-40 border-t border-slate-800 bg-slate-950/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-2xl backdrop-blur-md"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 basis-28 flex-1">
            <h2 className="truncate text-sm font-bold text-white">{displayName}</h2>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              {firstBenefit ? (
                <span className="truncate text-emerald-400 font-medium">
                  <bdi>{benefitTypeLabel(firstBenefit.type, lang)}</bdi>
                  {' · '}
                  <bdi>{benefitAmount(firstBenefit.amount, lang)}</bdi>
                </span>
              ) : (
                <span className="truncate text-slate-400">
                  {lang === 'ar' ? 'البطاقة: ' : 'Card: '}
                  {requirementLabel(e.card_required, lang)}
                </span>
              )}
            </div>
          </div>

          <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
            <FavoriteButton
              slug={deal.slug}
              dealName={displayName}
              className="rounded-xl border border-slate-800 bg-slate-900"
            />

            {offerUrl ? (
              <a
                href={offerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-md transition-all hover:bg-emerald-400 active:scale-95"
              >
                <bdi>{lang === 'ar' ? 'رابط المصدر' : 'Source link'}</bdi>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : (
              <span
                aria-disabled="true"
                className="inline-flex min-h-11 min-w-0 max-w-full items-center gap-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-400"
              >
                <CircleAlert aria-hidden="true" className="h-4 w-4 shrink-0" />
                {lang === 'ar' ? 'رابط المصدر غير متاح' : 'Source link unavailable'}
              </span>
            )}
          </div>
        </div>
      </aside>

      <ScrollToTop hasBottomBar />
    </>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <dt className="text-slate-400">{label}</dt>
      <dd
        className={`font-medium ${
          value === 'Unknown' || value === 'غير معلوم' ? 'text-slate-400' : 'text-slate-100'
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function ArrowRTL() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowLTR() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

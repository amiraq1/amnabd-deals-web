import { ExternalLink, BadgeCheck, CircleAlert, FileText, ShieldCheck } from 'lucide-react';
import type { Deal, UsageGuide } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import {
  benefitAmount,
  durationLabel,
  frequencyLabel,
  benefitTypeLabel,
} from '@/lib/format';
import { tristateLabel } from '@/lib/tristate';
import { safeUrl, resolveDealOfficialUrl } from '@/lib/safeUrl';
import InfoBanner from '@/components/InfoBanner';

interface DealDetailPageProps {
  deal: Deal;
  guide: UsageGuide | null;
  sectionLabels: Record<string, string>;
  onBack: () => void;
}

export default function DealDetailPage({
  deal,
  guide,
  sectionLabels,
  onBack,
}: DealDetailPageProps) {
  const { lang, dir } = useLanguage();
  const name = lang === 'ar' ? deal.name_ar : deal.name_en;
  const description = lang === 'ar' ? deal.description_ar : deal.description_en;
  const offerUrl = resolveDealOfficialUrl(deal);

  const e = deal.eligibility;

  const unknownCount = deal.review.unknown_fields.length;

  return (
    <main className="mx-auto max-w-4xl px-4 pb-8 pt-8 sm:px-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-white"
      >
        {dir === 'rtl' ? <ArrowRTL /> : <ArrowLTR />}
        {lang === 'ar' ? 'كل العروض' : 'All deals'}
      </button>

      <header className="animate-fade-up mt-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-3xl font-extrabold text-white">{name}</h1>
          {deal.review.verification_status === 'supported' ? (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
              <BadgeCheck className="h-4 w-4" />
              {lang === 'ar' ? 'موثق رسميًا' : 'Officially verified'}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full bg-gold/10 px-3 py-1 text-xs font-medium text-gold">
              <CircleAlert className="h-4 w-4" />
              {lang === 'ar' ? 'مدعوم جزئيًا' : 'Partially supported'}
            </span>
          )}
        </div>
        <p className="mt-3 text-base leading-relaxed text-slate-300">{description}</p>
        {offerUrl && (
          <a
            href={offerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-950/40 transition-all hover:bg-emerald-400"
          >
            <bdi>{lang === 'ar' ? 'المصدر الرسمي' : 'Official Source'}</bdi>
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </header>

      {guide && (
        <section className="mt-10">
          <h2 className="font-heading text-xl font-bold text-white">
            {sectionLabels.eligibility ?? (lang === 'ar' ? 'الأهلية' : 'Eligibility')}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">{guide.sections.eligibility[lang]}</p>

          <h2 className="font-heading mt-8 text-xl font-bold text-white">
            {sectionLabels.registration ?? (lang === 'ar' ? 'التسجيل والموعد النهائي' : 'Registration and deadline')}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">{guide.sections.registration[lang]}</p>

          <h2 className="font-heading mt-8 text-xl font-bold text-white">
            {sectionLabels.limitations ?? (lang === 'ar' ? 'القيود والرسوم' : 'Limits and fees')}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">{guide.sections.limitations[lang]}</p>

          <h2 className="font-heading mt-8 text-xl font-bold text-white">
            {sectionLabels.after_expiry ?? (lang === 'ar' ? 'بعد انتهاء المنفعة' : 'After the benefit ends')}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">{guide.sections.after_expiry[lang]}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {Array.from(
              new Set(
                Object.values(guide.sections).flatMap((s) => s.sources.map((u) => safeUrl(u)).filter((u): u is string => !!u))
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

      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-slate-400">
            {lang === 'ar' ? 'شروط الأهلية' : 'Eligibility facts'}
          </h3>
          <dl className="mt-4 space-y-2.5 text-sm">
            <FactRow
              label={lang === 'ar' ? 'حالة الطالب' : 'Student status'}
              value={tristateLabel(e.student_status === 'required' ? 'yes' : 'unknown', lang)}
            />
            <FactRow
              label={lang === 'ar' ? 'حساب جديد' : 'New account'}
              value={tristateLabel(e.new_account, lang)}
            />
            <FactRow
              label={lang === 'ar' ? 'بطاقة ائتمان' : 'Credit card'}
              value={tristateLabel(e.card_required, lang)}
            />
            <FactRow
              label={lang === 'ar' ? 'هاتف' : 'Phone'}
              value={tristateLabel(e.phone_required, lang)}
            />
          </dl>
          <p className="mt-4 text-xs leading-relaxed text-slate-500">{e.conditions[lang]}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
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
            text={
              lang === 'ar'
                ? `حقول غير مثبتة بالأدلة (${unknownCount.toLocaleString('ar-EG')}): ${deal.review.unknown_fields.join('، ')}. تعني «غير معلوم» أن المصادر المتاحة لا تؤكد القيمة أو القاعدة.`
                : `Fields not established by evidence (${unknownCount}): ${deal.review.unknown_fields.join(', ')}. “Unknown” means the available sources do not confirm the value or rule.`
            }
          />
        </section>
      )}

      <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h3 className="font-heading flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
          <ShieldCheck className="h-4 w-4" />
          {lang === 'ar' ? 'المصادر الرسمية والأدلة' : 'Official sources and evidence'}
        </h3>
        <div className="mt-4 space-y-5">
          {deal.official_sources.map((src, i) => (
            <div key={i}>
              <a
                href={safeUrl(src.url) ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(ev) => {
                  if (!safeUrl(src.url)) ev.preventDefault();
                }}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400 hover:text-emerald-300"
              >
                <bdi>{src.title}</bdi>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              {src.context && (
                <p className="mt-1 text-xs italic leading-relaxed text-slate-500">{src.context}</p>
              )}
              <ul className="mt-2 space-y-1.5">
                {src.claims.map((claim, j) => (
                  <li key={j} className="flex items-start gap-2 text-xs leading-relaxed text-slate-400">
                    <FileText className="mt-0.5 h-3 w-3 shrink-0 text-slate-600" />
                    <span>{claim.evidence}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-5 border-t border-slate-800 pt-4 text-xs text-slate-500">
          {lang === 'ar' ? 'تاريخ المراجعة' : 'Reviewed on'}: <bdi>{deal.review.reviewed_on}</bdi>
          {' · '}
          {lang === 'ar' ? 'حالة العرض' : 'Offer status'}:{' '}
          <span className="text-slate-300">
            {deal.review.offer_status === 'unknown'
              ? lang === 'ar'
                ? 'غير معلوم'
                : 'Unknown'
              : deal.review.offer_status}
          </span>
        </p>
      </section>

      <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-slate-400">
          {lang === 'ar' ? 'ملاحظات المراجعة' : 'Review notes'}
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">{deal.review.notes[lang]}</p>
      </section>
    </main>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-400">{label}</dt>
      <dd
        className={`font-medium ${
          value === 'Unknown' || value === 'غير معلوم' ? 'text-slate-500' : 'text-slate-100'
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

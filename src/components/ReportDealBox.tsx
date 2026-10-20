import { useState } from 'react';
import { Flag, Check, AlertCircle, X } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import {
  hasRecentlyReported,
  REPORT_REASON_OPTIONS,
  submitDealReport,
  type ReportReason,
} from '@/lib/dealReports';

interface ReportDealBoxProps {
  dealSlug: string;
}

export default function ReportDealBox({ dealSlug }: ReportDealBoxProps) {
  const { lang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<ReportReason>('expired');
  const [note, setNote] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(() => hasRecentlyReported(dealSlug));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (submitted) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="mt-6 flex items-center gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-xs font-medium text-emerald-300"
      >
        <Check className="h-4 w-4 shrink-0 text-emerald-400" />
        <span>
          {lang === 'ar'
            ? 'شكرًا لك! تم تسجيل ملاحظتك حول هذا العرض وستتم مراجعته وتحديثه من المصدر الرسمي.'
            : 'Thank you! Your note has been recorded and will be reviewed against official sources.'}
        </span>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await submitDealReport({
        dealSlug,
        reason: selectedReason,
        note,
        honeypot,
      });
      setSubmitted(true);
      setIsOpen(false);
    } catch {
      setErrorMsg(
        lang === 'ar'
          ? 'تعذّر إرسال البلاغ حالياً، يرجى المحاولة لاحقاً.'
          : 'Unable to submit report right now. Please try again later.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
      {!isOpen ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Flag className="h-3.5 w-3.5 text-slate-500" />
            <span>
              {lang === 'ar'
                ? 'هل واجهت مشكلة في تفعيل هذا العرض أو لاحظت تغيّر شروطه؟'
                : 'Did you notice an issue activating this offer or changed terms?'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-1.5 text-xs font-medium text-slate-300 transition hover:border-amber-500/50 hover:text-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
          >
            {lang === 'ar' ? 'أبلغ عن تحديث أو مشكلة' : 'Report an update or issue'}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Flag className="h-3.5 w-3.5 text-amber-400" />
              {lang === 'ar'
                ? 'ما المشكلة التي لاحظتها في هذا العرض؟'
                : 'What issue did you encounter with this offer?'}
            </p>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
              aria-label={lang === 'ar' ? 'إلغاء' : 'Cancel'}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Quick reason options */}
          <div className="flex flex-wrap gap-2">
            {REPORT_REASON_OPTIONS.map((opt) => {
              const active = selectedReason === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelectedReason(opt.value)}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                    active
                      ? 'border-amber-500 bg-amber-500/15 text-amber-300 font-semibold shadow-sm shadow-amber-950/30'
                      : 'border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  {lang === 'ar' ? opt.label : opt.labelEn}
                </button>
              );
            })}
          </div>

          {/* Hidden honeypot anti-bot field */}
          <input
            type="text"
            name="website_url"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            className="hidden"
            aria-hidden="true"
          />

          <div>
            <input
              type="text"
              maxLength={280}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                lang === 'ar'
                  ? 'ملاحظة إضافية أو رابط التحديث الرسمي (اختياري)...'
                  : 'Optional additional note or official update link...'
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none transition focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20"
            />
          </div>

          {errorMsg && (
            <p className="flex items-center gap-1.5 text-xs text-rose-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-xl px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:text-slate-200"
            >
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl border border-amber-500/40 bg-amber-500/20 px-4 py-1.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/30 disabled:opacity-50"
            >
              {isSubmitting
                ? lang === 'ar'
                  ? 'جاري الإرسال...'
                  : 'Submitting...'
                : lang === 'ar'
                  ? 'إرسال البلاغ'
                  : 'Submit report'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

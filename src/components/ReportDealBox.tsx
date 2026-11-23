import { useEffect, useId, useRef, useState } from 'react';
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
  // REC-17: the note field needs an explicit label; the placeholder is a hint,
  // not an accessible name.
  const noteId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<ReportReason>('expired');
  // C2: restore a draft note from sessionStorage so a catalog-reload (which is
  // intentional — see App.tsx:52) does not silently discard the visitor's text.
  const draftKey = `amnabd:report-draft:${dealSlug}`;
  const [note, setNote] = useState(() => {
    try {
      return sessionStorage.getItem(draftKey) ?? '';
    } catch {
      return '';
    }
  });
  const [honeypot, setHoneypot] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(() => hasRecentlyReported(dealSlug));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // B2: receives programmatic focus after a successful submission so keyboard
  // and screen-reader users know the form state changed.
  const successRef = useRef<HTMLDivElement>(null);

  // B2: move focus to the confirmation banner as soon as it mounts.
  useEffect(() => {
    if (submitted) {
      successRef.current?.focus({ preventScroll: true });
    }
  }, [submitted]);

  if (submitted) {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className="mt-8 flex items-center gap-2.5 rounded-card border border-emerald-500/30 bg-emerald-950/20 p-4 text-xs font-medium text-emerald-300 outline-none"
      >
        <Check className="h-4 w-4 shrink-0 text-emerald-400" />
        <span>
          {lang === 'ar'
            ? 'شكرًا لك! تم تسجيل ملاحظتك حول هذا العرض وستتم مراجعته وتحديثه من رابط المصدر.'
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
      const result = await submitDealReport({
        dealSlug,
        reason: selectedReason,
        note,
        honeypot,
      });
      // Only a stored report earns the confirmation. Anything else keeps the
      // form open with an explicit error, because "thank you" would be false.
      if (!result.ok) {
        setErrorMsg(
          result.mode === 'unconfigured'
            ? lang === 'ar'
              ? 'خدمة استقبال البلاغات غير مُهيّأة حاليًا، لذلك لم يُسجَّل بلاغك. يرجى المحاولة لاحقًا.'
              : 'Report intake is not configured, so your report was not recorded. Please try again later.'
            : lang === 'ar'
              ? 'تعذّر إرسال البلاغ، ولم يُسجَّل بلاغك. يرجى المحاولة لاحقًا.'
              : 'The report could not be sent and was not recorded. Please try again later.'
        );
        return;
      }
      // C2: report stored — discard the saved draft.
      try {
        sessionStorage.removeItem(draftKey);
      } catch {
        // ignore private-browsing errors
      }
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
    <div className="mt-8 rounded-card border border-line bg-surface-raised p-5 sm:p-6 transition-all">
      {!isOpen ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <Flag className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <span>
              {lang === 'ar'
                ? 'هل واجهت مشكلة في تفعيل هذا العرض أو لاحظت تغيّر شروطه؟'
                : 'Did you notice an issue activating this offer or changed terms?'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="rounded-control border border-line bg-surface-overlay px-3.5 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:border-line-subtle hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand active:scale-[0.98]"
          >
            {lang === 'ar' ? 'أبلغ عن تحديث أو مشكلة' : 'Report an update or issue'}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-ink flex items-center gap-1.5">
              <Flag className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              {lang === 'ar'
                ? 'ما المشكلة التي لاحظتها في هذا العرض؟'
                : 'What issue did you encounter with this offer?'}
            </p>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-control p-1 text-ink-muted transition-colors hover:bg-surface-overlay hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
              aria-label={lang === 'ar' ? 'إلغاء' : 'Cancel'}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Quick reason options */}
          <fieldset>
            <legend className="sr-only">
              {lang === 'ar' ? 'سبب البلاغ' : 'Reason for the report'}
            </legend>
            <div className="flex flex-wrap gap-2">
              {REPORT_REASON_OPTIONS.map((opt) => {
                const active = selectedReason === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelectedReason(opt.value)}
                    className={`rounded-control border px-3 py-1.5 text-xs font-medium transition active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand ${
                      active
                        ? 'border-amber-500/60 bg-amber-500/15 text-amber-300 font-semibold'
                        : 'border-line bg-surface-overlay text-ink-muted hover:border-line-subtle hover:text-ink'
                    }`}
                  >
                    {lang === 'ar' ? opt.label : opt.labelEn}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Hidden honeypot anti-bot field — D3: name must be non-semantic
              (not website_url / email / phone) to avoid browser autofill. */}
          <input
            type="text"
            name="org_ref"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            className="hidden"
            aria-hidden="true"
          />

          <div>
            <label htmlFor={noteId} className="sr-only">
              {lang === 'ar' ? 'ملاحظة إضافية أو رابط التحديث (اختياري)' : 'Optional note or update link'}
            </label>
            <input
              id={noteId}
              type="text"
              maxLength={280}
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                // C2: persist draft so a forced catalog-reload does not lose text.
                try {
                  if (e.target.value) {
                    sessionStorage.setItem(draftKey, e.target.value);
                  } else {
                    sessionStorage.removeItem(draftKey);
                  }
                } catch {
                  // ignore private-browsing errors
                }
              }}
              placeholder={
                lang === 'ar'
                  ? 'ملاحظة إضافية أو رابط التحديث (اختياري)...'
                  : 'Optional additional note or official update link...'
              }
              className="w-full rounded-control border border-line bg-canvas px-3.5 py-2 text-xs text-ink placeholder-ink-faint outline-none transition focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 focus-visible:outline-none"
            />
            <p role="note" className="mt-2 text-xs text-amber-300">
              {lang === 'ar'
                ? 'لا تُدخل معلومات شخصية في نص البلاغ.'
                : 'Do not include personal information in your report.'}
            </p>
          </div>

          {errorMsg && (
            <p role="alert" className="flex items-center gap-1.5 text-xs text-rose-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-control px-3 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
            >
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-control border border-amber-500/40 bg-amber-500/20 px-4 py-1.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/30 active:scale-[0.98] disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
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

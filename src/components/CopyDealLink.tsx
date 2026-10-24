import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { buildDealLink, copyLink } from '@/lib/share';

export default function CopyDealLink({ slug }: { slug: string }) {
  const { lang } = useLanguage();
  const [status, setStatus] = useState<'idle' | 'copying' | 'success' | 'manual'>('idle');
  const [link, setLink] = useState('');
  const mounted = useRef(false);
  const pending = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (status !== 'success') return;
    const timer = window.setTimeout(() => setStatus('idle'), 4000);
    return () => window.clearTimeout(timer);
  }, [status]);

  async function copy() {
    if (pending.current) return;
    const url = buildDealLink(window.location.href, slug, lang);
    if (!url) return;
    pending.current = true;
    setLink(url);
    setStatus('copying');
    let ok = false;
    try {
      const clipboard = navigator.clipboard;
      ok = await copyLink(url, clipboard?.writeText?.bind(clipboard));
    } catch {
      /* The clipboard getter may itself be denied. */
    }
    pending.current = false;
    if (mounted.current) setStatus(ok ? 'success' : 'manual');
  }

  return (
    <div className="mt-4 max-w-full">
      <button
        type="button"
        onClick={copy}
        disabled={status === 'copying'}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 hover:border-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400 disabled:opacity-60"
      >
        {status === 'success' ? (
          <Check aria-hidden="true" className="h-4 w-4" />
        ) : (
          <Copy aria-hidden="true" className="h-4 w-4" />
        )}
        {lang === 'ar' ? 'نسخ رابط العرض' : 'Copy deal link'}
      </button>
      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={
          status === 'success'
            ? 'mt-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200'
            : 'mt-2 text-sm text-slate-300'
        }
      >
        {status === 'success'
          ? lang === 'ar'
            ? 'تم نسخ رابط العرض.'
            : 'Deal link copied.'
          : status === 'manual'
            ? lang === 'ar'
              ? 'تعذر النسخ التلقائي. انسخ الرابط من الحقل التالي.'
              : 'Automatic copying was unavailable. Copy the link from the field below.'
            : ''}
      </p>
      {status === 'manual' && (
        <label className="mt-2 block text-sm text-slate-300">
          {lang === 'ar' ? 'رابط العرض للنسخ اليدوي' : 'Deal link for manual copying'}
          <input
            type="text"
            readOnly
            value={link}
            dir="ltr"
            onFocus={(event) => event.currentTarget.select()}
            className="mt-2 min-h-11 w-full rounded-lg border border-slate-600 bg-slate-950 p-3 text-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400"
          />
        </label>
      )}
    </div>
  );
}

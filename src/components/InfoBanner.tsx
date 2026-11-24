import { AlertTriangle, CheckCircle2, HelpCircle, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { safeUrl } from '@/lib/safeUrl';

interface InfoBannerProps {
  kind: 'warning' | 'success' | 'info';
  text: string;
  sourceUrl?: string;
  textClassName?: string;
}

export default function InfoBanner({ kind, text, sourceUrl, textClassName = '' }: InfoBannerProps) {
  const { lang } = useLanguage();
  const validSourceUrl = sourceUrl ? safeUrl(sourceUrl) : null;

  const styles = {
    warning: {
      wrap: 'border-amber-500/30 bg-surface-raised',
      icon: <AlertTriangle className="h-5 w-5 text-amber-400" aria-hidden="true" />,
    },
    success: {
      wrap: 'border-brand/40 bg-surface-raised',
      icon: <CheckCircle2 className="h-5 w-5 text-brand" aria-hidden="true" />,
    },
    info: {
      wrap: 'border-line bg-surface-raised',
      icon: <HelpCircle className="h-5 w-5 text-stone-400" aria-hidden="true" />,
    },
  }[kind];

  return (
    <div className={`flex items-start gap-3 rounded-card border p-4 ${styles.wrap}`}>
      <span className="mt-0.5 shrink-0">{styles.icon}</span>
      <p className={`flex-1 text-sm leading-relaxed text-stone-200 ${textClassName}`}>{text}</p>
      {validSourceUrl && (
        <a
          href={validSourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-stone-200 underline underline-offset-4 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
        >
          {lang === 'ar' ? 'المصدر' : 'Source'}
          <ExternalLink className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden="true" />
        </a>
      )}
    </div>
  );
}

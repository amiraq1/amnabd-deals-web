import { AlertTriangle, CheckCircle2, HelpCircle, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface InfoBannerProps {
  kind: 'warning' | 'success' | 'info';
  text: string;
  sourceUrl?: string;
  textClassName?: string;
}

export default function InfoBanner({ kind, text, sourceUrl, textClassName = '' }: InfoBannerProps) {
  const { lang } = useLanguage();

  const styles = {
    warning: {
      wrap: 'border-gold/40 bg-gold/5',
      icon: <AlertTriangle className="h-5 w-5 text-gold" />,
    },
    success: {
      wrap: 'border-brand/40 bg-brand/5',
      icon: <CheckCircle2 className="h-5 w-5 text-brand" />,
    },
    info: {
      wrap: 'border-slate-700 bg-slate-800/50',
      icon: <HelpCircle className="h-5 w-5 text-slate-400" />,
    },
  }[kind];

  return (
    <div className={`flex items-start gap-3 rounded-xl border p-4 ${styles.wrap}`}>
      <span className="mt-0.5 shrink-0">{styles.icon}</span>
      <p className={`flex-1 text-sm leading-relaxed text-slate-200 ${textClassName}`}>{text}</p>
      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-emerald-400 transition-colors hover:text-emerald-300"
        >
          {lang === 'ar' ? 'المصدر' : 'Source'}
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  );
}

import { FileCheck2, FileQuestion, FileX2, CircleHelp } from 'lucide-react';
import type { Lang } from '@/types';
import { evidenceLabel, evidenceStatus } from '@/lib/evidence';
import { reviewDateLabel } from '@/lib/format';
export default function EvidenceBadge({
  status,
  reviewedOn,
  lang,
}: {
  status: unknown;
  reviewedOn: string;
  lang: Lang;
}) {
  const state = evidenceStatus(status);
  const icons = {
    supported: FileCheck2,
    partial: FileQuestion,
    unsupported: FileX2,
    unknown: CircleHelp,
  };
  const Icon = icons[state];
  const tones = {
    supported: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-200',
    partial: 'border-amber-500/20 bg-amber-500/5 text-amber-200',
    unsupported: 'border-slate-600 bg-slate-800/40 text-slate-200',
    unknown: 'border-slate-700 bg-slate-800/40 text-ink-secondary',
  };
  return (
    <span
      className={`inline-flex min-w-0 max-w-full flex-col gap-1 rounded-xl border px-3 py-2 text-sm leading-relaxed ${tones[state]}`}
    >
      <span className="flex items-start gap-2">
        <Icon aria-hidden="true" className="mt-1 h-4 w-4 shrink-0" />
        <span>{evidenceLabel(status, lang)}</span>
      </span>
      <span className="text-ink-muted">
        {lang === 'ar' ? 'آخر مراجعة' : 'Last reviewed'}:{' '}
        <bdi>{reviewDateLabel(reviewedOn, lang)}</bdi>
      </span>
    </span>
  );
}

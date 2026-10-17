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
  const tones = {
    supported: 'bg-emerald-500/10 text-emerald-300',
    partial: 'bg-amber-500/10 text-amber-200',
    unsupported: 'bg-red-500/10 text-red-300',
    unknown: 'bg-slate-800 text-slate-300',
  };
  return (
    <span
      className={`inline-flex flex-col gap-1 rounded-lg px-2 py-1 text-xs ${tones[evidenceStatus(status)]}`}
    >
      <span>{evidenceLabel(status, lang)}</span>
      <span>
        {lang === 'ar' ? 'آخر مراجعة' : 'Last reviewed'}:{' '}
        <bdi>{reviewDateLabel(reviewedOn, lang)}</bdi>
      </span>
    </span>
  );
}

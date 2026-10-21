import type { Deal } from '@/types';
import { getDealDisplayName } from './dealMetadata.js';

export type ChangelogEventType = 'verified' | 'active' | 'ending_soon' | 'expired';

export interface ChangelogEntry {
  id: string;
  dealSlug: string;
  dealTitle: string;
  providerName: string;
  headlineValue?: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
  type: ChangelogEventType;
  summary: string;
  endsAt?: string | null;
}

export interface ChangelogGroup {
  date: string;
  entries: ChangelogEntry[];
}

// "verified" is a claim, so it requires the explicit status. An active deal
// without that field is listed as active — never as verified (audit H-11).
export function getChangelogEventType(deal: Deal): ChangelogEventType {
  if (deal.status === 'expired') return 'expired';
  if (deal.status === 'ending_soon') return 'ending_soon';
  return deal.review?.verification_status === 'verified' ? 'verified' : 'active';
}

export function buildChangelogSummary(deal: Deal, type: ChangelogEventType): string {
  if (type === 'expired') {
    return 'انتهت صلاحية العرض وتمت أرشفته للحفاظ على دقة الدليل.';
  }
  if (type === 'ending_soon') {
    return deal.ends_at
      ? `العرض يقترب من موعد انتهائه (${deal.ends_at}) — يُنصح بالتفعيل قبل الإغلاق.`
      : 'العرض في أيامه الأخيرة وفق المصدر.';
  }
  const cardNote =
    deal.eligibility?.card_required === 'not_required' ? ' (بدون بطاقة بنكية)' : '';
  const studentNote =
    deal.eligibility?.student_status === 'required' ? ' — مخصص للطلاب' : '';
  if (type === 'verified') {
    const reviewed = deal.review?.reviewed_on;
    return `تمت مراجعة العرض والتحقق منه من المصدر${
      reviewed ? ` (${reviewed})` : ''
    }${cardNote}${studentNote}.`;
  }
  return `العرض مُدرج كنشط وفق البيانات المسجّلة؛ حالة التوثيق غير مثبتة بعد${cardNote}${studentNote}.`;
}

export function buildChangelogEntries(deals: Deal[]): ChangelogEntry[] {
  const entries: ChangelogEntry[] = [];

  for (const deal of deals) {
    const rawDate = deal.review?.reviewed_on || deal.ends_at;
    if (!rawDate) continue;

    const timestamp = new Date(rawDate).getTime();
    if (Number.isNaN(timestamp)) continue;

    const type = getChangelogEventType(deal);
    const displayName = getDealDisplayName(deal);
    const title = deal.name_ar ? `${displayName} — ${deal.name_ar}` : displayName;

    entries.push({
      id: `${deal.slug}-${type}-${rawDate}`,
      dealSlug: deal.slug,
      dealTitle: title,
      providerName: displayName,
      headlineValue: deal.headline_value,
      date: rawDate.slice(0, 10),
      timestamp,
      type,
      summary: buildChangelogSummary(deal, type),
      endsAt: deal.ends_at,
    });
  }

  return entries.sort((a, b) => b.timestamp - a.timestamp);
}

export function groupChangelogByDate(entries: ChangelogEntry[]): ChangelogGroup[] {
  const map = new Map<string, ChangelogEntry[]>();

  for (const entry of entries) {
    const list = map.get(entry.date) ?? [];
    list.push(entry);
    map.set(entry.date, list);
  }

  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, groupedEntries]) => ({
      date,
      entries: groupedEntries,
    }));
}

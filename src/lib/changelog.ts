import type { Deal, Lang } from '@/types';
import { getDealDisplayName } from './dealMetadata.js';
import { getTimingState, offerExpiryInstant } from './dealTiming.js';
import { parseCalendarDate } from './instants.js';
import { routePath } from './routes.js';
import { isVerifiedReview } from './verification.js';

// Kept separate from history events: a current state is not a dated transition.
export type ChangelogEventType = 'verified' | 'active' | 'ending_soon' | 'expired';
export type ReviewHistoryEvent = 'review' | 'expired';

export interface ChangelogEntry {
  id: string;
  dealSlug: string;
  dealTitle: string;
  providerName: string;
  date: string; // Review calendar day, or the expiry instant's UTC day.
  timestamp: number;
  type: ChangelogEventType;
  event: ReviewHistoryEvent;
  summary: string;
  reviewNote?: string;
  timingNote?: string;
  endsAt?: string | null;
}

export interface ChangelogGroup {
  date: string;
  entries: ChangelogEntry[];
}

export function getChangelogEventType(
  deal: Deal,
  referenceNow: Date = new Date()
): ChangelogEventType {
  const { offer } = getTimingState(deal, referenceNow);
  if (offer.state === 'expired') return 'expired';
  if (offer.state === 'ending_soon') return 'ending_soon';
  return isVerifiedReview(deal.review) ? 'verified' : 'active';
}

export function buildChangelogSummary(
  deal: Deal,
  type: ChangelogEventType,
  lang: Lang = 'ar',
  referenceNow: Date = new Date()
): string {
  const expiresAt = offerExpiryInstant(deal.ends_at);
  // Isolate ISO dates inside RTL sentences without changing the recorded value.
  const endDateLabel = lang === 'ar' ? `\u2066${deal.ends_at}\u2069` : deal.ends_at;
  if (type === 'expired') {
    if (expiresAt !== null && expiresAt <= referenceNow.getTime()) {
      return lang === 'ar'
        ? `انقضى موعد انتهاء العرض المسجّل (${endDateLabel}).`
        : `The recorded offer end date has passed (${endDateLabel}).`;
    }
    return lang === 'ar'
      ? 'الحالة الحالية في السجل: منتهٍ؛ لا يوجد موعد انتهاء منقضٍ مسجّل لإسناد تاريخ الحدث.'
      : 'The current record marks this offer as expired; no elapsed end date is recorded to date the event.';
  }
  if (type === 'ending_soon') {
    return expiresAt !== null && expiresAt > referenceNow.getTime()
      ? lang === 'ar'
        ? `حالة الموعد الآن: ينتهي قريبًا وفق الموعد المسجّل (${endDateLabel}).`
        : `Current deadline status: ending soon per the recorded end date (${endDateLabel}).`
      : lang === 'ar'
        ? 'الحالة الحالية موسومة بأنها تنتهي قريبًا؛ موعد الانتهاء غير مسجّل.'
        : 'The current record is marked ending soon; no end date is recorded.';
  }
  // A review date and its notes are evidence of a review, not a field-level diff.
  return lang === 'ar'
    ? 'سُجّلت مراجعة لهذا العرض. لا تتوفر مقارنة محفوظة مع نسخة سابقة من الحقول.'
    : 'A review was recorded for this offer. No saved comparison with previous field values is available.';
}

export function reviewHistoryDealHref(slug: string, lang: Lang): string {
  return `${routePath({ name: 'deal', slug })}?lang=${lang}`;
}

export function buildChangelogEntries(
  deals: Deal[],
  lang: Lang = 'ar',
  referenceNow: Date = new Date()
): ChangelogEntry[] {
  const now = referenceNow.getTime();
  if (!Number.isFinite(now)) throw new RangeError('Invalid referenceNow');
  const entries: ChangelogEntry[] = [];

  for (const deal of deals) {
    const displayName = getDealDisplayName(deal);
    const title = (lang === 'ar' ? deal.name_ar : deal.name_en)?.trim() || displayName || deal.slug;
    const shared = {
      dealSlug: deal.slug,
      dealTitle: title,
      providerName: displayName,
      endsAt: deal.ends_at,
    };
    const reviewedOn = deal.review?.reviewed_on;
    const reviewedAt = parseCalendarDate(reviewedOn);
    const type = getChangelogEventType(deal, referenceNow);

    // Only the latest stored review is available. Neither created_at nor a
    // future deadline is substituted for an absent review date.
    if (reviewedAt !== null && reviewedAt <= now) {
      entries.push({
        ...shared,
        id: `${deal.slug}-review-${reviewedOn}`,
        date: new Date(reviewedAt).toISOString().slice(0, 10),
        timestamp: reviewedAt,
        type,
        event: 'review',
        summary: buildChangelogSummary(deal, 'active', lang, referenceNow),
        reviewNote: deal.review?.notes?.[lang]?.trim() || undefined,
        timingNote: type === 'expired' || type === 'ending_soon'
          ? buildChangelogSummary(deal, type, lang, referenceNow)
          : undefined,
      });
    }

    // A real expiry event needs an elapsed explicit ends_at, not a review date
    // or a manual status. Use the same instant (including date-only policy) as
    // dealTiming, and group explicit timezone offsets by their resolved UTC day.
    const expiresAt = offerExpiryInstant(deal.ends_at);
    if (expiresAt !== null && expiresAt <= now) {
      entries.push({
        ...shared,
        id: `${deal.slug}-expiry-${expiresAt}`,
        date: new Date(expiresAt).toISOString().slice(0, 10),
        timestamp: expiresAt,
        type: 'expired',
        event: 'expired',
        summary: buildChangelogSummary(deal, 'expired', lang, referenceNow),
      });
    }
  }

  // Stable sorting preserves the incoming newest-first order for same-day reviews.
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
    .map(([date, groupedEntries]) => ({ date, entries: groupedEntries }));
}

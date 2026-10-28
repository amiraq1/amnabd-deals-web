import type { Deal, Lang, Registration, SortOption } from '@/types';
import { parseCalendarDate, parseInstant } from './instants.js';
import { getTimingState } from './dealTiming.js';

// Re-exported for callers that still import the parsers from here.
export { parseCalendarDate, parseInstant } from './instants.js';

function recordedDate(value: unknown): { kind: 'calendar' | 'instant'; ms: number } | null {
  const calendar = parseCalendarDate(value);
  if (calendar !== null) return { kind: 'calendar', ms: calendar };
  const instant = parseInstant(value);
  return instant === null ? null : { kind: 'instant', ms: instant };
}
function referenceMs(referenceNow: Date): number {
  if (!(referenceNow instanceof Date) || !Number.isFinite(referenceNow.getTime()))
    throw new RangeError('Invalid referenceNow');
  return referenceNow.getTime();
}
export interface DeadlineTier {
  tier: 1 | 2 | 3 | 4;
  sortKey: number;
  kind: 'calendar' | 'instant' | 'unknown';
}
export function classifyDeadline(
  deadline: Registration['deadline'] | undefined,
  referenceNow: Date
): DeadlineTier {
  const ref = referenceMs(referenceNow);
  const unknown: DeadlineTier = { tier: 4, sortKey: 0, kind: 'unknown' };
  if (!deadline || deadline.status !== 'known') return unknown;
  const parsed = recordedDate(deadline.date);
  if (!parsed) return unknown;
  if (parsed.kind === 'instant')
    return { tier: parsed.ms >= ref ? 1 : 3, sortKey: parsed.ms, kind: 'instant' };
  const utcDay = parseCalendarDate(referenceNow.toISOString().slice(0, 10));
  if (utcDay === null) return unknown;
  // Midnight here is an artificial ordering key, never a claimed deadline hour.
  return { tier: parsed.ms >= utcDay ? 2 : 3, sortKey: parsed.ms, kind: 'calendar' };
}
export function deadlineTierLabel(
  deadline: Registration['deadline'],
  lang: Lang,
  referenceNow: Date
): string {
  const result = classifyDeadline(deadline, referenceNow);
  switch (result.tier) {
    case 1:
      return lang === 'ar' ? 'تاريخ ووقت تسجيل موثّقان' : 'Registration date and time recorded';
    case 2:
      return lang === 'ar'
        ? 'يوم التسجيل دون تحديد ساعة — مرجع UTC'
        : 'Calendar date without a specific hour — UTC reference';
    case 3:
      return result.kind === 'calendar'
        ? lang === 'ar'
          ? 'تاريخ التسجيل المسجّل أسبق من اليوم المرجعي UTC'
          : 'Recorded registration date is before the UTC reference day'
        : lang === 'ar'
          ? 'موعد التسجيل المسجّل قد مضى؛ لا يعني انتهاء العرض'
          : 'Recorded registration deadline has passed; this does not establish offer expiry';
    default:
      return lang === 'ar' ? 'موعد التسجيل: غير معلوم' : 'Registration deadline: Unknown';
  }
}
export function getDealNumericValue(deal: Deal): number | null {
  // 1. The first recorded benefit amount is an explicit credit figure.
  // Avoid comparing numeric amounts across different currencies:
  const amount = deal.benefits?.[0]?.amount;
  if (amount && (amount.currency === 'USD' || amount.unit === '$' || !amount.currency)) {
    const benefitValue = amount.value;
    if (typeof benefitValue === 'number' && benefitValue > 0) {
      return benefitValue;
    }
  }

  // 2. A headline that states an amount ("$1,000", "$100k") is explicit too.
  if (deal.headline_value) {
    const match = deal.headline_value.match(
      /(?:\$|USD|رصيد|بقيمة)\s*(\d[\d,.]*)\s*([kKmM])?|(\d[\d,.]*)\s*([kKmM])?\s*(?:\$|دولار|USD)/i
    );
    if (match) {
      const rawNumber = match[1] ?? match[3];
      const suffix = (match[2] ?? match[4] ?? '').toLowerCase();
      if (rawNumber) {
        const parsed = parseFloat(rawNumber.replace(/,/g, ''));
        if (!Number.isNaN(parsed)) {
          if (suffix === 'k') return parsed * 1_000;
          if (suffix === 'm') return parsed * 1_000_000;
          return parsed;
        }
      }
    }
  }

  // A discount is not a credit. `regular - offer` reported a paid price cut as
  // a free balance (audit C-01), so a deal with no recorded credit value has
  // no number to sort by.
  return null;
}

export function sortDeals(
  deals: readonly Deal[],
  sortBy: SortOption,
  referenceNow: Date
): Deal[] {
  referenceMs(referenceNow);
  if (sortBy === 'default') {
    // loadDeals supplies created_at DESC, id ASC. Keep that stable tie order
    // (including sub-millisecond precision) and never use review dates as age.
    return deals
      .map((deal, originalIndex) => ({
        deal,
        originalIndex,
        created: parseInstant(deal.created_at),
      }))
      .sort((a, b) => {
        if (a.created !== b.created) {
          if (a.created === null) return 1;
          if (b.created === null) return -1;
          return b.created - a.created;
        }
        return a.originalIndex - b.originalIndex;
      })
      .map((row) => row.deal);
  }

  const decorated = deals.map((deal, originalIndex) => ({
    deal,
    originalIndex,
    reviewed: recordedDate(deal.review?.reviewed_on),
    deadline: classifyDeadline(deal.registration?.deadline, referenceNow),
    offer: getTimingState(deal, referenceNow).offer,
  }));

  decorated.sort((a, b) => {
    // Offers that are over always sit at the end, whether the status says so or
    // the recorded ends_at has passed (PR-2: one model for both).
    const aOver = a.offer.state === 'expired';
    const bOver = b.offer.state === 'expired';
    if (aOver !== bOver) return aOver ? 1 : -1;

    switch (sortBy) {
      case 'highest_value': {
        // A deal with no proven credit value sorts after every deal that has
        // one, instead of being treated as a zero-value offer.
        const av = getDealNumericValue(a.deal);
        const bv = getDealNumericValue(b.deal);
        if (av !== bv) {
          if (av === null) return 1;
          if (bv === null) return -1;
          return bv - av;
        }
        break;
      }

      case 'ending_soon': {
        const rank = (offer: typeof a.offer) =>
          offer.state === 'ending_soon' ? 0 : offer.state === 'expired' ? 2 : 1;
        const byState = rank(a.offer) - rank(b.offer);
        if (byState !== 0) return byState;
        const aEnds = a.offer.expiresAt ?? Number.POSITIVE_INFINITY;
        const bEnds = b.offer.expiresAt ?? Number.POSITIVE_INFINITY;
        if (aEnds !== bEnds) return aEnds - bEnds;
        break;
      }

      case 'reviewed': {
        if (!a.reviewed || !b.reviewed) {
          const diff = Number(!a.reviewed) - Number(!b.reviewed);
          if (diff !== 0) return diff;
        } else {
          const diff = b.reviewed.ms - a.reviewed.ms;
          if (diff !== 0) return diff;
        }
        break;
      }

      case 'deadline': {
        const x = a.deadline,
          y = b.deadline;
        if (x.tier !== y.tier) return x.tier - y.tier;
        const delta = x.tier === 3 ? y.sortKey - x.sortKey : x.sortKey - y.sortKey;
        if (delta !== 0) return delta;
        break;
      }

      default:
        break;
    }

    return a.originalIndex - b.originalIndex;
  });

  return decorated.map((row) => row.deal);
}

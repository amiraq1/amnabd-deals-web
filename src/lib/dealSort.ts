import type { Deal, Lang, Registration, SortOption } from '@/types';

// UTC calendar parser, including years 0000..0099 without Date.UTC's 1900 remapping.
export function parseCalendarDate(value: unknown): number | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const year = Number(value.slice(0, 4)),
    month = Number(value.slice(5, 7)),
    day = Number(value.slice(8, 10));
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(0, 0, 0, 0);
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
    ? date.getTime()
    : null;
}

export function parseInstant(value: unknown): number | null {
  if (typeof value !== 'string') return null;
  const match =
    /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?(Z|([+-])(\d{2}):(\d{2}))$/.exec(
      value
    );
  if (!match) return null;
  const day = parseCalendarDate(match[1]);
  const hour = Number(match[2]),
    minute = Number(match[3]),
    second = Number(match[4] ?? 0);
  const offsetHour = Number(match[8] ?? 0),
    offsetMinute = Number(match[9] ?? 0);
  // -00:00 denotes an unknown offset; it is not an established timezone.
  if (
    day === null ||
    hour > 23 ||
    minute > 59 ||
    second > 59 ||
    offsetHour > 23 ||
    offsetMinute > 59 ||
    match[6] === '-00:00'
  )
    return null;
  const offset = (match[7] === '-' ? -1 : 1) * (offsetHour * 60 + offsetMinute) * 60000;
  const ms = Number((match[5] ?? '').padEnd(3, '0').slice(0, 3));
  const result = day + ((hour * 60 + minute) * 60 + second) * 1000 + ms - offset;
  return Number.isFinite(result) ? result : null;
}

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
export function getDealNumericValue(deal: Deal): number {
  // 1. من المنفعة الأولى إن وجدت
  const benefitValue = deal.benefits?.[0]?.amount?.value;
  if (typeof benefitValue === 'number' && benefitValue > 0) {
    return benefitValue;
  }

  // 2. من headline_value مع دعم الفواصل والاختصارات (مثل $1,000 أو $100k)
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

  // 3. حساب مقدار التوفير من السعر الأصلي وسعر العرض
  const regular =
    (deal.pricing as { regular_price?: number | null } | undefined)?.regular_price ??
    deal.pricing?.original_price;
  const offer = deal.pricing?.offer_price;
  if (typeof regular === 'number' && regular > 0) {
    return typeof offer === 'number' ? Math.max(0, regular - offer) : regular;
  }

  return 0;
}

export function sortDeals(
  deals: readonly Deal[],
  sortBy: SortOption,
  referenceNow: Date
): Deal[] {
  referenceMs(referenceNow);
  if (sortBy === 'default') return [...deals];

  const decorated = deals.map((deal, originalIndex) => ({
    deal,
    originalIndex,
    reviewed: recordedDate(deal.review?.reviewed_on),
    deadline: classifyDeadline(deal.registration?.deadline, referenceNow),
  }));

  decorated.sort((a, b) => {
    // إبقاء العروض المنتهية دائماً في نهاية القائمة
    if (a.deal.status === 'expired' && b.deal.status !== 'expired') return 1;
    if (a.deal.status !== 'expired' && b.deal.status === 'expired') return -1;

    switch (sortBy) {
      case 'highest_value': {
        const diff = getDealNumericValue(b.deal) - getDealNumericValue(a.deal);
        if (diff !== 0) return diff;
        break;
      }

      case 'ending_soon': {
        if (a.deal.status === 'ending_soon' && b.deal.status !== 'ending_soon') return -1;
        if (a.deal.status !== 'ending_soon' && b.deal.status === 'ending_soon') return 1;

        const aEndsRaw = a.deal.ends_at ?? a.deal.registration?.deadline?.date;
        const bEndsRaw = b.deal.ends_at ?? b.deal.registration?.deadline?.date;
        const aEnds = aEndsRaw ? new Date(aEndsRaw).getTime() : Number.POSITIVE_INFINITY;
        const bEnds = bEndsRaw ? new Date(bEndsRaw).getTime() : Number.POSITIVE_INFINITY;
        const validA = Number.isNaN(aEnds) ? Number.POSITIVE_INFINITY : aEnds;
        const validB = Number.isNaN(bEnds) ? Number.POSITIVE_INFINITY : bEnds;
        if (validA !== validB) return validA - validB;
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

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
export function sortDeals(deals: readonly Deal[], sortBy: SortOption, referenceNow: Date): Deal[] {
  referenceMs(referenceNow);
  if (sortBy === 'default') return [...deals];
  const decorated = deals.map((deal, originalIndex) => ({
    deal,
    originalIndex,
    reviewed: recordedDate(deal.review?.reviewed_on),
    deadline: classifyDeadline(deal.registration?.deadline, referenceNow),
  }));
  decorated.sort((a, b) => {
    if (sortBy === 'reviewed') {
      if (!a.reviewed || !b.reviewed)
        return Number(!a.reviewed) - Number(!b.reviewed) || a.originalIndex - b.originalIndex;
      return b.reviewed.ms - a.reviewed.ms || a.originalIndex - b.originalIndex;
    }
    if (sortBy !== 'deadline') return a.originalIndex - b.originalIndex;
    const x = a.deadline,
      y = b.deadline;
    if (x.tier !== y.tier) return x.tier - y.tier;
    const delta = x.tier === 3 ? y.sortKey - x.sortKey : x.sortKey - y.sortKey;
    return delta || a.originalIndex - b.originalIndex;
  });
  return decorated.map((row) => row.deal);
}

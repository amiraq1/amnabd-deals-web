// Strict parsers for the two date shapes the schema allows:
//   - a calendar day "YYYY-MM-DD" with no implied timezone
//   - an explicit instant carrying Z or a ±HH:MM offset
// Shared by sorting and by the offer-timing model so both agree on what a date
// means (audit PR-2 / M-13).

export const DAY_MS = 24 * 60 * 60 * 1000;

// UTC midnight of a calendar day, including years 0000..0099 without Date.UTC's
// 1900 remapping.
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

/**
 * When a recorded day is really over. A date-only value carries no hour and no
 * timezone, so it cannot end at 23:59 in some arbitrary zone.
 *
 * Product decision (documented, not incidental): the day ends at 12:00 UTC of
 * the following day. The civil day is last to finish at UTC-12, where
 * D 23:59:59 == D+1 11:59:59Z, so 12:00:00Z is exactly one second after the
 * last second of that day anywhere on earth. The choice is "one second after
 * the day is over everywhere", not a timezone workaround: 23:59 local would
 * depend on the visitor's device, and 00:00Z would end the day while half the
 * planet is still inside it. An explicit instant bypasses this entirely and is
 * compared to the millisecond.
 */
export function dayEndInstant(value: unknown): number | null {
  const day = parseCalendarDate(value);
  return day === null ? null : day + 36 * 60 * 60 * 1000;
}

/** Instant for a field that may be either a calendar day or an explicit instant. */
export function timestampInstant(value: unknown): number | null {
  const dayEnd = dayEndInstant(value);
  return dayEnd === null ? parseInstant(value) : dayEnd;
}

import type { Deal, Lang, Registration, SortOption } from '@/types';
import { registrationDeadlineValue } from './cardFacts.js';
import { reviewDateLabel } from './format.js';

interface DeadlineTier {
  tier: 1 | 2 | 3 | 4;
  sortKey: number | string;
}

function localDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function classifyDeadline(
  deadline: Registration['deadline'],
  referenceNow: Date
): DeadlineTier {
  const val = registrationDeadlineValue(deadline);
  if (!val) {
    return { tier: 4, sortKey: 0 };
  }

  // Exact time with timezone (ISO)
  if (/T\d{2}:\d{2}/.test(val)) {
    const dateMs = Date.parse(val);
    const refMs = referenceNow.getTime();
    if (dateMs >= refMs) {
      return { tier: 1, sortKey: dateMs };
    }
    return { tier: 3, sortKey: dateMs };
  }

  // Calendar date only (YYYY-MM-DD)
  const refDateStr = localDateString(referenceNow);
  if (val >= refDateStr) {
    return { tier: 2, sortKey: val };
  }

  const parts = val.split('-').map(Number);
  const vy = parts[0] ?? 0;
  const vm = parts[1] ?? 1;
  const vd = parts[2] ?? 1;
  const valMs = new Date(vy, vm - 1, vd).getTime();
  return { tier: 3, sortKey: valMs };
}

export function deadlineTierLabel(
  deadline: Registration['deadline'],
  lang: Lang,
  referenceNow: Date = new Date()
): string {
  const tier = classifyDeadline(deadline, referenceNow);
  const val = registrationDeadlineValue(deadline);
  const prefix = lang === 'ar' ? 'موعد التسجيل' : 'Registration deadline';

  switch (tier.tier) {
    case 1:
      return `${prefix}: ${val}`;
    case 2:
      return lang === 'ar'
        ? `${prefix}: ${val} (يوم التسجيل دون تحديد ساعة)`
        : `${prefix}: ${val} (calendar date without specific hour)`;
    case 3:
      return lang === 'ar'
        ? `موعد التسجيل الموثق قد مضى (${val})`
        : `Documented registration deadline has passed (${val})`;
    case 4:
    default:
      return lang === 'ar' ? `${prefix}: غير معلوم` : `${prefix}: Unknown`;
  }
}

export function sortDeals(
  deals: readonly Deal[],
  sortBy: SortOption,
  referenceNow: Date = new Date()
): Deal[] {
  if (!Array.isArray(deals) || deals.length === 0) return [];
  if (sortBy === 'default') return [...deals];

  if (sortBy === 'reviewed') {
    const decorated = deals.map((deal, originalIndex) => {
      const raw = deal.review?.reviewed_on;
      const valid = typeof raw === 'string' && reviewDateLabel(raw, 'en') === raw;
      return {
        deal,
        originalIndex,
        valid,
        key: valid ? (raw as string) : '',
      };
    });

    decorated.sort((a, b) => {
      if (a.valid && b.valid) {
        const cmp = b.key.localeCompare(a.key);
        if (cmp !== 0) return cmp;
        return a.originalIndex - b.originalIndex;
      }
      if (a.valid) return -1;
      if (b.valid) return 1;
      return a.originalIndex - b.originalIndex;
    });

    return decorated.map((d) => d.deal);
  }

  if (sortBy === 'deadline') {
    const decorated = deals.map((deal, originalIndex) => {
      const { tier, sortKey } = classifyDeadline(deal.registration?.deadline, referenceNow);
      return {
        deal,
        originalIndex,
        tier,
        sortKey,
      };
    });

    decorated.sort((a, b) => {
      if (a.tier !== b.tier) return a.tier - b.tier;

      if (a.tier === 1) {
        const diff = (a.sortKey as number) - (b.sortKey as number);
        if (diff !== 0) return diff;
        return a.originalIndex - b.originalIndex;
      }

      if (a.tier === 2) {
        const cmp = (a.sortKey as string).localeCompare(b.sortKey as string);
        if (cmp !== 0) return cmp;
        return a.originalIndex - b.originalIndex;
      }

      if (a.tier === 3) {
        const diff = (b.sortKey as number) - (a.sortKey as number);
        if (diff !== 0) return diff;
        return a.originalIndex - b.originalIndex;
      }

      return a.originalIndex - b.originalIndex;
    });

    return decorated.map((d) => d.deal);
  }

  return [...deals];
}

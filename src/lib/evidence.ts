import type { Lang } from '@/types';
import type { OfferTiming } from './dealTiming.js';
export type EvidenceStatus = 'supported' | 'partial' | 'unsupported' | 'unknown';

export function evidenceStatus(value: unknown): EvidenceStatus {
  switch (value) {
    case 'supported':
      return 'supported';
    case 'partial':
    case 'partially_supported':
    case 'partially-supported':
      return 'partial';
    case 'unsupported':
    case 'not_supported':
      return 'unsupported';
    default:
      return 'unknown';
  }
}
export function evidenceLabel(value: unknown, lang: Lang): string {
  const labels = {
    supported: { ar: 'مدعوم بمصدر', en: 'Supported by a source' },
    partial: { ar: 'مدعوم جزئيًا', en: 'Partially supported' },
    unsupported: { ar: 'غير مدعوم بالأدلة', en: 'Not supported by evidence' },
    unknown: { ar: 'الدعم بالأدلة غير معلوم', en: 'Evidence support unknown' },
  };
  return labels[evidenceStatus(value)][lang];
}
export function offerStatusLabel(value: unknown, lang: Lang): string {
  switch (value) {
    case 'active':
      return lang === 'ar' ? 'متاح وفق المراجعة' : 'Available as reviewed';
    case 'expired':
    case 'ended':
      return lang === 'ar' ? 'منتهٍ وفق المراجعة' : 'Ended as reviewed';
    case 'paused':
      return lang === 'ar' ? 'متوقف مؤقتًا وفق المراجعة' : 'Paused as reviewed';
    default:
      return lang === 'ar' ? 'غير معلوم' : 'Unknown';
  }
}

/**
 * The detail page printed `review.offer_status` on its own, so a deal whose
 * recorded `ends_at` had already passed still read "available as reviewed"
 * (H-02). The computed timing wins; the raw field is only the fallback for
 * states the timing model does not classify (e.g. `paused`).
 */
export function offerTimingLabel(timing: OfferTiming, fallbackStatus: unknown, lang: Lang): string {
  if (timing.state === 'expired') {
    return timing.reason === 'ends_at'
      ? lang === 'ar'
        ? 'انتهى حسب تاريخ الانتهاء المسجّل'
        : 'Ended per the recorded end date'
      : lang === 'ar'
        ? 'منتهٍ وفق المراجعة'
        : 'Ended as reviewed';
  }
  if (timing.state === 'ending_soon') {
    return lang === 'ar' ? 'ينتهي قريبًا' : 'Ending soon';
  }
  return offerStatusLabel(fallbackStatus, lang);
}

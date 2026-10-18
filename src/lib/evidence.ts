import type { Lang } from '@/types';
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
    supported: { ar: 'مدعوم بمصدر رسمي', en: 'Supported by an official source' },
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

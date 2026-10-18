import type { Lang, Pricing, Registration } from '@/types';
import { reviewDateLabel } from './format.js';

function finitePrice(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

export function recordedPrice(pricing: Pricing, lang: Lang): string {
  const prefix = lang === 'ar' ? 'السعر المسجّل' : 'Recorded price';
  if (!finitePrice(pricing.offer_price))
    return `${prefix}: ${lang === 'ar' ? 'غير معلوم' : 'Unknown'}`;
  const code = pricing.currency?.trim().toUpperCase() ?? '';
  const currency = /^[A-Z]{3}$/.test(code)
    ? code
    : lang === 'ar'
      ? 'العملة غير معلومة'
      : 'currency unknown';
  const value = pricing.offer_price.toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', {
    maximumFractionDigits: 20,
  });
  const cycles: Record<string, [string, string]> = {
    monthly: ['شهريًا', 'monthly'],
    yearly: ['سنويًا', 'yearly'],
    one_time: ['لمرة واحدة', 'one-time'],
  };
  const cycle = Object.prototype.hasOwnProperty.call(cycles, pricing.billing_cycle)
    ? (cycles[pricing.billing_cycle]?.[lang === 'ar' ? 0 : 1] ?? '')
    : lang === 'ar'
      ? 'دورة الفوترة غير معلومة'
      : 'billing period unknown';
  // Do not turn zero into "free forever", compare plans, or compute savings:
  // the existing schema has no independent reference-plan/currency/period proof.
  return `${prefix}: ${value} ${currency} · ${cycle}`;
}

export function registrationDeadlineValue(deadline: Registration['deadline']): string | null {
  if (deadline.status !== 'known' || typeof deadline.date !== 'string') return null;
  const value = deadline.date;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return reviewDateLabel(value, 'en') === value ? value : null;
  }
  // Keep the explicit offset, never infer the viewer's or provider's timezone.
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/.test(value))
    return null;
  if (
    reviewDateLabel(value.slice(0, 10), 'en') !== value.slice(0, 10) ||
    Number(value.slice(11, 13)) > 23 ||
    Number(value.slice(14, 16)) > 59 ||
    (value[16] === ':' && Number(value.slice(17, 19)) > 59) ||
    !Number.isFinite(Date.parse(value))
  )
    return null;
  return value;
}

export function registrationDeadline(deadline: Registration['deadline'], lang: Lang): string {
  const prefix = lang === 'ar' ? 'موعد التسجيل' : 'Registration deadline';
  return `${prefix}: ${registrationDeadlineValue(deadline) ?? (lang === 'ar' ? 'غير معلوم' : 'Unknown')}`;
}

export function extraBenefitsLabel(total: number, lang: Lang): string | null {
  if (!Number.isSafeInteger(total) || total <= 1) return null;
  const count = total - 1;
  if (lang === 'en')
    return `+${count.toLocaleString('en-US')} additional ${count === 1 ? 'benefit' : 'benefits'}`;
  const form = new Intl.PluralRules('ar').select(count);
  if (form === 'one') return 'منفعة إضافية واحدة';
  if (form === 'two') return 'منفعتان إضافيتان';
  return `+${count.toLocaleString('ar-EG')} ${form === 'few' ? 'منافع إضافية' : 'منفعة إضافية'}`;
}

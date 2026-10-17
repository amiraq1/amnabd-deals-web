import type { Lang } from '@/types';

export function localizedField(
  obj: Record<string, unknown> | null | undefined,
  lang: Lang
): string {
  if (!obj) return '';
  const value = obj[lang];
  return typeof value === 'string' ? value : '';
}

export function benefitAmount(
  amount: { unit: string | null; value: number | null; currency: string | null } | undefined,
  lang: Lang
): string {
  if (!amount) return lang === 'ar' ? 'غير معلوم' : 'Unknown';
  if (amount.value === null) {
    const unitLabels: Record<string, { ar: string; en: string }> = {
      plan_access: { ar: 'وصول للخطة', en: 'Plan access' },
      features: { ar: 'ميزات', en: 'Features' },
      credits: { ar: 'أرصدة', en: 'Credits' },
    };
    const label = amount.unit ? unitLabels[amount.unit] : undefined;
    return label ? label[lang] : lang === 'ar' ? 'غير معلوم' : 'Unknown';
  }
  const currency = amount.currency || '';
  return `${currency ? currency + ' ' : ''}${amount.value.toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')}`;
}

export function durationLabel(
  duration: { unit: string | null; value: number | null; status: string } | undefined,
  lang: Lang
): string {
  if (!duration || duration.status === 'unknown') {
    return lang === 'ar' ? 'غير معلوم' : 'Unknown';
  }
  if (duration.status === 'no_expiration') {
    return lang === 'ar' ? 'حتى الاستهلاك' : 'Until used up';
  }
  if (duration.value === null || !duration.unit) {
    return lang === 'ar' ? 'غير معلوم' : 'Unknown';
  }
  const unitAr: Record<string, string> = {
    months: 'شهرًا',
    years: 'سنة',
    days: 'يومًا',
    weeks: 'أسبوعًا',
  };
  const unitEn: Record<string, string> = {
    months: 'months',
    years: 'years',
    days: 'days',
    weeks: 'weeks',
  };
  if (lang === 'ar') {
    return `${duration.value.toLocaleString('ar-EG')} ${unitAr[duration.unit] || duration.unit}`;
  }
  return `${duration.value} ${unitEn[duration.unit] || duration.unit}`;
}

export function frequencyLabel(freq: string | undefined, lang: Lang): string | null {
  if (!freq || freq === 'unknown') return null;
  const map: Record<string, { ar: string; en: string }> = {
    monthly: { ar: 'شهريًا', en: 'Monthly' },
    one_time: { ar: 'مرة واحدة', en: 'One-time' },
    yearly: { ar: 'سنويًا', en: 'Yearly' },
  };
  const label = map[freq];
  return label ? label[lang] : null;
}

export function benefitTypeLabel(type: string | undefined, lang: Lang): string {
  const map: Record<string, { ar: string; en: string }> = {
    usage_credits: { ar: 'رصيد استخدام', en: 'Usage credits' },
    subscription: { ar: 'اشتراك', en: 'Subscription' },
    feature_access: { ar: 'وصول للميزات', en: 'Feature access' },
    discount: { ar: 'خصم', en: 'Discount' },
  };
  const label = type ? map[type] : undefined;
  if (label) return label[lang];
  return lang === 'ar' ? 'غير معلوم' : 'Unknown';
}

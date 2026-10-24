import type { Lang } from '@/types';

export function localizedField(
  obj: Record<string, unknown> | null | undefined,
  lang: Lang
): string {
  if (!obj) return '';
  const value = obj[lang];
  return typeof value === 'string' ? value : '';
}

interface CountUnit {
  en: [string, string];
  ar: { one: string; two: string; few: string; many: string; other: string };
}

const COUNT_UNITS: Record<string, CountUnit> = {
  tokens: {
    en: ['token', 'tokens'],
    ar: { one: 'رمز واحد', two: 'رمزان', few: 'رموز', many: 'رمزًا', other: 'رمز' },
  },
  videos: {
    en: ['video', 'videos'],
    ar: {
      one: 'فيديو واحد',
      two: 'مقطعا فيديو',
      few: 'مقاطع فيديو',
      many: 'فيديو',
      other: 'فيديو',
    },
  },
  requests: {
    en: ['request', 'requests'],
    ar: { one: 'طلب واحد', two: 'طلبان', few: 'طلبات', many: 'طلبًا', other: 'طلب' },
  },
  credits: {
    en: ['credit', 'credits'],
    ar: { one: 'رصيد واحد', two: 'رصيدان', few: 'أرصدة', many: 'رصيدًا', other: 'رصيد' },
  },
  features: {
    en: ['feature', 'features'],
    ar: { one: 'ميزة واحدة', two: 'ميزتان', few: 'ميزات', many: 'ميزة', other: 'ميزة' },
  },
  days: {
    en: ['day', 'days'],
    ar: { one: 'يوم واحد', two: 'يومان', few: 'أيام', many: 'يومًا', other: 'يوم' },
  },
  weeks: {
    en: ['week', 'weeks'],
    ar: { one: 'أسبوع واحد', two: 'أسبوعان', few: 'أسابيع', many: 'أسبوعًا', other: 'أسبوع' },
  },
  months: {
    en: ['month', 'months'],
    ar: { one: 'شهر واحد', two: 'شهران', few: 'أشهر', many: 'شهرًا', other: 'شهر' },
  },
  years: {
    en: ['year', 'years'],
    ar: { one: 'سنة واحدة', two: 'سنتان', few: 'سنوات', many: 'سنة', other: 'سنة' },
  },
};

const UNIT_ALIASES: Record<string, string> = {
  token: 'tokens',
  video: 'videos',
  request: 'requests',
  credit: 'credits',
  feature: 'features',
  day: 'days',
  week: 'weeks',
  month: 'months',
  year: 'years',
};

function knownUnit(unit: string): CountUnit | undefined {
  const key = UNIT_ALIASES[unit] ?? unit;
  return Object.prototype.hasOwnProperty.call(COUNT_UNITS, key) ? COUNT_UNITS[key] : undefined;
}

function unknown(lang: Lang): string {
  return lang === 'ar' ? 'غير معلوم' : 'Unknown';
}

function finiteAmount(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function numberLabel(value: number, lang: Lang): string {
  return value.toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', { maximumFractionDigits: 20 });
}

function countLabel(value: number, unit: CountUnit, lang: Lang): string {
  if (lang === 'en') return `${numberLabel(value, lang)} ${unit.en[value === 1 ? 0 : 1]}`;
  const form = new Intl.PluralRules('ar').select(value);
  if (form === 'one') return unit.ar.one;
  if (form === 'two') return unit.ar.two;
  const noun =
    form === 'few' || form === 'zero'
      ? unit.ar.few
      : form === 'many'
        ? unit.ar.many
        : unit.ar.other;
  return `${numberLabel(value, lang)} ${noun}`;
}

export function benefitAmount(
  amount: { unit: string | null; value: number | null; currency: string | null } | undefined,
  lang: Lang
): string {
  if (!amount) return unknown(lang);
  const unit = amount.unit?.trim().toLowerCase() ?? '';
  if (!finiteAmount(amount.value)) {
    // These are access labels, not a claim of a numeric or free benefit.
    if (unit === 'plan_access') return lang === 'ar' ? 'وصول للخطة' : 'Plan access';
    if (unit === 'features') return lang === 'ar' ? 'ميزات' : 'Features';
    return unknown(lang);
  }
  const value = numberLabel(amount.value, lang);
  const currency = amount.currency?.trim().toUpperCase() ?? '';
  const validCurrency = /^[A-Z]{3}$/.test(currency) ? currency : '';
  const currencyUnits = ['usd', 'eur', 'gbp', 'iqd', 'sar', 'aed', 'cad', 'aud', 'jpy', 'inr'];
  const explicitCurrencyUnit = currencyUnits.includes(unit);
  const monetary = ['currency', 'money', 'dollars'].includes(unit) || explicitCurrencyUnit;
  if (monetary || (validCurrency && (!unit || unit === 'credits'))) {
    if (explicitCurrencyUnit && validCurrency && validCurrency !== unit.toUpperCase())
      return unknown(lang);
    const code = validCurrency || (explicitCurrencyUnit ? unit.toUpperCase() : '');
    if (!code) return `${value} — ${lang === 'ar' ? 'العملة غير معلومة' : 'currency unknown'}`;
    const creditLabel =
      unit === 'credits' ? (lang === 'ar' ? ' رصيد استخدام' : ' usage credits') : '';
    return `${code} ${value}${creditLabel}`;
  }
  if (unit === 'percent' || unit === 'percentage' || unit === '%') return `${value}%`;
  const count = knownUnit(unit);
  if (count) {
    // Conflicting currency/quantity metadata must not silently imply a price.
    if (currency) return unknown(lang);
    return countLabel(amount.value, count, lang);
  }
  if (!unit || unit === 'unknown')
    return `${value} — ${lang === 'ar' ? 'الوحدة غير معلومة' : 'unit unknown'}`;
  // Preserve an explicitly supplied unfamiliar unit rather than inventing one.
  return `${value} ${amount.unit?.trim()}`;
}

export function durationLabel(
  duration: { unit: string | null; value: number | null; status: string } | undefined,
  lang: Lang
): string {
  if (!duration || duration.status === 'unknown') return unknown(lang);
  if (duration.status === 'no_expiration') return lang === 'ar' ? 'حتى الاستهلاك' : 'Until used up';
  if (duration.status === 'no_time_limit') return lang === 'ar' ? 'بلا حد زمني' : 'No time limit';
  if (
    !finiteAmount(duration.value) ||
    !duration.unit ||
    duration.unit.trim().toLowerCase() === 'unknown'
  )
    return unknown(lang);
  const unit = knownUnit(duration.unit.trim().toLowerCase());
  const label = unit
    ? countLabel(duration.value, unit, lang)
    : `${numberLabel(duration.value, lang)} ${duration.unit}`;
  return duration.status === 'up_to'
    ? lang === 'ar'
      ? `حتى ${label}`
      : `Up to ${label}`
    : label;
}

export function reviewDateLabel(value: unknown, lang: Lang): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return unknown(lang);
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
    ? value
    : unknown(lang);
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

import type {
  Benefit,
  Claim,
  Deal,
  GuideSection,
  Localized,
  OfficialSource,
  SiteConfig,
  TriState,
  UsageGuide,
} from '@/types';

// This boundary accepts unknown data. No payloads, keys, IDs or source text are
// included in diagnostics; callers may report counts only.
export interface ValidationReport<T> {
  values: T[];
  rejectedRows: number;
  normalizedFields: number;
  invalidCollection: boolean;
}

type JsonObject = Record<string, unknown>;
interface Context {
  normalized: number;
}
const UNKNOWN: Localized = { ar: 'غير معلوم', en: 'Unknown' };
const TRI_STATES = new Set(['yes', 'no', 'required', 'not_required', 'unknown']);
const RESERVED_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

function object(value: unknown): JsonObject | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonObject)
    : null;
}

function get(value: JsonObject | null, key: string): unknown {
  return value && Object.prototype.hasOwnProperty.call(value, key) ? value[key] : undefined;
}

function changed(ctx: Context): void {
  ctx.normalized += 1;
}

function text(value: unknown, ctx: Context, fallback = ''): string {
  if (typeof value === 'string' && value.trim()) return value.trim();
  changed(ctx);
  return fallback;
}

function requiredText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function numeric(value: unknown, ctx: Context): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return value;
  changed(ctx);
  return null;
}

function array(value: unknown, ctx: Context): unknown[] {
  if (Array.isArray(value)) return value;
  changed(ctx);
  return [];
}

function strings(value: unknown, ctx: Context): string[] {
  return array(value, ctx).flatMap((item) => {
    const str = requiredText(item);
    if (str !== null) return [str];
    changed(ctx);
    return [];
  });
}

function localized(value: unknown, ctx: Context): Localized {
  const obj = object(value);
  return {
    ar: text(get(obj, 'ar'), ctx, UNKNOWN.ar),
    en: text(get(obj, 'en'), ctx, UNKNOWN.en),
  };
}

function tristate(value: unknown, ctx: Context): TriState {
  if (typeof value === 'string' && TRI_STATES.has(value)) return value as TriState;
  changed(ctx);
  return 'unknown';
}

function dateOnly(value: unknown, ctx: Context): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = new Date(`${value}T00:00:00Z`);
    if (Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value)
      return value;
  }
  changed(ctx);
  return null;
}

function deadlineDate(value: unknown, ctx: Context): string | null {
  if (value === null || value === undefined || value === '') return null;
  // Preserve an explicitly zoned timestamp. Never infer a timezone for it.
  if (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/.test(value)
  ) {
    const day = value.slice(0, 10);
    if (
      dateOnly(day, { normalized: 0 }) &&
      Number(value.slice(11, 13)) <= 23 &&
      Number(value.slice(14, 16)) <= 59 &&
      (value[16] !== ':' || Number(value.slice(17, 19)) <= 59) &&
      Number.isFinite(Date.parse(value))
    )
      return value;
    changed(ctx);
    return null;
  }
  return dateOnly(value, ctx);
}

function parseBenefits(value: unknown, ctx: Context): Benefit[] {
  return array(value, ctx).flatMap((item) => {
    const row = object(item);
    if (!row) {
      changed(ctx);
      return [];
    }
    const amount = object(get(row, 'amount'));
    const duration = object(get(row, 'duration'));
    return [
      {
        type: text(get(row, 'type'), ctx, 'unknown'),
        amount: amount
          ? {
              unit: requiredText(get(amount, 'unit')),
              value: numeric(get(amount, 'value'), ctx),
              currency: requiredText(get(amount, 'currency')),
            }
          : undefined,
        duration: duration
          ? {
              unit: requiredText(get(duration, 'unit')),
              value: numeric(get(duration, 'value'), ctx),
              status: text(get(duration, 'status'), ctx, 'unknown'),
            }
          : undefined,
        frequency: text(get(row, 'frequency'), ctx, 'unknown'),
        description: localized(get(row, 'description'), ctx),
      },
    ];
  });
}

function parseSources(value: unknown, ctx: Context): OfficialSource[] {
  return array(value, ctx).flatMap((item) => {
    const row = object(item);
    const url = requiredText(get(row, 'url'));
    if (!row || !url) {
      changed(ctx);
      return [];
    }
    const claims: Claim[] = array(get(row, 'claims'), ctx).flatMap((item) => {
      const claim = object(item);
      const evidence = requiredText(get(claim, 'evidence'));
      if (!claim || !evidence) {
        changed(ctx);
        return [];
      }
      return [
        { field: text(get(claim, 'field'), ctx, 'unknown'), value: get(claim, 'value'), evidence },
      ];
    });
    return [
      {
        url,
        title: text(get(row, 'title'), ctx, url),
        claims,
        context: requiredText(get(row, 'context')) ?? undefined,
      },
    ];
  });
}

function parseDeal(input: unknown, ctx: Context): Deal | null {
  const row = object(input);
  const id = requiredText(get(row, 'id'));
  const slug = requiredText(get(row, 'slug'));
  const ar = requiredText(get(row, 'name_ar'));
  const en = requiredText(get(row, 'name_en'));
  // Never manufacture identity from an array index, random ID, or slug.
  if (!row || !id || !slug || (!ar && !en)) return null;
  const category = object(get(row, 'category'));
  const eligibility = object(get(row, 'eligibility'));
  const countries = object(get(eligibility, 'countries'));
  const pricing = object(get(row, 'pricing'));
  const registration = object(get(row, 'registration'));
  const deadline = object(get(registration, 'deadline'));
  const validity = object(get(registration, 'credit_validity'));
  const offer = object(get(row, 'get_offer'));
  const review = object(get(row, 'review'));
  return {
    id,
    slug,
    // Reuse an actual supplied name if only one language is present; no translation is inferred.
    name_ar: ar ?? en ?? '',
    name_en: en ?? ar ?? '',
    icon_url: requiredText(get(row, 'icon_url')) ?? undefined,
    description_ar: text(get(row, 'description_ar'), ctx, UNKNOWN.ar),
    description_en: text(get(row, 'description_en'), ctx, UNKNOWN.en),
    category: {
      value: text(get(category, 'value'), ctx, 'unknown'),
      legacy_value: requiredText(get(category, 'legacy_value')) ?? undefined,
      review_status: requiredText(get(category, 'review_status')) ?? undefined,
    },
    benefits: parseBenefits(get(row, 'benefits'), ctx),
    eligibility: {
      countries: {
        status: text(get(countries, 'status'), ctx, 'unknown'),
        values: strings(get(countries, 'values'), ctx),
      },
      conditions: localized(get(eligibility, 'conditions'), ctx),
      new_account: tristate(get(eligibility, 'new_account'), ctx),
      card_required: tristate(get(eligibility, 'card_required'), ctx),
      applicant_type: text(get(eligibility, 'applicant_type'), ctx, 'unknown'),
      phone_required: tristate(get(eligibility, 'phone_required'), ctx),
      student_status: tristate(get(eligibility, 'student_status'), ctx),
    },
    pricing: {
      currency: requiredText(get(pricing, 'currency')),
      offer_price: numeric(get(pricing, 'offer_price'), ctx),
      original_price: numeric(get(pricing, 'original_price'), ctx),
      billing_cycle: text(get(pricing, 'billing_cycle'), ctx, 'unknown'),
    },
    registration: {
      deadline: {
        date: deadlineDate(get(deadline, 'date'), ctx),
        status: text(get(deadline, 'status'), ctx, 'unknown'),
      },
      credit_validity: {
        unit: requiredText(get(validity, 'unit')),
        status: text(get(validity, 'status'), ctx, 'unknown'),
        duration: numeric(get(validity, 'duration'), ctx),
      },
    },
    official_sources: parseSources(get(row, 'official_sources'), ctx),
    get_offer: {
      url: text(get(offer, 'url'), ctx),
      type: text(get(offer, 'type'), ctx, 'unknown'),
      label: localized(get(offer, 'label'), ctx),
    },
    review: {
      notes: localized(get(review, 'notes'), ctx),
      reviewed_on: dateOnly(get(review, 'reviewed_on'), ctx) ?? '',
      verified_on: dateOnly(get(review, 'verified_on'), ctx),
      offer_status: text(get(review, 'offer_status'), ctx, 'unknown'),
      unknown_fields: strings(get(review, 'unknown_fields'), ctx),
      verification_status: text(get(review, 'verification_status'), ctx, 'unknown'),
    },
  };
}

function parseGuide(input: unknown, ctx: Context): UsageGuide | null {
  const row = object(input);
  const slug = requiredText(get(row, 'slug'));
  if (!row || !slug) return null;
  const sections = object(get(row, 'sections'));
  const section = (key: string): GuideSection => {
    const item = object(get(sections, key));
    return { ...localized(item, ctx), sources: strings(get(item, 'sources'), ctx) };
  };
  return {
    slug,
    sections: {
      eligibility: section('eligibility'),
      registration: section('registration'),
      limitations: section('limitations'),
      after_expiry: section('after_expiry'),
    },
  };
}

function collect<T>(
  input: unknown,
  parse: (row: unknown, ctx: Context) => T | null,
  keys: (row: T) => string[]
): ValidationReport<T> {
  const report: ValidationReport<T> = {
    values: [],
    rejectedRows: 0,
    normalizedFields: 0,
    invalidCollection: false,
  };
  if (!Array.isArray(input)) return { ...report, rejectedRows: 1, invalidCollection: true };
  const seen = new Set<string>();
  for (const item of input) {
    const ctx = { normalized: 0 };
    const value = parse(item, ctx);
    if (value === null || keys(value).some((key) => seen.has(key))) {
      report.rejectedRows += 1;
      continue;
    }
    for (const key of keys(value)) seen.add(key);
    report.values.push(value);
    report.normalizedFields += ctx.normalized;
  }
  return report;
}

export function validateDeals(input: unknown): ValidationReport<Deal> {
  return collect(input, parseDeal, (row) => [`id:${row.id}`, `slug:${row.slug}`]);
}

export function validateGuides(input: unknown): ValidationReport<UsageGuide> {
  return collect(input, parseGuide, (row) => [row.slug]);
}

function stringMap(value: unknown, ctx: Context): Record<string, string> {
  const row = object(value);
  if (!row) {
    changed(ctx);
    return {};
  }
  return Object.fromEntries(
    Object.entries(row).flatMap(([key, item]) => {
      if (!RESERVED_KEYS.has(key) && typeof item === 'string' && item.trim())
        return [[key, item.trim()]];
      changed(ctx);
      return [];
    })
  );
}

export function validateConfig(input: unknown): {
  value: SiteConfig | null;
  rejectedRows: number;
  normalizedFields: number;
} {
  if (input === null) return { value: null, rejectedRows: 0, normalizedFields: 0 };
  const row = object(input);
  if (!row || get(row, 'id') !== 'main')
    return { value: null, rejectedRows: 1, normalizedFields: 0 };
  const ctx = { normalized: 0 };
  const overview = object(get(row, 'overview'));
  const labels = object(get(row, 'section_labels'));
  return {
    value: {
      id: 'main',
      overview: {
        ar: stringMap(get(overview, 'ar'), ctx),
        en: stringMap(get(overview, 'en'), ctx),
      },
      section_labels: {
        ar: stringMap(get(labels, 'ar'), ctx),
        en: stringMap(get(labels, 'en'), ctx),
      },
      last_reviewed: dateOnly(get(row, 'last_reviewed'), ctx) ?? '',
    },
    rejectedRows: 0,
    normalizedFields: ctx.normalized,
  };
}

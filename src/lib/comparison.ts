import type { Deal, Lang, Localized } from '@/types';
import { durationLabel } from './format.js';
import { isValidSlug } from './routes.js';
import { requirementState } from './eligibility.js';
import { safeUrl } from './safeUrl.js';

export type ComparisonCell =
  | { kind: 'text'; text: string }
  | { kind: 'sources'; sources: { title: string; url: string | null }[] };

export interface ComparisonRow {
  key: string;
  label: Localized;
  values: [ComparisonCell, ComparisonCell];
}

export interface ComparisonSelectionUpdate {
  selected: string[];
  added: boolean;
  removed: boolean;
  limitReached: boolean;
}

const UNKNOWN: Localized = { ar: 'غير معلوم', en: 'Unknown' };
const FIELD_LABELS: ReadonlyArray<{ key: string; label: Localized }> = [
  { key: 'student', label: { ar: 'اشتراط صفة الطالب', en: 'Student requirement' } },
  { key: 'card', label: { ar: 'اشتراط بطاقة ائتمان', en: 'Credit-card requirement' } },
  { key: 'new-account', label: { ar: 'اشتراط حساب جديد', en: 'New-account requirement' } },
  { key: 'phone', label: { ar: 'اشتراط رقم هاتف', en: 'Phone requirement' } },
  { key: 'countries', label: { ar: 'البلدان المؤهلة المسجلة', en: 'Recorded eligible countries' } },
  { key: 'duration', label: { ar: 'المدة المسجلة', en: 'Recorded duration' } },
  { key: 'source', label: { ar: 'المصدر الرسمي', en: 'Official source' } },
];

function markedUnknown(deal: Deal, aliases: readonly string[]): boolean {
  const recorded = deal.review?.unknown_fields ?? [];
  return aliases.some((field) => recorded.includes(field));
}

function unknownText(lang: Lang): ComparisonCell {
  return { kind: 'text', text: UNKNOWN[lang] };
}

function requirementFact(
  deal: Deal,
  raw: unknown,
  aliases: readonly string[],
  lang: Lang
): ComparisonCell {
  if (markedUnknown(deal, aliases)) return unknownText(lang);
  const state = requirementState(raw);
  const text =
    state === 'required'
      ? lang === 'ar'
        ? 'مطلوب'
        : 'Required'
      : state === 'not_required'
        ? lang === 'ar'
          ? 'غير مطلوب'
          : 'Not required'
        : UNKNOWN[lang];
  return { kind: 'text', text };
}

function countryFact(deal: Deal, lang: Lang): ComparisonCell {
  if (
    markedUnknown(deal, [
      'eligibility.countries',
      'eligibility.countries.values',
      'country eligibility',
      'country availability',
      'Iraq_availability',
    ])
  )
    return unknownText(lang);
  const countries = deal.eligibility?.countries;
  if (!countries) return unknownText(lang);
  const status = countries.status?.trim().toLowerCase();
  const values = countries.values;
  if (status === 'worldwide' && values.length === 0) {
    return { kind: 'text', text: lang === 'ar' ? 'عالميًا (الحالة المسجلة)' : 'Worldwide (recorded status)' };
  }
  // Preserve the explicit status and list instead of turning either into a new
  // eligibility claim. Contradictory or unrecognized states remain unknown.
  if (status === 'listed' && values.length > 0) {
    return {
      kind: 'text',
      text: `${lang === 'ar' ? 'قائمة مسجلة' : 'Listed'}: ${values.join('، ')}`,
    };
  }
  return unknownText(lang);
}

function durationFact(deal: Deal, lang: Lang): ComparisonCell {
  const durationKeys = deal.benefits.map((_, index) => `benefits.${index}.duration`);
  if (
    markedUnknown(deal, [
      'benefits.duration',
      'duration',
      'registration.credit_validity',
      ...durationKeys,
    ])
  )
    return unknownText(lang);
  if (deal.benefits.length === 0) return unknownText(lang);
  const values = deal.benefits.map((benefit) => {
    const duration = benefit.duration;
    if (
      !duration ||
      !['known', 'active', 'up_to', 'no_time_limit', 'no_expiration'].includes(
        duration.status
      )
    )
      return UNKNOWN[lang];
    return durationLabel(duration, lang);
  });
  return { kind: 'text', text: values.join(lang === 'ar' ? '؛ ' : '; ') };
}

function sourceFact(deal: Deal, lang: Lang): ComparisonCell {
  if (markedUnknown(deal, ['official_sources', 'official source', 'source']))
    return unknownText(lang);
  const sources = deal.official_sources ?? [];
  if (sources.length === 0) return unknownText(lang);
  return {
    kind: 'sources',
    sources: sources.map((source) => ({ title: source.title, url: safeUrl(source.url) })),
  };
}

function fact(deal: Deal, key: string, lang: Lang): ComparisonCell {
  switch (key) {
    case 'student':
      return requirementFact(
        deal,
        deal.eligibility?.student_status,
        ['eligibility.student_status', 'student_status', 'student status', 'student eligibility'],
        lang
      );
    case 'card':
      return requirementFact(
        deal,
        deal.eligibility?.card_required,
        ['eligibility.card_required', 'card requirement', 'card_required'],
        lang
      );
    case 'new-account':
      return requirementFact(
        deal,
        deal.eligibility?.new_account,
        ['eligibility.new_account', 'new-account requirement', 'new_account'],
        lang
      );
    case 'phone':
      return requirementFact(
        deal,
        deal.eligibility?.phone_required,
        ['eligibility.phone_required', 'phone requirement', 'phone_required'],
        lang
      );
    case 'countries':
      return countryFact(deal, lang);
    case 'duration':
      return durationFact(deal, lang);
    case 'source':
      return sourceFact(deal, lang);
    default:
      return unknownText(lang);
  }
}

export function buildComparisonRows(
  deals: readonly [Deal, Deal],
  lang: Lang
): ComparisonRow[] {
  return FIELD_LABELS.map(({ key, label }) => ({
    key,
    label,
    values: [fact(deals[0], key, lang), fact(deals[1], key, lang)],
  }));
}

export function toggleComparisonSelection(
  current: readonly string[],
  slug: string
): ComparisonSelectionUpdate {
  const selected = Array.from(new Set(current.filter(isValidSlug))).slice(0, 2);
  if (!isValidSlug(slug))
    return { selected, added: false, removed: false, limitReached: false };
  if (selected.includes(slug)) {
    return {
      selected: selected.filter((item) => item !== slug),
      added: false,
      removed: true,
      limitReached: false,
    };
  }
  if (selected.length >= 2)
    return { selected, added: false, removed: false, limitReached: true };
  return { selected: [...selected, slug], added: true, removed: false, limitReached: false };
}

export function comparisonSearch(slugs: readonly string[]): string | null {
  if (slugs.length !== 2) return null;
  const first = slugs[0];
  const second = slugs[1];
  if (
    typeof first !== 'string' ||
    typeof second !== 'string' ||
    !isValidSlug(first) ||
    !isValidSlug(second) ||
    first === second
  )
    return null;
  const params = new URLSearchParams();
  params.append('offer', first);
  params.append('offer', second);
  return params.toString();
}

export function parseComparisonSlugs(search: string): string[] {
  try {
    const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
    const values = params.getAll('offer');
    return values.length === 2 && values[0] !== values[1] && values.every(isValidSlug)
      ? values
      : [];
  } catch {
    return [];
  }
}

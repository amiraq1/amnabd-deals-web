import type { Deal, Lang } from '@/types';
import { benefitAmount, benefitTypeLabel, durationLabel, frequencyLabel } from './format.js';
import { compileQuery, expandTextWithVariants } from './normalize.js';

// Categories come only from category.value, never inferred from marketing text.
// Case/spacing variants share a key; unrelated categories are not merged.
export function categoryKey(value: unknown): string {
  if (typeof value !== 'string') return '';
  const key = value.normalize('NFC').trim().replace(/\s+/gu, ' ').toLowerCase();
  return ['', 'unknown', 'غير معلوم'].includes(key) ? '' : key;
}

export function categoryLabel(value: string, lang: Lang): string {
  return categoryKey(value)
    ? value.normalize('NFC').trim().replace(/\s+/gu, ' ')
    : lang === 'ar'
      ? 'غير مصنّف'
      : 'Uncategorized';
}

export function categoryOptions(deals: Pick<Deal, 'category'>[], lang: Lang) {
  const groups = new Map<string, { key: string; label: string; count: number }>();
  for (const deal of deals) {
    const key = categoryKey(deal.category.value);
    const existing = groups.get(key);
    if (existing) existing.count += 1;
    else groups.set(key, { key, label: categoryLabel(deal.category.value, lang), count: 1 });
  }
  return Array.from(groups.values()).sort((a, b) => {
    if (a.key === '') return 1;
    if (b.key === '') return -1;
    return a.label.localeCompare(b.label, lang);
  });
}

export function matchesCategory(value: unknown, selected: string | null): boolean {
  return selected === null || categoryKey(value) === selected;
}

// Builds an expanded, normalized search corpus for a deal across both languages.
// Only explicitly present fields are collected; empty/unknown values are omitted.
export function buildDealCorpus(deal: Deal): string {
  const parts: string[] = [];
  if (deal.name_ar) parts.push(deal.name_ar);
  if (deal.name_en) parts.push(deal.name_en);
  if (deal.description_ar) parts.push(deal.description_ar);
  if (deal.description_en) parts.push(deal.description_en);

  const catVal = deal.category?.value ?? '';
  if (catVal && categoryKey(catVal)) {
    parts.push(catVal);
    parts.push(categoryLabel(catVal, 'ar'));
    parts.push(categoryLabel(catVal, 'en'));
  } else {
    parts.push(categoryLabel('', 'ar'), categoryLabel('', 'en'));
  }

  if (Array.isArray(deal.benefits)) {
    for (const b of deal.benefits) {
      if (b.description?.ar) parts.push(b.description.ar);
      if (b.description?.en) parts.push(b.description.en);
      if (b.type) {
        const arType = benefitTypeLabel(b.type, 'ar');
        const enType = benefitTypeLabel(b.type, 'en');
        if (arType && arType !== 'غير معلوم') parts.push(arType);
        if (enType && enType !== 'Unknown') parts.push(enType);
      }
      for (const lang of ['ar', 'en'] as const) {
        const amount = benefitAmount(b.amount, lang);
        const duration = durationLabel(b.duration, lang);
        if (amount !== 'Unknown' && amount !== 'غير معلوم') parts.push(amount);
        if (duration !== 'Unknown' && duration !== 'غير معلوم') parts.push(duration);
      }
      if (b.amount?.unit && b.amount.unit !== 'unknown') parts.push(b.amount.unit);
      if (b.amount?.currency) parts.push(b.amount.currency);
      if (b.duration?.unit && b.duration.unit !== 'unknown') parts.push(b.duration.unit);
      if (b.frequency) {
        const arFreq = frequencyLabel(b.frequency, 'ar');
        const enFreq = frequencyLabel(b.frequency, 'en');
        if (arFreq) parts.push(arFreq);
        if (enFreq) parts.push(enFreq);
      }
    }
  }

  return expandTextWithVariants(parts.join(' '));
}

// Matches a query against a pre-built corpus with token-level AND semantics
// and variant-level OR semantics.
export function matchesCorpus(
  corpus: string,
  query: string | readonly (readonly string[])[]
): boolean {
  const groups = typeof query === 'string' ? compileQuery(query) : query;
  return groups.every((variants) => variants.some((value) => corpus.includes(value)));
}

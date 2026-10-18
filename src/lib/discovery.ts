import type { Deal, Lang } from '@/types';

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

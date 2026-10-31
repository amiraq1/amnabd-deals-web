import type { Deal, Lang } from '@/types';
import { benefitAmount } from './format.js';
import { categoryKey } from './discovery.js';
import { isOpenToAll } from './eligibility.js';

// Decorative identity only. No remote logos, provider guesses or semantic category merging.
export function offerInitial(name: string): string {
  return (
    name
      .trim()
      .match(/[\p{L}\p{N}]/u)?.[0]
      .toLocaleUpperCase('en') ?? '·'
  );
}

export function offerTone(name: string): number {
  let hash = 0;
  for (const character of name.normalize('NFC'))
    hash = (hash * 31 + character.codePointAt(0)!) >>> 0;
  return hash % 6;
}

export function categoryDecoration(
  value: string,
): 'cloud' | 'code' | 'design' | 'education' | 'ai' | 'neutral' {
  switch (categoryKey(value)) {
    case 'cloud':
      return 'cloud';
    case 'development':
      return 'code';
    case 'design':
      return 'design';
    case 'education':
      return 'education';
    case 'ai models':
      return 'ai';
    default:
      return 'neutral';
  }
}

export function primaryBenefit(
  deal: Pick<Deal, 'benefits'>,
  lang: Lang,
): string {
  const first = deal.benefits[0];
  if (
    typeof first?.amount?.value === 'number' &&
    Number.isFinite(first.amount.value) &&
    first.amount.value >= 0
  )
    return benefitAmount(first.amount, lang);
  return first?.description[lang] || (lang === 'ar' ? 'غير معلوم' : 'Unknown');
}

export function eligibilitySummary(
  deal: Pick<Deal, 'eligibility'>,
  lang: Lang,
): string {
  if (isOpenToAll(deal.eligibility))
    return lang === 'ar' ? 'مفتوح للجميع' : 'Open to all';
  const type = deal.eligibility.applicant_type;
  const labels = {
    student: ['طلاب', 'Students'],
    startup: ['شركات ناشئة', 'Startups'],
    organization: ['مؤسسات', 'Organizations'],
    individual: ['أفراد', 'Individuals'],
    multiple: ['فئات متعددة؛ راجع الشروط', 'Multiple groups; check terms'],
  } as const;
  // `any` without the existing open-to-all predicate is NOT universal eligibility.
  if (Object.prototype.hasOwnProperty.call(labels, type))
    return labels[type as keyof typeof labels][lang === 'ar' ? 0 : 1];
  return lang === 'ar' ? 'غير معلوم' : 'Unknown';
}

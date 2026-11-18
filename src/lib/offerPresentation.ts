import type { Deal, Lang } from '@/types';
import { benefitAmount } from './format.js';
import { categoryKey, categoryLabel, matchesCorpus } from './discovery.js';
import { isOpenToAll } from './eligibility.js';
import { compileQuery, expandTextWithVariants } from './normalize.js';
import { getDealDisplayName } from './dealMetadata.js';
import { extraBenefitsLabel } from './cardFacts.js';

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

/**
 * Explains why a deal matched a search query if the match occurred in fields
 * not directly visible on the DealCard (e.g. Qwen in IteraCompute Qwen3.8-27B).
 * Returns null if the query already matches visible card content or if no query is given.
 */
export function searchMatchReason(
  deal: Deal,
  query: string,
  lang: Lang,
): string | null {
  if (!query || !query.trim()) return null;
  const groups = compileQuery(query);
  if (groups.length === 0) return null;

  const displayName = getDealDisplayName(deal);
  const category = categoryLabel(deal.category?.value ?? '', lang);
  const benefit = primaryBenefit(deal, lang);
  const visibleDesc =
    deal.key_condition ||
    deal.headline_value ||
    (lang === 'ar' ? deal.description_ar : deal.description_en) ||
    '';
  const additional = extraBenefitsLabel(deal.benefits?.length ?? 0, lang);

  const visibleText = [displayName, category, benefit, visibleDesc, additional]
    .filter(Boolean)
    .join(' ');
  const visibleCorpus = expandTextWithVariants(visibleText);

  // If visible text already matches the query tokens, no extra clarification badge is required.
  if (matchesCorpus(visibleCorpus, groups)) {
    return null;
  }

  // Check full / alternative name
  const nameEn = deal.name_en?.trim();
  const nameAr = deal.name_ar?.trim();
  if (
    nameEn &&
    nameEn !== displayName &&
    matchesCorpus(expandTextWithVariants(nameEn), groups)
  ) {
    const cleanName =
      nameEn.length > 40 ? `${nameEn.slice(0, 37)}...` : nameEn;
    return lang === 'ar'
      ? `مطابق في الاسم: ${cleanName}`
      : `Matched in name: ${cleanName}`;
  }
  if (
    nameAr &&
    nameAr !== displayName &&
    matchesCorpus(expandTextWithVariants(nameAr), groups)
  ) {
    const cleanName =
      nameAr.length > 40 ? `${nameAr.slice(0, 37)}...` : nameAr;
    return lang === 'ar'
      ? `مطابق في الاسم: ${cleanName}`
      : `Matched in name: ${cleanName}`;
  }

  // Check additional benefits
  if (Array.isArray(deal.benefits)) {
    for (const b of deal.benefits) {
      const descLang = b.description?.[lang]?.trim();
      if (descLang && matchesCorpus(expandTextWithVariants(descLang), groups)) {
        const snippet =
          descLang.length > 40 ? `${descLang.slice(0, 37)}...` : descLang;
        return lang === 'ar'
          ? `مطابق في المنافع: ${snippet}`
          : `Matched in benefits: ${snippet}`;
      }
      const otherLang = lang === 'ar' ? 'en' : 'ar';
      const descOther = b.description?.[otherLang]?.trim();
      if (
        descOther &&
        matchesCorpus(expandTextWithVariants(descOther), groups)
      ) {
        const snippet =
          descOther.length > 40 ? `${descOther.slice(0, 37)}...` : descOther;
        return lang === 'ar'
          ? `مطابق في المنافع: ${snippet}`
          : `Matched in benefits: ${snippet}`;
      }
      if (
        b.amount?.unit &&
        matchesCorpus(expandTextWithVariants(b.amount.unit), groups)
      ) {
        return lang === 'ar'
          ? `مطابق في وحدة المنفعة: ${b.amount.unit}`
          : `Matched in benefit unit: ${b.amount.unit}`;
      }
    }
  }

  // Check detailed descriptions if different from the visible description
  const fullDesc = lang === 'ar' ? deal.description_ar : deal.description_en;
  if (
    fullDesc &&
    fullDesc !== visibleDesc &&
    matchesCorpus(expandTextWithVariants(fullDesc), groups)
  ) {
    return lang === 'ar'
      ? 'مطابق في تفاصيل الوصف'
      : 'Matched in detailed description';
  }
  const altDesc = lang === 'ar' ? deal.description_en : deal.description_ar;
  if (
    altDesc &&
    altDesc !== visibleDesc &&
    matchesCorpus(expandTextWithVariants(altDesc), groups)
  ) {
    return lang === 'ar'
      ? 'مطابق في تفاصيل الوصف'
      : 'Matched in detailed description';
  }

  // Check use cases
  if (Array.isArray(deal.use_cases)) {
    for (const uc of deal.use_cases) {
      if (matchesCorpus(expandTextWithVariants(uc), groups)) {
        return lang === 'ar'
          ? `مطابق في حالات الاستخدام: ${uc}`
          : `Matched in use case: ${uc}`;
      }
    }
  }

  // Check slug
  if (deal.slug && matchesCorpus(expandTextWithVariants(deal.slug), groups)) {
    return lang === 'ar'
      ? `مطابق في المعرّف: ${deal.slug}`
      : `Matched in slug: ${deal.slug}`;
  }

  return lang === 'ar' ? 'مطابق في بيانات العرض' : 'Matched in deal details';
}

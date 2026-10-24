import type { ReviewedActivationGuide } from '@/types';

const CARD_CLAIM = /\b(?:credit\s*card|payment\s*card|card)\b|بطاقة|ائتمان|بنكية/iu;
const TERM_CLAIM = /\b(?:(?:\d+|one|two|three|six|twelve)[\s-]*(?:days?|weeks?|months?|years?)|daily|weekly|monthly|yearly|annual|expires?|expiration|expiry|validity|duration|term|until\s+used|no\s+expiration|no\s+time\s+limit|permanent)\b|(?<![\p{L}\p{N}])(?:\d+\s*)?(?:أيام?|يوم|أسابيع?|أسبوع|أشهر|شهور|شهر|سنوات|سنة|عامين|أعوام|يومي|أسبوعي|شهري|سنوي)(?![\p{L}\p{N}])|انتهاء الصلاحية|مدة الصلاحية|بلا مدة|دائم/iu;
const TERM_FIELDS = new Set([
  'registration.credit_validity',
  'registration.deadline',
  'benefits.0.duration',
  'fixed_term',
]);

export function hasSensitiveClaimCoverage(copy: string, claimFields: string[]): boolean {
  if (CARD_CLAIM.test(copy) && !claimFields.includes('eligibility.card_required'))
    return false;
  if (TERM_CLAIM.test(copy) && !claimFields.some((field) => TERM_FIELDS.has(field)))
    return false;
  return true;
}

export function filterActivationGuide(
  guide: ReviewedActivationGuide | undefined,
  unknownFields: string[]
): ReviewedActivationGuide | undefined {
  if (!guide) return undefined;
  if (guide.summary_claim_fields.some((field) => unknownFields.includes(field)))
    return undefined;
  const steps = guide.steps.filter(
    (step) => !step.claim_fields.some((field) => unknownFields.includes(field))
  );
  if (steps.length === 0) return undefined;
  return { ...guide, steps };
}

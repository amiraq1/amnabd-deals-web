import type { Review } from '@/types';

const NEGATIVE_REVIEW_STATES = new Set([
  'needs_review',
  'verifying',
  'unverified',
  'unsupported',
  'not_supported',
]);

function isValidDateOnly(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

/**
 * Current rows use `verdict: 'verified'`; earlier rows used
 * `verification_status: 'verified'` or a validated `verified_on` date.
 * An explicit non-verified verdict/state always wins over older date metadata.
 */
export function isVerifiedReview(review: Partial<Review> | null | undefined): boolean {
  if (!review) return false;

  const verdict = typeof review.verdict === 'string' ? review.verdict.trim() : '';
  if (verdict) return verdict === 'verified';

  const status =
    typeof review.verification_status === 'string' ? review.verification_status.trim() : '';
  if (status === 'verified') return true;
  if (NEGATIVE_REVIEW_STATES.has(status)) return false;

  return isValidDateOnly(review.verified_on);
}

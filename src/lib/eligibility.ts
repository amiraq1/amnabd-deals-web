import type { ApplicantType, Eligibility, RequirementState, TruthState } from '@/types';

export function requirementState(value: unknown): RequirementState {
  if (value === 'yes' || value === 'required') return 'required';
  if (value === 'no' || value === 'not_required') return 'not_required';
  return 'unknown';
}

export function truthState(value: unknown): TruthState {
  return value === 'yes' || value === 'no' ? value : 'unknown';
}

export function applicantType(value: unknown): ApplicantType {
  if (typeof value !== 'string') return 'unknown';
  switch (value.trim().toLowerCase()) {
    case 'any':
    case 'all':
    case 'open_to_all':
      return 'any';
    case 'student':
    case 'students':
      return 'student';
    case 'startup':
    case 'startups':
      return 'startup';
    case 'company':
    case 'companies':
    case 'organization':
      return 'organization';
    case 'individual':
    case 'individuals':
      return 'individual';
    case 'multiple':
      return 'multiple';
    default:
      return 'unknown';
  }
}

// open_to_all is an explicit, evidence-backed reviewer assertion in eligibility
// JSON. Legacy records default to unknown: absence of a student requirement is
// NOT evidence of universal eligibility. Contradictory/unknown restrictions fail closed.
export function isOpenToAll(eligibility: Eligibility): boolean {
  return (
    truthState(eligibility.open_to_all) === 'yes' &&
    applicantType(eligibility.applicant_type) === 'any' &&
    requirementState(eligibility.student_status) === 'not_required' &&
    requirementState(eligibility.new_account) === 'not_required' &&
    ['worldwide', 'global', 'all', 'unrestricted'].includes(eligibility.countries.status) &&
    eligibility.countries.values.length === 0
  );
}

export type ApplicantFilter = 'all' | 'student' | 'any';
export type CardFilter = 'all' | 'not_required';

export function matchesEligibility(
  eligibility: Eligibility,
  applicant: ApplicantFilter,
  card: CardFilter
): boolean {
  if (applicant === 'student' && requirementState(eligibility.student_status) !== 'required')
    return false;
  if (applicant === 'any' && !isOpenToAll(eligibility)) return false;
  return card !== 'not_required' || requirementState(eligibility.card_required) === 'not_required';
}

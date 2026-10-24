import type { Deal } from '@/types';
import { safeUrl } from './safeUrl.js';

export type CountryAvailability = 'supported' | 'unknown' | 'excluded';

const COUNTRY_FIELDS = new Set([
  'eligibility.countries',
  'eligibility.countries.status',
  'eligibility.countries.values',
  'country availability',
  'country eligibility',
  'country_availability',
  'country_eligibility',
  'iraq_availability',
]);
const UNKNOWN_REVIEW_STATES = new Set([
  'needs_review',
  'verifying',
  'unverified',
  'unsupported',
  'not_supported',
]);
const REVIEWED_STATES = new Set(['verified', 'supported', 'partially_supported']);
const INCLUDED_COUNTRY_STATES = new Set(['listed', 'specified', 'eligible', 'allowed', 'included']);
const EXCLUDED_COUNTRY_STATES = new Set(['restricted', 'excluded', 'blocked', 'not_available']);
const GLOBAL_COUNTRY_STATES = new Set(['worldwide', 'stated_global', 'global']);
const COUNTRY_ALIASES: Readonly<Record<string, readonly string[]>> = {
  iraq: ['iraq', 'العراق', 'جمهورية العراق'],
  'mainland china': ['mainland china', 'الصين القارية', 'البر الرئيسي للصين'],
};

function normalizedText(value: string): string {
  return value.normalize('NFKC').trim().replace(/\s+/gu, ' ').toLocaleLowerCase('en-US');
}

function canonicalCountry(value: string): string {
  const normalized = normalizedText(value);
  for (const [canonical, aliases] of Object.entries(COUNTRY_ALIASES)) {
    if (aliases.some((alias) => normalizedText(alias) === normalized)) return canonical;
  }
  return normalized;
}

function fieldName(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLocaleLowerCase('en-US') : '';
}

function countryField(value: unknown): boolean {
  const field = fieldName(value);
  return (
    COUNTRY_FIELDS.has(field) ||
    field.startsWith('eligibility.countries.') ||
    field.startsWith('country_availability.') ||
    field.startsWith('country_eligibility.')
  );
}

function mentionsCountry(value: unknown, country: string): boolean {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? '');
  const normalized = normalizedText(text);
  const aliases = COUNTRY_ALIASES[country] ?? [country];
  return aliases.some((alias) => {
    const needle = normalizedText(alias).replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
    return new RegExp(`(^|[^\\p{L}\\p{N}])${needle}($|[^\\p{L}\\p{N}])`, 'iu').test(normalized);
  });
}

function markedCountryUnknown(deal: Deal, country: string): boolean {
  const unknownFields = deal.review?.unknown_fields ?? [];
  return unknownFields.some((raw) => {
    const field = fieldName(raw);
    if (
      field === 'eligibility.countries' ||
      field.startsWith('eligibility.countries.') ||
      field === 'country availability' ||
      field === 'country eligibility' ||
      field === 'country_availability' ||
      field === 'country_eligibility'
    )
      return true;
    return field === 'iraq_availability' && country === 'iraq';
  });
}

function hasReviewedRecord(deal: Deal): boolean {
  const review = deal.review;
  if (!review || !/^\d{4}-\d{2}-\d{2}$/.test(review.reviewed_on ?? '')) return false;
  const status = fieldName(review.verdict || review.verification_status);
  return REVIEWED_STATES.has(status) && !UNKNOWN_REVIEW_STATES.has(status);
}

function sourceClaims(deal: Deal) {
  return (deal.official_sources ?? [])
    .filter((source) => typeof source.url === 'string' && safeUrl(source.url) !== null)
    .flatMap((source) => source.claims ?? [])
    .filter((claim) => countryField(claim.field));
}

function claimText(claim: { value?: unknown; evidence?: unknown }): string {
  const value = typeof claim.value === 'string' ? claim.value : JSON.stringify(claim.value ?? '');
  const evidence = typeof claim.evidence === 'string' ? claim.evidence : '';
  return `${value} ${evidence}`;
}

function explicitGlobalEvidence(text: string): boolean {
  return (
    /\b(?:any|all)\s+(?:country|countries)\b|\bworldwide\b|\bglobally available\b|\bglobal availability\b|\bavailable globally\b|\banywhere in the world\b/iu.test(text) ||
    /أي\s+بلد|أي\s+دولة|جميع\s+البلدان|جميع\s+الدول|كل\s+البلدان|كل\s+الدول|متاح(?:ة)?\s+عالمي(?:اً|ا)/u.test(text)
  );
}

function explicitExclusion(text: string): boolean {
  return (
    /\b(?:excludes?|excluded|excluding|not available in|not eligible in|restricted in|prohibited in|not supported in)\b/iu.test(text) ||
    /مستثنى|مستثناة|باستثناء|غير متاح(?:ة)? في|غير مؤهل(?:ة)? في|محظور(?:ة)? في|مقيّد(?:ة)? في/u.test(text)
  );
}

/**
 * A country is called supported or excluded only when the reviewed record has a
 * matching country field, a secure official-source claim, and no relevant
 * unknown marker. Missing restrictions and provider wording never imply support.
 */
export function countryAvailability(deal: Deal, selectedCountry: string): CountryAvailability {
  const country = canonicalCountry(selectedCountry);
  if (!country || markedCountryUnknown(deal, country) || !hasReviewedRecord(deal)) return 'unknown';

  const countries = deal.eligibility?.countries;
  if (!countries) return 'unknown';
  const status = fieldName(countries.status).replace(/[\s-]+/gu, '_');
  const values = Array.isArray(countries.values) ? countries.values : [];
  const isListed = values.some(
    (value) => typeof value === 'string' && canonicalCountry(value) === country
  );
  const claims = sourceClaims(deal);
  if (claims.length === 0) return 'unknown';

  if (GLOBAL_COUNTRY_STATES.has(status)) {
    const supportedGlobally = claims.some((claim) => {
      const field = fieldName(claim.field);
      const fieldSupportsGlobal =
        field === 'eligibility.countries' || field === 'eligibility.countries.status';
      return fieldSupportsGlobal && explicitGlobalEvidence(claimText(claim));
    });
    if (supportedGlobally) return 'supported';
  }

  if (isListed && INCLUDED_COUNTRY_STATES.has(status)) {
    const supportedByCountryClaim = claims.some(
      (claim) =>
        mentionsCountry(claim.value, country) || mentionsCountry(claim.evidence, country)
    );
    if (supportedByCountryClaim) return 'supported';
  }

  if (isListed && EXCLUDED_COUNTRY_STATES.has(status)) {
    const excludedByCountryClaim = claims.some((claim) => {
      const text = claimText(claim);
      return mentionsCountry(text, country) && explicitExclusion(text);
    });
    if (excludedByCountryClaim) return 'excluded';
  }

  return 'unknown';
}

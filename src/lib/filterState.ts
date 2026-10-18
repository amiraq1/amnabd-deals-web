import type { ApplicantFilter, CardFilter, FilterState, SortOption } from '@/types';
import { categoryKey } from './discovery.js';

export const DEFAULT_FILTER_STATE: FilterState = {
  q: '',
  category: 'all',
  applicant: 'all',
  card: 'all',
  sort: 'default',
};

const ALLOWED_APPLICANT = new Set<ApplicantFilter>(['all', 'student', 'any']);
const ALLOWED_CARD = new Set<CardFilter>(['all', 'not_required']);
const ALLOWED_SORT = new Set<SortOption>(['default', 'reviewed', 'deadline']);

export function parseFilterState(
  rawSearch: string,
  validCategories?: Set<string>
): FilterState {
  const result: FilterState = { ...DEFAULT_FILTER_STATE };
  if (!rawSearch || typeof rawSearch !== 'string') return result;

  const qIndex = rawSearch.indexOf('?');
  const searchPart = qIndex >= 0 ? rawSearch.slice(qIndex + 1) : rawSearch;
  if (!searchPart.trim()) return result;

  // URLSearchParams handles decoding without throwing URIError on single % or 50%
  const params = new URLSearchParams(searchPart);

  // q: text, trimmed and truncated to 120 chars
  const rawQ = params.get('q');
  if (typeof rawQ === 'string') {
    result.q = rawQ.trim().slice(0, 120);
  }

  // category: validated against approved discovery keys
  const rawCat = params.get('category');
  if (typeof rawCat === 'string' && rawCat.trim()) {
    const trimmedCat = rawCat.trim();
    if (trimmedCat === 'all') {
      result.category = 'all';
    } else {
      const normalizedKey = categoryKey(trimmedCat);
      if (validCategories) {
        if (validCategories.has(normalizedKey)) {
          result.category = normalizedKey;
        } else {
          result.category = 'all';
          result.invalidCategory = trimmedCat;
        }
      } else {
        result.category = normalizedKey || 'all';
      }
    }
  }

  // applicant: allowed values only, falls back to 'all'
  const rawApplicant = params.get('applicant');
  if (rawApplicant && ALLOWED_APPLICANT.has(rawApplicant as ApplicantFilter)) {
    result.applicant = rawApplicant as ApplicantFilter;
  }

  // card: allowed values only, falls back to 'all'
  const rawCard = params.get('card');
  if (rawCard && ALLOWED_CARD.has(rawCard as CardFilter)) {
    result.card = rawCard as CardFilter;
  }

  // sort: allowed values only, falls back to 'default'
  const rawSort = params.get('sort');
  if (rawSort && ALLOWED_SORT.has(rawSort as SortOption)) {
    result.sort = rawSort as SortOption;
  }

  return result;
}

// Serializes FilterState with fixed key order: q, category, applicant, card, sort.
// invalidCategory is intentionally omitted so any subsequent state change cleans the URL.
export function serializeFilterState(state: FilterState): string {
  const params = new URLSearchParams();

  const q = state.q?.trim().slice(0, 120);
  if (q) params.set('q', q);

  if (state.category && state.category !== 'all') {
    params.set('category', state.category);
  }

  if (state.applicant && state.applicant !== 'all') {
    params.set('applicant', state.applicant);
  }

  if (state.card && state.card !== 'all') {
    params.set('card', state.card);
  }

  if (state.sort && state.sort !== 'default') {
    params.set('sort', state.sort);
  }

  return params.toString();
}

export function buildDiscoveryHash(state: FilterState): string {
  const qs = serializeFilterState(state);
  return qs ? `#/?${qs}` : '#/';
}

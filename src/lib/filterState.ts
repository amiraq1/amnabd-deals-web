import type { ApplicantFilter, CardFilter, FilterState, SortOption } from '@/types';
import { categoryKey } from './discovery.js';

export const DEFAULT_FILTER_STATE: Readonly<FilterState> = Object.freeze({
  q: '',
  category: null,
  uncategorized: false,
  categoryValidation: 'valid',
  applicant: 'all',
  card: 'all',
  sort: 'default',
});
const APPLICANTS = new Set<ApplicantFilter>(['all', 'student', 'any']);
const CARDS = new Set<CardFilter>(['all', 'not_required']);
const SORTS = new Set<SortOption>([
  'default',
  'reviewed',
  'deadline',
  'ending_soon',
  'highest_value',
]);
export function cleanQuery(value: string): string {
  return Array.from(value.replace(/[\p{Cc}]/gu, ' ').trim())
    .slice(0, 120)
    .join('');
}

export function validateFilterState(
  state: FilterState,
  validCategories?: ReadonlySet<string>
): FilterState {
  const next = { ...state };
  if (state.filterError === 'conflict' || state.filterError === 'uncategorized') {
    next.category = null;
    next.uncategorized = false;
    next.categoryValidation = 'invalid';
  } else if (state.category !== null) {
    if (!validCategories) {
      next.categoryValidation = 'pending';
      return next;
    }
    if (!state.category || !validCategories.has(state.category)) {
      next.category = null;
      next.filterError = 'category';
      next.invalidCategory = state.category;
      next.categoryValidation = 'invalid';
    } else next.categoryValidation = 'valid';
  } else next.categoryValidation = validCategories || !state.uncategorized ? 'valid' : 'pending';
  return next;
}

export function parseFilterState(
  rawSearch: string,
  validCategories?: ReadonlySet<string>
): FilterState {
  const result: FilterState = { ...DEFAULT_FILTER_STATE };
  const search = typeof rawSearch === 'string' ? rawSearch : '';
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  result.q = cleanQuery(params.get('q') ?? '');
  if (params.has('category')) result.category = categoryKey(params.get('category'));
  if (params.has('uncategorized')) {
    if (params.get('uncategorized') !== '1') result.filterError = 'uncategorized';
    else result.uncategorized = true;
  }
  if (params.has('category') && result.uncategorized) result.filterError = 'conflict';
  const applicant = params.get('applicant');
  const card = params.get('card');
  const sort = params.get('sort');
  if (APPLICANTS.has(applicant as ApplicantFilter)) result.applicant = applicant as ApplicantFilter;
  if (CARDS.has(card as CardFilter)) result.card = card as CardFilter;
  if (SORTS.has(sort as SortOption)) result.sort = sort as SortOption;
  return validateFilterState(result, validCategories);
}

// Fixed order; diagnostic/pending state is never emitted as a URL parameter.
// A pending raw category is retained until data can validate it; invalid state is cleaned.
export function serializeFilterState(state: FilterState): string {
  const params = new URLSearchParams();
  const q = cleanQuery(state.q);
  if (q) params.set('q', q);
  if (!state.filterError) {
    if (state.category !== null && state.category && !state.uncategorized)
      params.set('category', categoryKey(state.category));
    else if (state.uncategorized && state.category === null) params.set('uncategorized', '1');
  }
  if (APPLICANTS.has(state.applicant) && state.applicant !== 'all')
    params.set('applicant', state.applicant);
  if (CARDS.has(state.card) && state.card !== 'all') params.set('card', state.card);
  if (SORTS.has(state.sort) && state.sort !== 'default') params.set('sort', state.sort);
  return params.toString();
}
export function buildDiscoveryHash(state: FilterState): string {
  const search = serializeFilterState(state);
  return search ? `#/?${search}` : '#/';
}

/**
 * The filter query as it appears in the address bar (A01). The home route is
 * `/`, so the filters are `/?q=…` — no hash involved.
 */
export function buildDiscoverySearch(state: FilterState): string {
  const search = serializeFilterState(state);
  return search ? `?${search}` : '';
}

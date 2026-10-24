import { parseLanguageFromSearch } from './languageStorage.js';

export interface Route {
  name: 'home' | 'guide' | 'deal' | 'notfound' | 'favorites' | 'changelog' | 'collection';
  slug?: string;
  collectionKey?: string;
}

export function isValidSlug(value: string): boolean {
  return (
    value.length > 0 &&
    value.length <= 200 &&
    !/[/\\?#]/.test(value) &&
    !Array.from(value).some((char) => char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127)
  );
}

export function extractHashSearch(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  const qIndex = raw.indexOf('?');
  return qIndex >= 0 ? raw.slice(qIndex + 1) : '';
}

export function parseHash(raw: unknown): Route {
  if (typeof raw !== 'string') return { name: 'notfound' };
  const withoutHash = raw.replace(/^#/, '');
  const qIndex = withoutHash.indexOf('?');
  const pathPart = qIndex >= 0 ? withoutHash.slice(0, qIndex) : withoutHash;
  const cleanPath = pathPart.replace(/^\/+/, '');

  if (!cleanPath) return { name: 'home' };

  const parts = cleanPath.split('/');
  if (parts.length > 1 && parts[parts.length - 1] === '') parts.pop();
  const first = parts[0];
  if (parts.length === 1 && first) {
    if (first === 'guide') return { name: 'guide' };
    if (first === 'favorites') return { name: 'favorites' };
    if (first === 'changelog') return { name: 'changelog' };
    if (['for-students', 'no-credit-card', 'coding', 'ending-soon'].includes(first)) {
      return { name: 'collection', collectionKey: first };
    }
  }
  if (parts.length !== 2 || parts[0] !== 'deal' || !parts[1]) return { name: 'notfound' };
  try {
    const slug = decodeURIComponent(parts[1]);
    return isValidSlug(slug) ? { name: 'deal', slug } : { name: 'notfound' };
  } catch {
    return { name: 'notfound' };
  }
}

export function routeHash(route: Route): string {
  if (route.name === 'home') return '#/';
  if (route.name === 'guide') return '#/guide';
  if (route.name === 'favorites') return '#/favorites';
  if (route.name === 'changelog') return '#/changelog';
  if (route.name === 'collection' && route.collectionKey) {
    return `#/${route.collectionKey}`;
  }
  if (route.name === 'deal' && typeof route.slug === 'string' && isValidSlug(route.slug)) {
    try {
      return `#/deal/${encodeURIComponent(route.slug)}`;
    } catch {
      return '#/404';
    }
  }
  return '#/404';
}

export function routePath(route: Route): string {
  if (route.name === 'home') return '/';
  if (route.name === 'guide') return '/guide';
  if (route.name === 'favorites') return '/favorites';
  if (route.name === 'changelog') return '/changelog';
  if (route.name === 'collection' && route.collectionKey) {
    return `/${route.collectionKey}`;
  }
  if (route.name === 'deal' && typeof route.slug === 'string' && isValidSlug(route.slug)) {
    try {
      return `/deal/${encodeURIComponent(route.slug)}`;
    } catch {
      return '/404';
    }
  }
  return '/404';
}

/**
 * One URL for a route plus its filter query (A01).
 *
 * The path is the address of the page — GitHub Pages serves a real file for
 * each one — so navigation writes `pathname` and filters live in `search`.
 * Nothing in the app writes a `#/` hash any more; the hash survives only as an
 * input for links shared before this change.
 */
export function routeUrl(route: Route, search = ''): string {
  const path = routePath(route);
  const query = search.replace(/^\?/, '');
  return query ? `${path}?${query}` : path;
}

export interface LegacyLocation {
  pathname: string;
  search: string;
  hash: string;
}

const FILTER_KEYS = ['q', 'category', 'uncategorized', 'applicant', 'card', 'sort'] as const;

/**
 * A pre-A01 link put the route and its filters in the hash (`/#/deal/x?q=…`).
 * This converts one of those into the path-based URL exactly once, before the
 * first render, so nothing downstream has to know the hash ever existed.
 *
 * Non-filter parameters already in `search` (`list=` is the shared favourites
 * list) are carried over: the hash only contributes the route and the filters.
 * Returns `null` when the location is already modern.
 */
export function migrateLegacyHashLocation(location: LegacyLocation): string | null {
  const hash = typeof location.hash === 'string' ? location.hash : '';
  if (!hash.startsWith('#/')) return null;

  const route = parseHash(hash);
  const searchParams = new URLSearchParams(location.search.replace(/^\?/, ''));
  const hashParams = new URLSearchParams(extractHashSearch(hash));
  const merged = new URLSearchParams();

  // `append`, not `set`: `?q=Alpha&q=Beta` means "Alpha" to `parseFilterState`
  // (first value wins), and collapsing the pair would silently change what the
  // shared link asks for. Duplicates and their order are preserved.
  for (const [key, value] of searchParams) {
    if (key !== 'lang' && !(FILTER_KEYS as readonly string[]).includes(key))
      merged.append(key, value);
  }
  const language =
    parseLanguageFromSearch(location.search) ?? parseLanguageFromSearch(extractHashSearch(hash));
  if (language) merged.append('lang', language);
  // Filters come from the modern query when it has any, otherwise from the hash.
  const filterSource = hasFilterParams(location.search) ? searchParams : hashParams;
  for (const [key, value] of filterSource) {
    if ((FILTER_KEYS as readonly string[]).includes(key)) merged.append(key, value);
  }

  const query = merged.toString();
  return routeUrl(route, query ? `?${query}` : '');
}

/** The route a pathname describes. Legacy hash input is migrated before this. */
export function parseLocationRoute(pathname: string): Route {
  return parseHash(pathname);
}

/** True when the query string carries at least one filter key (not `list=`). */
export function hasFilterParams(search: string): boolean {
  if (!search) return false;
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  return FILTER_KEYS.some((key) => params.has(key));
}

/**
 * An in-page anchor (`#main-content`) does fire `popstate` in Chromium. It
 * changes only the hash, so it must not be treated as a navigation: cancelling
 * a debounced filter write here reverted the search box to the previous query
 * (A01 regression).
 */
export function isHashOnlyLocationChange(
  pathname: string,
  search: string,
  lastAppliedPath: string | undefined,
  lastAppliedSearch: string | undefined
): boolean {
  return (
    pathname === (lastAppliedPath ?? '/') &&
    (search ?? '').replace(/^\?/, '') === (lastAppliedSearch ?? '')
  );
}

/**
 * The filter state has exactly one source (H-01).
 *
 * Modern links put filters in `location.search` (`/?q=…&sort=…`). Legacy links
 * put them in the hash (`#/?q=…`). The query string wins whenever it actually
 * carries a filter key, so a normalized URL keeps its state across a reload;
 * the hash is only a fallback for old bookmarks. A query that carries something
 * else (`?list=…`) does not shadow the legacy hash.
 */
export function filterSearchFromLocation(search: string, hash: string): string {
  const modern = typeof search === 'string' ? search : '';
  if (hasFilterParams(modern)) return modern.startsWith('?') ? modern.slice(1) : modern;
  return extractHashSearch(hash);
}

/**
 * `#main-content` and friends are in-page anchors, not routes. Re-routing on
 * them used to reset the filters and the scroll position (H-10).
 */
export function isInPageHash(hash: string): boolean {
  return typeof hash === 'string' && hash.length > 1 && !hash.startsWith('#/');
}

export interface LocationChangeInput {
  pathname: string;
  search: string;
  /** Pathname of the last applied location, e.g. `/deal/alpha`. */
  lastAppliedPath?: string;
  /** Filter query of the last applied location. */
  lastAppliedSearch?: string;
  hadPending: boolean;
}

export interface LocationChange {
  apply: boolean;
  route: Route;
  filterSearch: string;
}

/**
 * Pure decision for a `popstate`, so back/forward can be tested without a
 * browser (A01).
 *
 * The pathname and the query are the only things compared, because they are
 * the only things the app writes. A location with an in-page anchor
 * (`#main-content`) is not a navigation: `popstate` never fires for it, and if
 * one arrives it leaves the pathname unchanged, so it resolves to "do not
 * apply" without a special case.
 */
export function resolveLocationChange(input: LocationChangeInput): LocationChange {
  const pathname = typeof input.pathname === 'string' ? input.pathname : '/';
  const filterSearch = (input.search ?? '').replace(/^\?/, '');
  const pathChanged = pathname !== (input.lastAppliedPath ?? '/');
  const searchChanged = filterSearch !== (input.lastAppliedSearch ?? '');
  if (!input.hadPending && !pathChanged && !searchChanged) {
    return { apply: false, route: parseHash(pathname), filterSearch };
  }
  return { apply: true, route: parseHash(pathname), filterSearch };
}

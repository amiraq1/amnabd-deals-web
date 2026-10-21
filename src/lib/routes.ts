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

export function normalizeLegacyHashRoute(): void {
  if (typeof window === 'undefined') return;
  const { hash, search } = window.location;
  if (hash.startsWith('#/')) {
    const cleanPath = hash.slice(1);
    window.history.replaceState(null, '', `${cleanPath}${search}`);
  }
}

export function parseLocationRoute(pathname: string, hash = ''): Route {
  if (hash && hash.startsWith('#/')) {
    return parseHash(hash);
  }
  return parseHash(pathname);
}

const FILTER_KEYS = ['q', 'category', 'uncategorized', 'applicant', 'card', 'sort'] as const;

/** True when the query string carries at least one filter key (not `list=`). */
export function hasFilterParams(search: string): boolean {
  if (!search) return false;
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  return FILTER_KEYS.some((key) => params.has(key));
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
  hash: string;
  lastAppliedHash: string;
  /** Filter query of the last applied location; `popstate` can change only this. */
  lastAppliedSearch?: string;
  hadPending: boolean;
}

export interface LocationChange {
  apply: boolean;
  route: Route;
  filterSearch: string;
}

/**
 * Pure decision for a `popstate`/`hashchange` event, so back/forward can be
 * tested without a browser.
 *
 * Back/forward between two filtered links changes `location.search` without
 * touching the hash, so comparing the hash alone would skip the update. Both
 * the route hash and the filter query are compared.
 */
export function resolveLocationChange(input: LocationChangeInput): LocationChange {
  const hash = typeof input.hash === 'string' ? input.hash : '';
  if (isInPageHash(hash)) {
    return { apply: false, route: parseHash(input.pathname), filterSearch: '' };
  }
  const filterSearch = filterSearchFromLocation(input.search, hash);
  const hashChanged = (hash || '#/') !== input.lastAppliedHash;
  const searchChanged = filterSearch !== (input.lastAppliedSearch ?? '');
  if (!input.hadPending && !hashChanged && !searchChanged) {
    return { apply: false, route: parseHash(input.pathname), filterSearch };
  }
  return {
    apply: true,
    route: parseLocationRoute(input.pathname, hash),
    filterSearch,
  };
}

export interface Route {
  name: 'home' | 'guide' | 'deal' | 'notfound';
  slug?: string;
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
  if (parts.length === 1 && parts[0] === 'guide') return { name: 'guide' };
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
  if (route.name === 'deal' && typeof route.slug === 'string' && isValidSlug(route.slug)) {
    try {
      return `#/deal/${encodeURIComponent(route.slug)}`;
    } catch {
      return '#/404';
    }
  }
  return '#/404';
}

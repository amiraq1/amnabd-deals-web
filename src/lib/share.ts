import { isValidSlug, routePath } from './routes.js';

const ROUTE_TAIL = /^(.*?)(?:\/(?:deal\/[^/]+|guide|favorites|changelog|for-students|no-credit-card|coding|ending-soon))?$/;

/** The directory the app is served from, so a subdirectory deploy still works. */
function hostingBase(pathname: string): string {
  const clean = pathname.replace(/\/+$/, '');
  const match = clean.match(ROUTE_TAIL);
  return `${match?.[1] ?? ''}/`;
}

export function buildDealLink(pageUrl: string, slug: string): string | null {
  if (!isValidSlug(slug)) return null;
  try {
    const path = routePath({ name: 'deal', slug });
    if (path === '/404') return null;
    const url = new URL(pageUrl);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null;
    // A01: the shared link is the page's own path, not a `#/deal/…` hash.
    // Preserve the host and any subdirectory; drop tracking queries.
    url.pathname = hostingBase(url.pathname) + path.replace(/^\//, '');
    url.search = '';
    url.hash = '';
    return url.href;
  } catch {
    return null;
  }
}

export async function copyLink(
  link: string,
  write: ((text: string) => Promise<void>) | undefined,
  timeoutMs = 5000
): Promise<boolean> {
  if (!write) return false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    // Permission prompts/adapters may never settle; offer manual copying instead.
    const timeout = new Promise<boolean>((resolve) => {
      timer = setTimeout(() => resolve(false), timeoutMs);
    });
    const written = Promise.resolve()
      .then(() => write(link))
      .then(() => true);
    return await Promise.race([written, timeout]);
  } catch {
    return false;
  } finally {
    // Never log browser errors or the user's clipboard.
    if (timer !== undefined) clearTimeout(timer);
  }
}

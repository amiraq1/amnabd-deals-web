import { isValidSlug, routePath } from './routes.js';

export function buildDealLink(pageUrl: string, slug: string): string | null {
  if (!isValidSlug(slug)) return null;
  try {
    const path = routePath({ name: 'deal', slug });
    if (path === '/404') return null;
    const url = new URL(pageUrl);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null;
    // A01: the shared link is the page's own path, not a `#/deal/…` hash.
    //
    // The path is absolute on purpose. Deriving a "hosting base" from the
    // current pathname guessed wrong for every non-route page (`/404` became
    // `/404/deal/x`), and a subdirectory deploy needs the router and the build
    // `base` configured for it anyway — not an inference made here.
    url.pathname = path;
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

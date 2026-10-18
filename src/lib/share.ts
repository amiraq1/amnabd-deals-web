import { isValidSlug, routeHash } from './routes.js';

export function buildDealLink(pageUrl: string, slug: string): string | null {
  if (!isValidSlug(slug)) return null;
  try {
    const hash = routeHash({ name: 'deal', slug });
    if (hash === '#/404') return null;
    const url = new URL(pageUrl);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null;
    // Preserve custom-domain/subdirectory hosting; don't share tracking or other queries.
    url.search = '';
    url.hash = hash;
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

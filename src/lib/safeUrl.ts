import type { Deal } from '@/types';

const BLOCKED_HOSTS = ['studentoffers.co', 'www.studentoffers.co'];

// Only HTTPS is accepted: a plain-HTTP "official source" would downgrade the
// user's connection and cannot be trusted to be the provider's real page.
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    return !BLOCKED_HOSTS.includes(parsed.hostname);
  } catch {
    return false;
  }
}

export function safeUrl(url: string): string | null {
  return isSafeUrl(url) ? url : null;
}

export function resolveDealOfficialUrl(
  deal: Pick<Deal, 'official_sources' | 'get_offer'>
): string | null {
  const firstSourceUrl = deal.official_sources?.[0]?.url;
  const safeFirst = firstSourceUrl ? safeUrl(firstSourceUrl) : null;
  if (safeFirst) return safeFirst;
  return deal.get_offer?.url ? safeUrl(deal.get_offer.url) : null;
}

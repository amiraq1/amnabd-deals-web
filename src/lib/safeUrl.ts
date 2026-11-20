import type { Deal } from '@/types';
import { isTrustedExternalHost } from './trustedDomains.js';

const BLOCKED_HOSTS = ['studentoffers.co', 'www.studentoffers.co'];

function isIpLiteral(hostname: string): boolean {
  // URL canonicalizes accepted IPv4 shorthand, octal, and hexadecimal forms
  // to dotted decimal; IPv6 hostnames retain their surrounding brackets.
  return (
    (hostname.startsWith('[') && hostname.endsWith(']')) ||
    /^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname)
  );
}

function isLocalHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  return host === 'localhost' || host.endsWith('.localhost');
}

// Only HTTPS on the default port is accepted: a plain-HTTP "official source"
// would downgrade the user's connection, credentials in the URL can be used
// for phishing, and literal IP or localhost destinations must never be
// reachable through a catalog link.
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    if (parsed.username || parsed.password) return false;
    if (parsed.port !== '') return false;
    if (BLOCKED_HOSTS.includes(parsed.hostname)) return false;
    return !isIpLiteral(parsed.hostname) && !isLocalHostname(parsed.hostname);
  } catch {
    return false;
  }
}

export function safeUrl(url: string): string | null {
  return isSafeUrl(url) ? url : null;
}

/** Deal links must also belong to a reviewed provider domain. */
export function isTrustedDealUrl(url: string): boolean {
  if (!isSafeUrl(url)) return false;
  try {
    return isTrustedExternalHost(new URL(url).hostname);
  } catch {
    return false;
  }
}

export function safeDealUrl(url: string): string | null {
  return isTrustedDealUrl(url) ? url : null;
}

export function resolveDealOfficialUrl(
  deal: Pick<Deal, 'official_sources' | 'get_offer'>
): string | null {
  const firstSourceUrl = deal.official_sources?.[0]?.url;
  const safeFirst = firstSourceUrl ? safeDealUrl(firstSourceUrl) : null;
  if (safeFirst) return safeFirst;
  return deal.get_offer?.url ? safeDealUrl(deal.get_offer.url) : null;
}

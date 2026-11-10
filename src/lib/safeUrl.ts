import type { Deal } from '@/types';

const BLOCKED_HOSTS = ['studentoffers.co', 'www.studentoffers.co'];

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split('.');
  if (parts.length !== 4 || !parts.every((part) => /^\d{1,3}$/.test(part))) return false;
  const octets = parts.map(Number);
  if (octets.some((octet) => octet > 255)) return false;
  const [a = 0, b = 0] = octets;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  );
}

function isPrivateIpv6(hostname: string): boolean {
  if (!hostname.startsWith('[') || !hostname.endsWith(']')) return false;
  const address = hostname.slice(1, -1).toLowerCase();
  return (
    address === '::1' ||
    address === '::' ||
    /^f[cd][0-9a-f]{2}:/.test(address) ||
    /^fe[89ab][0-9a-f]:/.test(address)
  );
}

function isPrivateHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  if (host === 'localhost' || host.endsWith('.localhost')) return true;
  return isPrivateIpv4(host) || isPrivateIpv6(host);
}

// Only HTTPS on the default port is accepted: a plain-HTTP "official source"
// would downgrade the user's connection, credentials in the URL can be used
// for phishing, and loopback/private addresses must never be reachable through
// a catalog link.
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    if (parsed.username || parsed.password) return false;
    if (parsed.port !== '') return false;
    if (BLOCKED_HOSTS.includes(parsed.hostname)) return false;
    return !isPrivateHostname(parsed.hostname);
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

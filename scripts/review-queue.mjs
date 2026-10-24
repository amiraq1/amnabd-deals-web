// Operator-invoked, read-only review queue. It reads only the public deals
// projection through the anon/publishable key and never writes to Supabase.
// Source-fetch failures are review signals only; they never change offer status.
import { request as httpsRequest } from 'node:https';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadPublicDealRecords,
  sharedSeo,
} from './generate-static-seo.mjs';
import { inspectDealDeadlineCoverage } from './deal-deadline-guard.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DAY_MS = 24 * 60 * 60 * 1000;
const REVIEW_AGE_DAYS = 30;
const FETCH_TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 5;
const SOURCE_CONCURRENCY = 4;
const REPORTS_UNAVAILABLE_REASON =
  'User reports are excluded: the live public schema has no deal_reports table, and this local tool has no safe non-public read path. The repository migration alone is not treated as live report data.';

function parseCalendarDay(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const milliseconds = Date.parse(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(milliseconds)) return null;
  return new Date(milliseconds).toISOString().slice(0, 10) === value ? milliseconds : null;
}

function asOfDay(value) {
  if (value instanceof Date && Number.isFinite(value.getTime()))
    return value.toISOString().slice(0, 10);
  if (typeof value === 'string' && parseCalendarDay(value) !== null) return value;
  throw new TypeError('asOf must be a valid Date or YYYY-MM-DD calendar day.');
}

function ipv6Words(address) {
  const input = address.toLowerCase().split('%')[0];
  if (input.includes('.')) return null;
  const pieces = input.split('::');
  if (pieces.length > 2) return null;
  const left = pieces[0] ? pieces[0].split(':') : [];
  const right = pieces.length === 2 && pieces[1] ? pieces[1].split(':') : [];
  const missing = 8 - left.length - right.length;
  if ((pieces.length === 1 && missing !== 0) || (pieces.length === 2 && missing < 1)) return null;
  const words = [...left, ...Array(Math.max(0, missing)).fill('0'), ...right].map((word) => Number.parseInt(word || '0', 16));
  return words.length === 8 && words.every((word) => Number.isInteger(word) && word >= 0 && word <= 0xffff)
    ? words
    : null;
}

function isPublicAddress(address) {
  const family = isIP(address);
  if (family === 4) {
    const [a, b, c] = address.split('.').map(Number);
    if (
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0 && (c === 0 || c === 2)) ||
      (a === 192 && b === 88 && c === 99) ||
      (a === 198 && (b === 18 || b === 19)) ||
      (a === 198 && b === 51 && c === 100) ||
      (a === 203 && b === 0 && c === 113)
    ) return false;
    return true;
  }
  if (family === 6) {
    const words = ipv6Words(address);
    if (!words) return false;
    // Permit only IPv6 global-unicast space, excluding the documentation prefix.
    return words[0] >= 0x2000 && words[0] <= 0x3fff && !(words[0] === 0x2001 && words[1] === 0x0db8);
  }
  return false;
}

function normalizePublicHttpsUrl(rawUrl, baseUrl) {
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) return { ok: false, reason: 'missing_source_url' };
  let url;
  try {
    url = baseUrl ? new URL(rawUrl, baseUrl) : new URL(rawUrl.trim());
  } catch {
    return { ok: false, reason: 'invalid_source_url' };
  }
  const hostname = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    !hostname ||
    isIP(hostname) ||
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.test') ||
    hostname.endsWith('.invalid') ||
    hostname.endsWith('.example') ||
    !hostname.includes('.')
  ) return { ok: false, reason: 'unsafe_or_non_https_source_url' };
  url.hash = '';
  return { ok: true, url };
}

async function hostIsPublic(hostname, lookupImpl) {
  let addresses;
  try {
    addresses = await lookupImpl(hostname, { all: true, verbatim: true });
  } catch {
    return { ok: false, reason: 'dns_lookup_failed' };
  }
  if (!Array.isArray(addresses) || addresses.length === 0)
    return { ok: false, reason: 'dns_lookup_failed' };
  if (!addresses.every((entry) => entry && isPublicAddress(entry.address)))
    return { ok: false, reason: 'unsafe_destination' };
  return {
    ok: true,
    address: addresses[0].address,
    family: addresses[0].family || isIP(addresses[0].address),
  };
}

export function createPinnedLookup(address, family) {
  if (!isPublicAddress(address) || family !== isIP(address))
    throw new TypeError('Pinned lookup requires a validated public IP address and matching family.');
  return (_hostname, options, callback) => {
    if (options?.all) callback(null, [{ address, family }]);
    else callback(null, address, family);
  };
}

function requestPinnedHttps(url, method, { address, family, timeoutMs }) {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    timer.unref?.();
    let settled = false;
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      callback(value);
    };
    let request;
    try {
      request = httpsRequest(
        url,
        {
          method,
          agent: false,
          signal: controller.signal,
          // Pin the actual socket lookup to the public IP already checked above.
          // TLS still uses the URL hostname for SNI and certificate validation.
          lookup: createPinnedLookup(address, family),
          ...(method === 'GET' ? { headers: { Range: 'bytes=0-0' } } : {}),
        },
        (response) => {
          const result = {
            status: Number(response.statusCode) || 0,
            location: typeof response.headers.location === 'string' ? response.headers.location : null,
          };
          response.destroy();
          finish(resolve, result);
        }
      );
    } catch (error) {
      finish(reject, error);
      return;
    }
    request.on('error', (error) => finish(reject, error));
    request.end();
  });
}

/** Check an HTTPS source without following unsafe URLs or reading response bodies. */
export async function checkSourceUrl(rawUrl, {
  requestImpl = requestPinnedHttps,
  lookupImpl = lookup,
  timeoutMs = FETCH_TIMEOUT_MS,
  maxRedirects = MAX_REDIRECTS,
} = {}) {
  if (typeof requestImpl !== 'function') return { ok: false, reason: 'request_unavailable' };
  let normalized = normalizePublicHttpsUrl(rawUrl);
  if (!normalized.ok) return normalized;
  let current = normalized.url;
  let method = 'HEAD';
  const visited = new Set();
  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount += 1) {
    const target = current.href;
    if (visited.has(target)) return { ok: false, reason: 'redirect_loop' };
    visited.add(target);
    const host = await hostIsPublic(current.hostname, lookupImpl);
    if (!host.ok) return host;
    let response;
    try {
      response = await requestImpl(current, method, {
        address: host.address,
        family: host.family,
        timeoutMs,
      });
    } catch (error) {
      return {
        ok: false,
        reason: error?.name === 'AbortError' || error?.code === 'ETIMEDOUT' ? 'timeout' : 'network_error',
      };
    }
    const status = Number(response?.status) || 0;
    if (method === 'HEAD' && (status === 405 || status === 501)) {
      visited.delete(target);
      method = 'GET';
      redirectCount -= 1;
      continue;
    }
    if (status >= 300 && status < 400) {
      const location = response.location;
      if (!location) return { ok: false, reason: 'redirect_without_location', http_status: status };
      if (redirectCount === maxRedirects) return { ok: false, reason: 'too_many_redirects' };
      normalized = normalizePublicHttpsUrl(location, current);
      if (!normalized.ok) return { ok: false, reason: 'unsafe_redirect' };
      current = normalized.url;
      method = 'HEAD';
      continue;
    }
    return status >= 200 && status < 300
      ? { ok: true, http_status: status }
      : { ok: false, reason: status ? `http_${status}` : 'network_error', http_status: status || null };
  }
  return { ok: false, reason: 'too_many_redirects' };
}

/** Check each distinct source URL once with bounded concurrency. */
export async function inspectSourceFetches(deals, dependencies = {}) {
  if (!Array.isArray(deals)) throw new TypeError('Source inspection expects a deal array.');
  const targets = [];
  for (const deal of deals) {
    const sources = Array.isArray(deal?.official_sources) ? deal.official_sources : [];
    const urls = sources.map((source) => source?.url).filter((url) => typeof url === 'string' && url.trim());
    if (urls.length === 0) {
      targets.push({ slug: deal?.slug, source_url: null, result: { ok: false, reason: 'no_official_source_url' } });
      continue;
    }
    for (const url of urls) targets.push({ slug: deal?.slug, source_url: url.trim() });
  }
  const uniqueUrls = [...new Set(targets.map((target) => target.source_url).filter(Boolean))];
  const results = new Map();
  let next = 0;
  const concurrency = Math.max(1, Math.min(SOURCE_CONCURRENCY, Number(dependencies.concurrency) || SOURCE_CONCURRENCY));
  const workers = Array.from({ length: Math.min(concurrency, uniqueUrls.length) }, async () => {
    while (next < uniqueUrls.length) {
      const index = next;
      next += 1;
      const url = uniqueUrls[index];
      results.set(url, await checkSourceUrl(url, dependencies));
    }
  });
  await Promise.all(workers);
  return targets.map((target) => ({
    ...target,
    result: target.result ?? results.get(target.source_url) ?? { ok: false, reason: 'network_error' },
  }));
}

/** Pure report builder: it never mutates records or changes an offer's status. */
export function buildReviewQueue(deals, {
  now = new Date(),
  sourceChecks = [],
  timestampInstant = sharedSeo.timestampInstant,
} = {}) {
  if (!Array.isArray(deals)) throw new TypeError('Review queue expects a deal array.');
  if (!Array.isArray(sourceChecks)) throw new TypeError('sourceChecks must be an array.');
  const reportDay = asOfDay(now);
  const reportDayMs = parseCalendarDay(reportDay);
  const staleReviews = [];
  for (const deal of deals) {
    if (!deal || typeof deal.slug !== 'string') continue;
    const reviewedOn = deal.review?.reviewed_on;
    const reviewedMs = parseCalendarDay(reviewedOn);
    if (reviewedMs === null || reviewedMs > reportDayMs) {
      staleReviews.push({
        slug: deal.slug,
        reviewed_on: typeof reviewedOn === 'string' ? reviewedOn : null,
        reason: reviewedMs === null ? 'missing_or_invalid_review_date' : 'future_review_date',
        status: 'review needed',
      });
      continue;
    }
    const daysSinceReview = Math.floor((reportDayMs - reviewedMs) / DAY_MS);
    if (daysSinceReview > REVIEW_AGE_DAYS) {
      staleReviews.push({
        slug: deal.slug,
        reason: 'review_older_than_30_days',
        reviewed_on: reviewedOn,
        days_since_review: daysSinceReview,
        status: 'review needed',
      });
    }
  }
  const sourceFetchFailures = sourceChecks
    .filter((check) => !check?.result?.ok)
    .map((check) => ({
      slug: check.slug,
      source_url: check.source_url,
      reason: check.result?.reason ?? 'network_error',
      http_status: check.result?.http_status ?? null,
      status: 'could not fetch / review needed',
    }));
  const deadlineCoverage = inspectDealDeadlineCoverage(deals, { timestampInstant });
  const dateWindowMissingEndsAt = [...deadlineCoverage.violations, ...deadlineCoverage.warnings].map((issue) => ({
    slug: issue.slug,
    paths: issue.paths,
    reason: issue.reason,
    status: 'review needed',
  }));
  return {
    generated_at: new Date().toISOString(),
    as_of: reportDay,
    source: 'public Supabase deals projection; anonymous/publishable-key read only',
    read_only: true,
    writes_performed: false,
    checked_deals: deals.length,
    source_entries_checked: sourceChecks.length,
    source_entries_fetched: sourceChecks.filter((check) => check?.result?.ok).length,
    stale_reviews: staleReviews,
    source_fetch_failures: sourceFetchFailures,
    date_window_missing_ends_at: dateWindowMissingEndsAt,
    user_reports: {
      included: false,
      reason: REPORTS_UNAVAILABLE_REASON,
    },
    safety_note: 'A failed source fetch or a text-only date window is a review signal only. This tool never marks an offer expired and never writes offer status.',
  };
}

function readAsOfArgument(args) {
  if (args.length === 0) return new Date();
  if (args.length !== 2 || args[0] !== '--as-of' || parseCalendarDay(args[1]) === null)
    throw new Error('Usage: npm run review:queue [-- --as-of YYYY-MM-DD]');
  return args[1];
}

async function main() {
  const now = readAsOfArgument(process.argv.slice(2));
  const deals = await loadPublicDealRecords({ rootDir: ROOT, pageSize: 200 });
  const sourceChecks = await inspectSourceFetches(deals);
  const report = buildReviewQueue(deals, { now, sourceChecks });
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

const isMain = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (isMain) {
  main().catch(() => {
    console.error('review-queue: could not load public offer data or complete source checks; no data was changed.');
    process.exitCode = 1;
  });
}

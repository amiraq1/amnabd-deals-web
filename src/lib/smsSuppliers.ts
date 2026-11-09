import type { SmsSupplier } from '@/content/smsSuppliersDirectory';

export type ListedSourceUrlReason =
  | 'needsReview'
  | 'notHttps'
  | 'domainMismatch'
  | 'invalidUrl';

export type ListedSourceUrlResult =
  | { ok: true; url: string }
  | { ok: false; reason: ListedSourceUrlReason };

export const LINK_REASON_MESSAGES: Record<
  ListedSourceUrlReason,
  { ar: string; en: string }
> = {
  needsReview: {
    ar: 'الرابط محجوب لحين مراجعة المصدر',
    en: 'Link withheld until the source is reviewed',
  },
  notHttps: {
    ar: 'الرابط المدرج لا يستخدم HTTPS',
    en: 'The listed link does not use HTTPS',
  },
  domainMismatch: {
    ar: 'الرابط لا يطابق النطاق المسجّل',
    en: 'The link does not match the registered domain',
  },
  invalidUrl: {
    ar: 'الرابط المدرج غير صالح أو غير مكتمل',
    en: 'The listed link is invalid or incomplete',
  },
};

const BLOCKED_HOSTS = ['studentoffers.co', 'www.studentoffers.co'];

export function isListedAsOfficial(supplier: Pick<SmsSupplier, 'verificationStatus'>): boolean {
  return supplier.verificationStatus === 'official';
}

export function getListedSourceUrl(
  supplier: Pick<SmsSupplier, 'verificationStatus' | 'url' | 'domain'>
): ListedSourceUrlResult {
  // Step 1: Status check - only official classification allowed to display link
  if (!isListedAsOfficial(supplier)) {
    return { ok: false, reason: 'needsReview' };
  }

  // Step 2: URL parsing and protocol check
  if (!supplier.url || typeof supplier.url !== 'string') {
    return { ok: false, reason: 'invalidUrl' };
  }

  let parsed: URL;
  try {
    parsed = new URL(supplier.url);
  } catch {
    return { ok: false, reason: 'invalidUrl' };
  }

  if (parsed.protocol !== 'https:') {
    return { ok: false, reason: 'notHttps' };
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
  if (!hostname || BLOCKED_HOSTS.includes(hostname)) {
    return { ok: false, reason: 'domainMismatch' };
  }

  // Step 3: Domain match check (exact match or subdomain with leading dot)
  const listedDomain = (supplier.domain ?? '').toLowerCase().replace(/^www\./, '');
  if (!listedDomain) {
    return { ok: false, reason: 'invalidUrl' };
  }

  if (hostname === listedDomain || hostname.endsWith(`.${listedDomain}`)) {
    return { ok: true, url: supplier.url };
  }

  return { ok: false, reason: 'domainMismatch' };
}

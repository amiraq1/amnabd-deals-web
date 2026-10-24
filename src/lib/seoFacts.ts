// Single source of truth for every claim the site publishes about a deal:
// meta description, Offer JSON-LD, availability, price, verification wording
// and the OG card badges.
//
// Both consumers use this module:
//   - src/lib/seo.ts            (browser, applied to the live document)
//   - scripts/generate-static-seo.mjs (build, baked into dist HTML/OG/SVG)
//
// Rule: a claim is emitted only when the source record carries the explicit
// field that proves it. Absence of evidence is never turned into a fact —
// this is why every reader below fails closed to `false` / `null`.
import type { Deal, DealStatus, Eligibility } from '@/types';
import { AGGREGATIONS, type AggregationConfig } from './aggregations.js';
import { applicantType, isOpenToAll, requirementState, truthState } from './eligibility.js';
import { reviewDateLabel } from './format.js';
import { isVerifiedReview } from './verification.js';

export { AGGREGATIONS } from './aggregations.js';

export const DEFAULT_SITE_URL = 'https://amnabd.com';

const VALID_STATUSES: readonly DealStatus[] = ['active', 'ending_soon', 'expired', 'verifying'];

function asObject(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const text = asString(item);
    return text === null ? [] : [text];
  });
}

function readStatus(value: unknown): DealStatus | null {
  const text = asString(value);
  return text && (VALID_STATUSES as readonly string[]).includes(text)
    ? (text as DealStatus)
    : null;
}

// `verifying` and unknown are deliberately absent: an unverified offer has no
// established availability, so schema.org gets no availability at all.
export function getAvailabilitySchema(status: unknown): string | null {
  switch (status) {
    case 'active':
      return 'https://schema.org/InStock';
    case 'ending_soon':
      return 'https://schema.org/LimitedAvailability';
    case 'expired':
      return 'https://schema.org/SoldOut';
    default:
      return null;
  }
}

export interface DealFacts {
  readonly status: DealStatus | null;
  readonly availability: string | null;
  readonly verified: boolean;
  readonly reviewedOn: string | null;
  readonly openToAll: boolean;
  readonly studentsOnly: boolean;
  readonly noCard: boolean;
  readonly price: { readonly value: number; readonly currency: string } | null;
}

/**
 * Reads only fields that exist on the record. Works on validated `Deal` rows and
 * on raw catalog items alike, because it re-applies the same normalizers that
 * `validate.ts` uses instead of trusting the shape.
 */
export function dealFacts(input: unknown): DealFacts {
  const row = asObject(input);
  const review = asObject(row?.review);
  const rawEligibility = asObject(row?.eligibility);
  const countries = asObject(rawEligibility?.countries);
  const pricing = asObject(row?.pricing);

  const eligibility: Eligibility = {
    countries: {
      status: asString(countries?.status) ?? 'unknown',
      values: asStringArray(countries?.values),
    },
    conditions: { ar: '', en: '' },
    new_account: requirementState(rawEligibility?.new_account),
    card_required: requirementState(rawEligibility?.card_required),
    applicant_type: applicantType(rawEligibility?.applicant_type),
    open_to_all: truthState(rawEligibility?.open_to_all),
    phone_required: requirementState(rawEligibility?.phone_required),
    student_status: requirementState(rawEligibility?.student_status),
  };

  const status = readStatus(row?.status);
  const reviewedRaw = asString(review?.reviewed_on);
  const reviewedOn =
    reviewedRaw !== null && reviewDateLabel(reviewedRaw, 'en') === reviewedRaw ? reviewedRaw : null;

  const rawPrice = pricing?.offer_price;
  const currency = asString(pricing?.currency)?.toUpperCase() ?? '';
  // Zero is kept when it is explicit (a real free tier); it is never defaulted.
  const price =
    typeof rawPrice === 'number' && Number.isFinite(rawPrice) && rawPrice >= 0 && /^[A-Z]{3}$/.test(currency)
      ? { value: rawPrice, currency }
      : null;

  return {
    status,
    availability: getAvailabilitySchema(status),
    verified: isVerifiedReview(review),
    reviewedOn,
    openToAll: isOpenToAll(eligibility),
    studentsOnly: eligibility.student_status === 'required',
    noCard: eligibility.card_required === 'not_required',
    price,
  };
}

/** Name shown in titles: explicit title → name → localized name → slug. */
export function dealDisplayName(input: unknown, fallback = ''): string {
  const row = asObject(input);
  return (
    asString(row?.title) ??
    asString(row?.name) ??
    asString(row?.name_ar) ??
    asString(row?.name_en) ??
    asString(row?.slug) ??
    fallback
  );
}

export interface DealSeoMetadata {
  title: string;
  description: string;
  canonicalUrl: string;
  ogImageUrl: string;
  jsonLd: Record<string, unknown>;
}

export function buildDealSeo(input: unknown, baseUrl = DEFAULT_SITE_URL): DealSeoMetadata {
  const row = asObject(input);
  const facts = dealFacts(input);
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const slug = asString(row?.slug) ?? '';
  const canonicalUrl = `${cleanBase}/deal/${slug}`;
  const ogImageUrl = `${cleanBase}/og/${slug}.png`;

  const displayName = dealDisplayName(input, slug);
  const headline = asString(row?.headline_value);
  const title = `${displayName}${headline ? ` (${headline})` : ''} — عروض وأرصدة الذكاء الاصطناعي`;

  const summary =
    asString(row?.description_ar) ??
    asString(row?.description_en) ??
    asString(row?.summary) ??
    displayName;

  const notes: string[] = [];
  if (facts.studentsOnly) notes.push('مخصص للطلاب.');
  if (facts.noCard) notes.push('بدون بطاقة ائتمانية.');
  if (facts.verified) notes.push('موثّق من المصدر.');
  const description = notes.length > 0 ? `${summary} ${notes.join(' ')}` : summary;

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Offer',
    name: displayName,
    description,
    url: canonicalUrl,
  };
  if (facts.availability) jsonLd.availability = facts.availability;
  if (facts.price) {
    jsonLd.price = facts.price.value;
    jsonLd.priceCurrency = facts.price.currency;
    const endsAt = asString(row?.ends_at);
    if (endsAt) jsonLd.priceValidUntil = endsAt;
  }
  if (facts.reviewedOn) jsonLd.dateModified = facts.reviewedOn;
  if (headline)
    jsonLd.itemOffered = {
      '@type': 'SoftwareApplication',
      name: displayName,
      offers: { '@type': 'Offer', description: headline },
    };

  return { title, description, canonicalUrl, ogImageUrl, jsonLd };
}

/** Collections that actually contain at least one deal — the only ones worth publishing. */
export function nonEmptyAggregations(deals: readonly Deal[]): { config: AggregationConfig; count: number }[] {
  return Object.values(AGGREGATIONS).flatMap((config) => {
    const count = deals.filter((deal) => config.filter(deal)).length;
    return count > 0 ? [{ config, count }] : [];
  });
}

export function generateSitemapXml(deals: readonly Deal[], baseUrl = DEFAULT_SITE_URL): string {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const latestReview = deals
    .map((deal) => deal.review?.reviewed_on)
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
    .sort()
    .reverse()[0];

  const url = (loc: string, priority: string, changefreq: string, lastmod?: string) =>
    `  <url>
    <loc>${loc}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;

  const urls = [
    url(`${cleanBase}/`, '1.0', 'daily', latestReview),
    url(`${cleanBase}/changelog`, '0.8', 'daily', latestReview),
    ...nonEmptyAggregations(deals).map(({ config }) =>
      url(`${cleanBase}/${config.slug}`, '0.9', 'daily', latestReview)
    ),
  ];

  for (const deal of deals) {
    if (!deal?.slug) continue;
    const priority = deal.status === 'expired' ? '0.4' : '0.8';
    urls.push(
      url(
        `${cleanBase}/deal/${deal.slug}`,
        priority,
        'weekly',
        deal.review?.reviewed_on ? String(deal.review.reviewed_on) : undefined
      )
    );
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
}

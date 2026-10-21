// One model for "is this offer over?" and "is its registration closing?".
//
// Rules from the audit review (PR-2):
//   - An explicit `status: 'expired'` always wins.
//   - A recorded `ends_at` in the past expires the offer, and the card says why
//     ("انتهى حسب تاريخ الانتهاء المسجّل"). `ends_at` is an explicit field about
//     the offer's end, not an inference.
//   - A registration deadline never expires an offer. It only reports its own
//     state.
//   - There is deliberately no "open"/"available" state: availability is a
//     positive claim the data cannot prove.
//   - A date-only value ends after 12:00 UTC of the following day; an explicit
//     instant is compared exactly. See `instants.ts`.
import type { DealStatus } from '@/types';
import { DAY_MS, timestampInstant } from './instants.js';

export const ENDING_SOON_DAYS = 14;
const ENDING_SOON_MS = ENDING_SOON_DAYS * DAY_MS;

const VALID_STATUSES: readonly DealStatus[] = ['active', 'ending_soon', 'expired', 'verifying'];

export type OfferState = 'expired' | 'ending_soon' | 'unknown';
export type RegistrationState = 'passed' | 'soon' | 'unknown';
export type OfferReason = 'status' | 'ends_at' | null;

export interface OfferTiming {
  readonly state: OfferState;
  readonly reason: OfferReason;
  readonly endsAt: string | null;
  readonly expiresAt: number | null;
  readonly daysLeft: number | null;
}

export interface RegistrationTiming {
  /** `unknown` also covers a valid date further out than the window. */
  readonly state: RegistrationState;
  readonly date: string | null;
  readonly daysLeft: number | null;
}

export interface TimingState {
  readonly offer: OfferTiming;
  readonly registration: RegistrationTiming;
}

function asObject(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function readStatus(value: unknown): DealStatus | null {
  const text = asText(value);
  return text && (VALID_STATUSES as readonly string[]).includes(text)
    ? (text as DealStatus)
    : null;
}

function referenceMs(referenceNow: Date): number {
  if (!(referenceNow instanceof Date) || !Number.isFinite(referenceNow.getTime())) {
    throw new RangeError('Invalid referenceNow');
  }
  return referenceNow.getTime();
}

/** Expiry instant of `ends_at`, or null when absent/unparseable. */
export function offerExpiryInstant(value: unknown): number | null {
  return timestampInstant(value);
}

function daysUntil(instant: number | null, ref: number): number | null {
  return instant === null ? null : Math.ceil((instant - ref) / DAY_MS);
}

export function getTimingState(input: unknown, referenceNow: Date): TimingState {
  const ref = referenceMs(referenceNow);
  const deal = asObject(input);
  const status = readStatus(deal?.status);

  const rawEndsAt = asText(deal?.ends_at);
  const expiresAt = offerExpiryInstant(rawEndsAt);
  const offerBase = {
    endsAt: rawEndsAt,
    expiresAt,
    daysLeft: daysUntil(expiresAt, ref),
  };

  let offer: OfferTiming;
  if (status === 'expired') {
    offer = { ...offerBase, state: 'expired', reason: 'status' };
  } else if (expiresAt !== null && expiresAt <= ref) {
    offer = { ...offerBase, state: 'expired', reason: 'ends_at' };
  } else if (status === 'ending_soon') {
    // The manual flag stays an explicit input for the same state.
    offer = { ...offerBase, state: 'ending_soon', reason: 'status' };
  } else if (expiresAt !== null && expiresAt - ref <= ENDING_SOON_MS) {
    offer = { ...offerBase, state: 'ending_soon', reason: 'ends_at' };
  } else {
    offer = { ...offerBase, state: 'unknown', reason: null };
  }

  const registration = asObject(deal?.registration);
  const deadline = asObject(registration?.deadline);
  const date = deadline?.status === 'known' ? asText(deadline?.date) : null;
  const deadlineAt = date === null ? null : timestampInstant(date);
  let registrationState: RegistrationState = 'unknown';
  if (deadlineAt !== null) {
    if (deadlineAt <= ref) registrationState = 'passed';
    else if (deadlineAt - ref <= ENDING_SOON_MS) registrationState = 'soon';
  }

  return {
    offer,
    registration: { state: registrationState, date, daysLeft: daysUntil(deadlineAt, ref) },
  };
}

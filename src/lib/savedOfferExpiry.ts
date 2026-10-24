import type { Deal } from '@/types';
import { ENDING_SOON_DAYS, getTimingState } from './dealTiming.js';
import { DAY_MS } from './instants.js';

/**
 * Return saved offers with an explicit, parseable end instant in the shared
 * ending-soon window. Filtering preserves the caller's existing order.
 */
export function getSavedOffersEndingSoon(deals: readonly Deal[], referenceNow: Date): Deal[] {
  const referenceMs = referenceNow.getTime();
  const windowMs = ENDING_SOON_DAYS * DAY_MS;

  return deals.filter((deal) => {
    const timing = getTimingState(deal, referenceNow).offer;
    return (
      timing.state !== 'expired' &&
      timing.expiresAt !== null &&
      timing.expiresAt > referenceMs &&
      timing.expiresAt - referenceMs <= windowMs
    );
  });
}

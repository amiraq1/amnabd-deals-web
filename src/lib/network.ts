/** Public catalog data must always be requested from the network, never an HTTP cache. */
export const networkOnlyFetch: typeof fetch = (input, init) =>
  fetch(input, { ...init, cache: 'no-store' });

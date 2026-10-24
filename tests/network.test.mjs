import assert from 'node:assert/strict';
import { test } from 'node:test';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const { networkOnlyFetch } = await import(
  pathToFileURL(join(process.env.AMN_TEST_BUILD_DIR, 'src/lib/network.js'))
);

test('public resource fetch forces no-store without losing request headers or cancellation', async () => {
  const originalFetch = globalThis.fetch;
  const controller = new AbortController();
  const response = new Response('[]');
  let captured;
  globalThis.fetch = async (input, init) => {
    captured = { input, init };
    return response;
  };
  try {
    const result = await networkOnlyFetch('https://example.supabase.co/rest/v1/deals', {
      cache: 'force-cache',
      headers: { 'x-test': 'preserved' },
      signal: controller.signal,
    });
    assert.equal(result, response);
    assert.equal(captured.input, 'https://example.supabase.co/rest/v1/deals');
    assert.equal(captured.init.cache, 'no-store');
    assert.deepEqual(captured.init.headers, { 'x-test': 'preserved' });
    assert.equal(captured.init.signal, controller.signal);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

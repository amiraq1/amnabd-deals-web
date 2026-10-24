import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { generatePwaArtifacts, isImmutableHashedAsset, renderServiceWorker } from '../scripts/generate-pwa.mjs';
import { verifyPwaArtifacts } from '../scripts/verify-pwa.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const template = await readFile(join(root, 'public/sw.js'), 'utf8');
const offlineUrl = '/offline-a123456789ab.html';
const assetUrl = '/assets/index-AbCd1234.js';
const workerSource = renderServiceWorker(template, {
  cacheName: 'amnabd-static-current',
  precacheUrls: [assetUrl, offlineUrl],
  versionedAssets: [assetUrl, offlineUrl],
  offlineUrl,
});

function workerEnvironment({ networkFails = false } = {}) {
  const handlers = {};
  const calls = { put: [], match: [], addAll: [], deleted: [], fetch: [], skipWaiting: 0, claimed: 0 };
  const fallback = new Response('explicit offline page', { headers: { 'Content-Type': 'text/html' } });
  const cache = {
    addAll: async (urls) => calls.addAll.push(Array.from(urls)),
    match: async (url) => {
      calls.match.push(url);
      if (url === offlineUrl) return fallback;
      if (url === assetUrl) return new Response('immutable asset');
      return undefined;
    },
    put: async (...args) => calls.put.push(args),
  };
  const context = {
    URL, Response, Set,
    Request: class {
      constructor(request, options) { Object.assign(this, request, options); }
    },
    fetch: async (request) => {
      calls.fetch.push(request);
      if (networkFails) throw new Error('offline');
      return new Response('fresh network HTML');
    },
    caches: {
      open: async () => cache,
      keys: async () => ['amnabd-static-old', 'amnabd-static-current', 'unrelated-cache'],
      delete: async (key) => { calls.deleted.push(key); return true; },
    },
    self: {
      location: { origin: 'https://example.test' },
      addEventListener: (name, handler) => { handlers[name] = handler; },
      clients: { claim: async () => { calls.claimed += 1; } },
      skipWaiting: () => { calls.skipWaiting += 1; },
    },
  };
  runInNewContext(workerSource, context);
  async function fetchEvent(request) {
    let response;
    handlers.fetch({ request, respondWith: (promise) => { response = promise; } });
    return response === undefined ? null : await response;
  }
  return { handlers, calls, fetchEvent };
}

test('PWA immutable asset predicate excludes catalog data and unversioned files', () => {
  assert.equal(isImmutableHashedAsset('index-AbCd1234.js'), true);
  assert.equal(isImmutableHashedAsset('styles-1234abcd.css'), true);
  for (const name of ['deals.json', 'catalog.html', 'index.html', 'script.js', 'favicon.svg'])
    assert.equal(isImmutableHashedAsset(name), false, name);
});

test('service worker does not intercept Supabase/PostgREST or any non-allowlisted same-origin data', async () => {
  const env = workerEnvironment();
  assert.equal(await env.fetchEvent({ method: 'GET', mode: 'cors', url: 'https://example.supabase.co/rest/v1/deals' }), null);
  assert.equal(await env.fetchEvent({ method: 'GET', mode: 'cors', url: 'https://example.test/rest/v1/deals' }), null);
  assert.equal(await env.fetchEvent({ method: 'GET', mode: 'cors', url: 'https://example.test/catalog.json' }), null);
  assert.equal(env.calls.fetch.length, 0);
  assert.equal(env.calls.put.length, 0);
});

test('navigations always use fresh network HTML without caching it', async () => {
  const env = workerEnvironment();
  const response = await env.fetchEvent({ method: 'GET', mode: 'navigate', url: 'https://example.test/deal/one?lang=en' });
  assert.equal(await response.text(), 'fresh network HTML');
  assert.equal(env.calls.fetch[0].cache, 'no-store');
  assert.equal(env.calls.match.length, 0);
  assert.equal(env.calls.put.length, 0);
});

test('offline navigations return only the explicit offline page, never stale route HTML', async () => {
  const env = workerEnvironment({ networkFails: true });
  const response = await env.fetchEvent({ method: 'GET', mode: 'navigate', url: 'https://example.test/favorites?lang=en' });
  assert.equal(await response.text(), 'explicit offline page');
  assert.deepEqual(env.calls.match, [offlineUrl]);
  assert.equal(env.calls.put.length, 0);
});

test('only allowlisted immutable static assets can be served from cache', async () => {
  const env = workerEnvironment();
  const response = await env.fetchEvent({ method: 'GET', mode: 'cors', url: `https://example.test${assetUrl}` });
  assert.equal(await response.text(), 'immutable asset');
  assert.deepEqual(env.calls.match, [assetUrl]);
  assert.equal(env.calls.fetch.length, 0);
});

test('new workers wait for user update; activation removes only older app caches', async () => {
  const env = workerEnvironment();
  let installed;
  env.handlers.install({ waitUntil: (promise) => { installed = promise; } });
  await installed;
  assert.deepEqual(env.calls.addAll, [[assetUrl, offlineUrl]]);
  assert.equal(env.calls.skipWaiting, 0);
  env.handlers.message({ data: { type: 'OTHER_MESSAGE' } });
  assert.equal(env.calls.skipWaiting, 0);
  env.handlers.message({ data: { type: 'SKIP_WAITING' } });
  assert.equal(env.calls.skipWaiting, 1);
  let activated;
  env.handlers.activate({ waitUntil: (promise) => { activated = promise; } });
  await activated;
  assert.deepEqual(env.calls.deleted, ['amnabd-static-old']);
  assert.equal(env.calls.claimed, 1);
});

test('PWA generator emits real PNG icons, versioned offline-only cache, and parity on deep routes', async () => {
  const fixture = await mkdtemp(join(tmpdir(), 'amnabd-pwa-'));
  try {
    const publicDir = join(fixture, 'public');
    const distDir = join(fixture, 'dist');
    await mkdir(publicDir, { recursive: true });
    await mkdir(join(distDir, 'assets'), { recursive: true });
    await mkdir(join(distDir, 'deal', 'one'), { recursive: true });
    const html = '<html><head><link rel="manifest" href="/manifest.webmanifest" /><link rel="apple-touch-icon" href="/favicon.svg" data-pwa-icon /></head><body></body></html>';
    await writeFile(join(distDir, 'index.html'), html);
    await writeFile(join(distDir, 'deal', 'one', 'index.html'), html);
    await writeFile(join(distDir, 'assets', 'index-AbCd1234.js'), 'console.log("app")');
    await writeFile(join(distDir, 'assets', 'styles-1234abcd.css'), 'body { color: white; }');
    await writeFile(join(distDir, 'assets', 'deals.json'), '[{"slug":"must-not-be-cached"}]');
    for (const name of ['favicon.svg', 'sw.js', 'offline.html'])
      await writeFile(join(publicDir, name), await readFile(join(root, 'public', name)));
    const built = await generatePwaArtifacts({ root: fixture });
    const verified = await verifyPwaArtifacts(distDir);
    assert.equal(verified.appPages, 2);
    assert.equal(verified.manifest.start_url, '/');
    assert.equal(built.versionedAssets.includes('/'), false);
    assert.equal(built.versionedAssets.includes('/index.html'), false);
    assert.equal(built.versionedAssets.some((url) => url.includes('deals.json')), false);
    assert.equal(built.versionedAssets.filter((url) => url.endsWith('.html')).length, 1);
    assert.ok(built.versionedAssets.includes(built.offlineUrl));
    const worker = await readFile(join(distDir, 'sw.js'), 'utf8');
    assert.equal(worker.includes('__CACHE_NAME__'), false);
    assert.equal(worker.includes('__PRECACHE_URLS__'), false);
    assert.ok(!worker.includes('must-not-be-cached'));
    const icon = await readFile(join(distDir, built.icon512Url.slice(1)));
    assert.equal(icon.readUInt32BE(16), 512);
    assert.equal(icon.readUInt32BE(20), 512);
    const deepHtml = await readFile(join(distDir, 'deal', 'one', 'index.html'), 'utf8');
    assert.ok(deepHtml.includes(built.icon192Url));
    assert.ok(!deepHtml.includes('data-pwa-icon'));
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});

test('offline page honors the language URL before local preferences without containing a catalog', async () => {
  const html = await readFile(join(root, 'public/offline.html'), 'utf8');
  assert.match(html, /URLSearchParams\(location\.search\)/);
  assert.match(html, /const preferred = fromUrl \|\| saved/);
  assert.match(html, /noindex,nofollow/);
  assert.ok(!html.includes('application/ld+json'));
  assert.ok(!html.includes('rest/v1'));
});

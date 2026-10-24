/* Build-time template. scripts/generate-pwa.mjs fills in the versioned asset list. */
const CACHE_NAME = __CACHE_NAME__;
const PRECACHE_URLS = __PRECACHE_URLS__;
const VERSIONED_ASSETS = new Set(__VERSIONED_ASSETS__);
const OFFLINE_URL = __OFFLINE_URL__;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(async (keys) => {
      await Promise.all(
        keys
          .filter((key) => key.startsWith('amnabd-static-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    }),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(new Request(request, { cache: 'no-store' })).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        return (
          (await cache.match(OFFLINE_URL)) ??
          new Response('Offline — reconnect to load current offers.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          })
        );
      }),
    );
    return;
  }

  const path = url.pathname;
  if (!VERSIONED_ASSETS.has(path)) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(path);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) await cache.put(path, response.clone());
      return response;
    }),
  );
});

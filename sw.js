const CACHE_NAME = 'solfa-player-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// 1. Pre-cache core app shell
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// 2. Clean up outdated caches when CACHE_NAME changes
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// 3. Cache-first with dynamic runtime caching (for Google Fonts, OCR assets, etc.)
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;

      return fetch(e.request)
        .then((response) => {
          // Only cache valid responses (including opaque responses from CDNs/Google Fonts)
          if (!response || (response.status !== 200 && response.type !== 'opaque')) {
            return response;
          }

          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copy));
          return response;
        })
        .catch(() => {
          // Offline fallback for page navigation
          if (e.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
    })
  );
});
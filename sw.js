// Version auto-générée par Netlify à chaque déploiement
const VERSION = 'nim-1787602568';

// Assets to cache for offline
const OFFLINE_ASSETS = [
  '/',
  '/manifest.json',
];

// Install: cache core assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSION).then((c) => c.addAll(OFFLINE_ASSETS))
  );
  // Activate immediately — don't wait for old tabs to close
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))
    )
  );
  // Take control of all open tabs immediately
  self.clients.claim();
});

// Fetch strategy
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // API calls: always network, never cache
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // HTML navigation: network-first (ensures updates arrive)
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((response) => {
          // Update cache with fresh version
          const clone = response.clone();
          caches.open(VERSION).then((c) => c.put(e.request, clone));
          return response;
        })
        .catch(() => {
          // Offline fallback: serve from cache
          return caches.match(e.request);
        })
    );
    return;
  }

  // External resources (fonts, CDN): cache-first for speed
  if (!url.pathname.startsWith('/api/')) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        if (cached) return cached;
        return fetch(e.request).then((response) => {
          // Cache successful responses for offline
          if (response.ok) {
            const clone = response.clone();
            caches.open(VERSION).then((c) => c.put(e.request, clone));
          }
          return response;
        });
      })
    );
  }
});

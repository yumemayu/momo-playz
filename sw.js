/* Momo Playz service worker: network-first so updates always arrive,
   with a cache fallback so visited games keep working offline. */
const CACHE = 'momo-playz-v1';
const CORE = ['./', './index.html', './manifest.webmanifest', './icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Only same-origin GETs: the online leaderboard (Google Apps Script)
  // and everything else cross-origin always go straight to the network.
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    try {
      const response = await fetch(event.request);
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy)).catch(() => {});
      }
      return response;
    } catch (error) {
      const hit = await caches.match(event.request)
        || await caches.match(event.request, { ignoreSearch: true });
      if (hit) return hit;
      if (event.request.mode === 'navigate') {
        const home = await caches.match('./index.html');
        if (home) return home;
      }
      throw error;
    }
  })());
});

// સૃષ્ટિ ખેડૂત હાટ — shared service worker for all 3 apps (customer / admin / farmer).
// Registered separately by each app with its own scope; this one file serves all three.
//
// Strategy: NETWORK-FIRST for navigations (HTML) and same-origin app files — always try
// the live server first so a deployed fix/version is never masked by a stale cache (this
// is a deliberate lesson from a real incident on a sibling KRSF app where a cache-first SW
// served an old build for days). Cache is only a fallback for when the network is down —
// which is the actual point of a PWA for farmers on patchy rural connections.
//
// Bump CACHE_NAME on every change to this file so old caches get swept on activate.
const CACHE_NAME = 'khedut-haat-v55';
const PRECACHE = [
  '/', '/submit', '/admin',
  '/manifest-customer.json', '/manifest-admin.json', '/manifest.json',
  '/icons/icon-192.png', '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(PRECACHE.map((url) => cache.add(url).catch(() => {})))
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;                       // never intercept writes
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;         // leave CDN/Firebase requests to the browser

  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match('/')))
  );
});

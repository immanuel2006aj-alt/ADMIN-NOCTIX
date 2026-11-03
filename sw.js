const CACHE = 'noctis-admin-v1';

const CORE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install service worker and cache app files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

// Activate and remove old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Handle network requests
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Never cache non-GET or Supabase requests
  if (
    event.request.method !== 'GET' ||
    url.hostname.includes('supabase.co') ||
    url.pathname.includes('/auth/')
  ) {
    return;
  }

  // Cache only same-origin website resources
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request)
        .then(cached => {
          if (cached) return cached;

          return fetch(event.request)
            .then(response => {
              if (response.ok) {
                const copy = response.clone();

                caches.open(CACHE)
                  .then(cache => cache.put(event.request, copy));
              }

              return response;
            })
            .catch(() => caches.match('./index.html'));
        })
    );
  }
});

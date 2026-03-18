const CACHE = 'podcast-veille-v1';
const PRECACHE = ['/', '/manifest.json', '/episodes.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Network-first for API and episodes.json (always fresh)
  if (url.pathname.startsWith('/api/') || url.pathname === '/episodes.json') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first for audio files (large, immutable once created)
  if (url.pathname.startsWith('/audio/')) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        if (cached) return cached;
        return fetch(e.request).then((res) => {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
          return res;
        });
      })
    );
    return;
  }

  // Stale-while-revalidate for everything else
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const network = fetch(e.request).then((res) => {
        caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
        return res;
      });
      return cached || network;
    })
  );
});

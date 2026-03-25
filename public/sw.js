const CACHE = 'podcast-veille-v3';
const AUDIO_CACHE = 'podcast-veille-audio-v1';
const BASE = '/podcast-veille';
const PRECACHE = [
  `${BASE}/`,
  `${BASE}/manifest.json`,
  `${BASE}/episodes.json`,
];

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE && k !== AUDIO_CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // MP3 files: check audio cache first, then network
  if (url.pathname.endsWith('.mp3')) {
    e.respondWith(
      caches.open(AUDIO_CACHE).then((cache) =>
        cache.match(e.request).then((cached) => {
          if (cached) return cached;
          return fetch(e.request);
        })
      )
    );
    return;
  }

  // Other resources: cache-first with network fallback
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        if (!res || res.status !== 200 || res.type === 'opaque') return res;
        const clone = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, clone));
        return res;
      });
    })
  );
});

// ── Message handler (audio caching) ─────────────────────────────────────────
self.addEventListener('message', (e) => {
  if (e.data?.type === 'CACHE_AUDIO') {
    const { url, episodeId } = e.data;
    caches.open(AUDIO_CACHE)
      .then((cache) => cache.add(url))
      .then(() => {
        // Notify client of success
        e.source?.postMessage({ type: 'AUDIO_CACHED', episodeId });
      })
      .catch((err) => {
        console.error('Failed to cache audio:', err);
        e.source?.postMessage({ type: 'AUDIO_CACHE_ERROR', episodeId, error: err.message });
      });
  }
});

// ── Push notifications ───────────────────────────────────────────────────────
self.addEventListener('push', (e) => {
  let data = { title: 'Nouvel épisode', body: 'Un nouveau épisode de veille est disponible !' };
  try {
    if (e.data) data = e.data.json();
  } catch { /* use defaults */ }

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: `${BASE}/icons/icon-192.png`,
      badge: `${BASE}/icons/icon-192.png`,
      tag: 'new-episode',
      renotify: true,
      data: { url: data.url || `${BASE}/` },
    })
  );
});

// ── Notification click ───────────────────────────────────────────────────────
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = e.notification.data?.url || `${BASE}/`;
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(BASE) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

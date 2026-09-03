// v24 — network first, no cache blocking
const CACHE = 'ff-v24';

self.addEventListener('install', e => {
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', e => {
    if (e.request.method !== 'GET') return;
    // Always go network first
    e.respondWith(
        fetch(e.request)
            .then(r => {
                const clone = r.clone();
                caches.open(CACHE).then(c => c.put(e.request, clone)).catch(() => {});
                return r;
            })
            .catch(() => caches.match(e.request))
    );
});

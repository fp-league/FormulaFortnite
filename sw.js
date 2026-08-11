const CACHE_NAME = 'formula-fortnite-v15';
const urlsToCache = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manage.html',
    './manifest.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(names =>
            Promise.all(names.map(name => { if (name !== CACHE_NAME) return caches.delete(name); }))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    const req = event.request;
    if (req.method !== 'GET') return;

    // Live database: always fresh, fall back to cache offline
    if (req.url.includes('api.jsonbin.io')) {
        event.respondWith(fetch(req).catch(() => caches.match(req)));
        return;
    }

    // App files: NETWORK FIRST — always try the latest, cache as backup.
    event.respondWith(
        fetch(req)
            .then(resp => {
                const copy = resp.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => {});
                return resp;
            })
            .catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
    );
});

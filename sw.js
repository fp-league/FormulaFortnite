const CACHE_NAME = 'formula-fortnite-v2';
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
        caches.keys().then(cacheNames =>
            Promise.all(cacheNames.map(name => {
                if (name !== CACHE_NAME) return caches.delete(name);
            }))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    // Always go to network for the JSON database (fresh data)
    if (event.request.url.includes('api.jsonbin.io')) {
        event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
        return;
    }
    // Cache-first for everything else
    event.respondWith(
        caches.match(event.request).then(response =>
            response || fetch(event.request).then(resp => {
                return caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, resp.clone());
                    return resp;
                });
            })
        )
    );
});

const CACHE = 'ff-v33';
const CORE = [
  '/', '/index.html', '/styles.css', '/theme-futuristic.css',
  '/app.js', '/manifest.json', '/offline.html',
  '/fonts/Formula1-Regular.ttf', '/fonts/Formula1-Bold.ttf',
  '/fonts/F1Display-Bold.otf', '/fonts/F1Display-Regular.otf',
  '/fonts/F1PosNumber.otf', '/fonts/F1Timer.ttf'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // JSONBin — network only, no caching
  if (url.hostname.includes('jsonbin')) {
    e.respondWith(fetch(e.request).catch(() => new Response('{"error":"offline"}', { headers: { 'Content-Type': 'application/json' } })));
    return;
  }

  // Everything else — network first, fall back to cache, then offline page
  e.respondWith(
    fetch(e.request)
      .then(r => {
        if (r && r.status === 200) {
          const clone = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone)).catch(() => {});
        }
        return r;
      })
      .catch(async () => {
        const cached = await caches.match(e.request);
        if (cached) return cached;
        if (e.request.destination === 'document') return caches.match('/offline.html');
        return new Response('', { status: 408 });
      })
  );
});

// Push notifications
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  e.waitUntil(
    self.registration.showNotification(data.title || 'Formula Fortnite', {
      body: data.body || 'New update from FF',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.tag || 'ff-notification',
      data: { url: data.url || '/' },
      vibrate: [200, 100, 200],
      actions: [
        { action: 'open', title: 'View' },
        { action: 'close', title: 'Dismiss' }
      ]
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'close') return;
  const url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(clients.matchAll({ type: 'window' }).then(wins => {
    const win = wins.find(w => w.url.includes(self.location.origin));
    if (win) { win.navigate(url); return win.focus(); }
    return clients.openWindow(url);
  }));
});

// Offline cache for the card.
// Every build stamps its own hash into the cache name, so a deploy with changed
// files reaches phones on its own. To force a fresh cache anyway, bump VERSION.
const VERSION = 1;
const CACHE = `card-v${VERSION}-__BUILD__`;

// Filled in by the build.
const FILES = __FILES__;

// Straight from the server, so a stale browser copy can't get saved.
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE)
            .then((cache) => cache.addAll(['./', ...FILES].map((file) => new Request(file, { cache: 'reload' }))))
            .then(() => self.skipWaiting()),
    );
});

// Other sites on this domain have their own caches; only drop ours.
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => keys.filter((key) => key.startsWith('card-') && key !== CACHE))
            .then((old) => Promise.all(old.map((key) => caches.delete(key))))
            .then(() => self.clients.claim()),
    );
});

// Cache first, then the network.
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    event.respondWith(
        caches.match(event.request, { ignoreSearch: true })
            .then((cached) => cached || fetch(event.request)),
    );
});

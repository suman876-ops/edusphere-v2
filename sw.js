/* Offline shell: cache the page and its assets, fall back to the cache when the network fails. */
const CACHE = 'edusphere-v2';
const ASSETS = [
  './index.html',
  './assets/css/styles.css',
  './assets/css/console.css',
  './assets/js/config.js',
  './assets/js/api.js',
  './assets/js/search.js',
  './assets/js/resources.js',
  './assets/js/console.js',
  './assets/js/portal.js',
  './assets/js/app.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // never cache Supabase calls — data must be live
  if (url.hostname.endsWith('supabase.co')) return;
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(event.request).then((hit) => hit || caches.match('./index.html')))
  );
});

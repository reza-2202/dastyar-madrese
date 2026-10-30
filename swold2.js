const CACHE = 'dastyar-shell-v51';
const BASE = '/dastyar-madrese/';
const SHELL = [
  BASE,
  BASE + 'index.html',
  BASE + 'manifest.webmanifest',
  BASE + 'icon-192.png',
  BASE + 'icon-512.png',
  BASE + 'apple-touch-icon.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(SHELL).catch(function () {});
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  // only handle same-origin app scope
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(BASE) && url.pathname !== BASE.slice(0, -1)) return;

  e.respondWith(
    fetch(req).then(function (res) {
      try {
        if (res && res.ok && (req.destination === 'document' || req.destination === 'script' || req.destination === 'style' || req.destination === 'image' || req.url.indexOf('manifest') >= 0)) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); }).catch(function () {});
        }
      } catch (err) {}
      return res;
    }).catch(function () {
      return caches.match(req).then(function (r) {
        return r || caches.match(BASE + 'index.html');
      });
    })
  );
});

const CACHE = 'dastyar-shell-v54-20261112r';
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
  // پوسته و آیکون‌های اصلی برنامه مانند نسخه سالم قبلی در کش آماده شوند.
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(SHELL.map(function (u) {
        return c.add(u).catch(function () {});
      }));
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (k) {
          if (k !== CACHE) return caches.delete(k);
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('message', function (e) {
  if (!e.data) return;
  if (e.data === 'SKIP_WAITING' || (e.data && e.data.type === 'SKIP_WAITING')) {
    self.skipWaiting();
  }
  if (e.data === 'CLEAR_CACHE' || (e.data && e.data.type === 'CLEAR_CACHE')) {
    e.waitUntil(
      caches.keys().then(function (keys) {
        return Promise.all(keys.map(function (k) { return caches.delete(k); }));
      })
    );
  }
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.indexOf(BASE) !== 0) return;

  var isHTML =
    e.request.mode === 'navigate' ||
    (e.request.headers.get('accept') || '').indexOf('text/html') >= 0 ||
    /index\\.html$/i.test(url.pathname) ||
    url.pathname === BASE ||
    url.pathname === BASE.replace(/\\/$/, '');

  var isVersion = /version\\.json$/i.test(url.pathname) || /sw\\.js$/i.test(url.pathname) || /manifest\\.webmanifest$/i.test(url.pathname);

  // HTML و فایل‌های تشخیص نسخه همیشه تازه از شبکه دریافت شوند.
  if (isHTML || isVersion) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' }).then(function (res) {
        return res;
      }).catch(function () {
        return caches.match(BASE + 'index.html').then(function (r) {
          return r || caches.match(e.request);
        });
      })
    );
    return;
  }

  // سایر فایل‌ها: شبکه اول و کش برای حالت آفلاین.
  e.respondWith(
    fetch(e.request).then(function (res) {
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); }).catch(function () {});
      }
      return res;
    }).catch(function () {
      return caches.match(e.request);
    })
  );
});

const CACHE = 'dastyar-shell-v54-20261111i';
const BASE = '/dastyar-madrese/';

self.addEventListener('install', function (e) {
  // بلافاصله نسخه جدید فعال شود
  e.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (k) {
          // همه کش‌های قدیمی برنامه پاک شوند
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
    /index\.html$/i.test(url.pathname) ||
    url.pathname === BASE ||
    url.pathname === BASE.replace(/\/$/, '');

  var isVersion = /version\.json$/i.test(url.pathname) || /sw\.js$/i.test(url.pathname) || /manifest\.webmanifest$/i.test(url.pathname);

  // HTML و version/sw همیشه از شبکه (بدون کش مرورگر)
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

  // بقیه فایل‌ها: شبکه اول، بعد کش
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

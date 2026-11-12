const CACHE = 'dastyar-shell-v57-20261112-share-refresh';
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
        keys.filter(function (k) { return k !== CACHE; }).map(function (k) {
          return caches.delete(k);
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

function openSharedInboxDB() {
  return new Promise(function(resolve, reject) {
    var req = indexedDB.open('dastyar_shared_inbox_pending', 1);
    req.onupgradeneeded = function() {
      var db = req.result;
      if (!db.objectStoreNames.contains('items')) db.createObjectStore('items', { keyPath: 'id' });
    };
    req.onsuccess = function() { resolve(req.result); };
    req.onerror = function() { reject(req.error || new Error('IndexedDB unavailable')); };
  });
}
async function handleSharedInboxPost(request) {
  var form = await request.formData();
  var files = form.getAll('files').filter(function(x) { return x instanceof File && x.size > 0; });
  if (!files.length) files = form.getAll('file').filter(function(x) { return x instanceof File && x.size > 0; });
  var db = await openSharedInboxDB();
  try {
    if (files.length) {
      await new Promise(function(resolve, reject) {
        var tx = db.transaction('items', 'readwrite');
        var store = tx.objectStore('items');
        files.forEach(function(file) {
          store.put({
            id: 'share-' + Date.now() + '-' + Math.random().toString(36).slice(2),
            file: file,
            title: String(form.get('title') || '').slice(0, 240),
            text: String(form.get('text') || '').slice(0, 1000),
            url: String(form.get('url') || '').slice(0, 2000),
            receivedAt: new Date().toISOString()
          });
        });
        tx.oncomplete = resolve;
        tx.onerror = function() { reject(tx.error || new Error('Shared file storage failed')); };
        tx.onabort = function() { reject(tx.error || new Error('Shared file storage aborted')); };
      });
    }
  } finally {
    db.close();
  }
  return Response.redirect(new URL(BASE + '?shared=1', self.location.origin).href, 303);
}

self.addEventListener('fetch', function (e) {
  var shareUrl = new URL(e.request.url);
  if (e.request.method === 'POST' && shareUrl.origin === self.location.origin &&
      shareUrl.pathname === BASE && shareUrl.searchParams.has('share-target')) {
    e.respondWith(handleSharedInboxPost(e.request).catch(function(err) {
      console.error('Share target receive failed', err);
      return Response.redirect(new URL(BASE + '?shared=error', self.location.origin).href, 303);
    }));
    return;
  }
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.indexOf(BASE) !== 0) return;

  e.respondWith(
    fetch(e.request).then(function (res) {
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) {
          c.put(e.request, copy);
        }).catch(function () {});
      }
      return res;
    }).catch(function () {
      return caches.match(e.request).then(function (r) {
        return r || caches.match(BASE + 'index.html');
      });
    })
  );
});

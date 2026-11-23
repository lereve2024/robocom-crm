/* 로보컴 CRM — 서비스 워커
   · 화면(GitHub Pages)은 캐시에서, 데이터(Apps Script API)는 항상 네트워크로.
   · 화면은 network-first 라서 수정한 파일이 바로 반영됩니다. */
var CACHE = 'robocomcrm-shell-v1';
var ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];
var APP = new URL('index.html', self.registration.scope).href;

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(ASSETS); })
      .catch(function () {})
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;                    // API(POST)는 그대로 통과
  var url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;      // Apps Script 등 외부는 손대지 않음

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(APP, copy); }).catch(function () {});
        return res;
      }).catch(function () {
        return caches.match(APP).then(function (hit) { return hit || caches.match('./'); });
      })
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        if (res && res.status === 200 && res.type === 'basic') {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); }).catch(function () {});
        }
        return res;
      });
    })
  );
});

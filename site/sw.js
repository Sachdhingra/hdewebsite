/* Home Decor Enterprises service worker: lets the site install as an app and open offline.
   Pages, scripts and styles are network-first so updates show straight away; images are cache-first. */
var VERSION = "hde-v1";
var CORE = ["/", "/index.html", "/collections.html", "/stores.html", "/contact.html", "/assets/css/styles.css",
  "/assets/js/config.js", "/assets/js/data.js", "/assets/js/main.js", "/assets/img/hde-logo-160.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function put(req, res) {
  if (res && res.ok && res.type === "basic") {
    var copy = res.clone();
    caches.open(VERSION).then(function (c) { c.put(req, copy); });
  }
  return res;
}

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  if (req.destination === "image") {
    e.respondWith(caches.match(req).then(function (hit) {
      return hit || fetch(req).then(function (res) { return put(req, res); });
    }));
    return;
  }
  e.respondWith(fetch(req).then(function (res) { return put(req, res); }).catch(function () {
    return caches.match(req, { ignoreSearch: req.mode === "navigate" }).then(function (hit) {
      return hit || (req.mode === "navigate" ? caches.match("/index.html") : undefined);
    });
  }));
});

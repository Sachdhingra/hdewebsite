/* Home Decor Enterprises: service worker so the site can be installed as an app.
 * Network first for everything, so prices, stock and settings are always fresh;
 * the cached home page is only a fallback when the visitor is offline. */
var CACHE = "hde-shell-v1";
var SHELL = ["./", "./index.html", "./assets/css/styles.css", "./assets/img/app/icon-192.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(fetch(req).catch(function () {
    return caches.match(req).then(function (hit) {
      return hit || (req.mode === "navigate" ? caches.match("./index.html") : Response.error());
    });
  }));
});

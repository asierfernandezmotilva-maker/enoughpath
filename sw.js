/* Sin conexión: guarda las páginas visitadas y los archivos. Páginas: primero la red; archivos: primero la copia. (Copiado de Crewdays) */
var C = "ep-v2";
self.addEventListener("install", function (e) { e.waitUntil(caches.open(C).then(function (c) { return c.addAll(["/", "/js/engine.js", "/js/calc.js", "/favicon.svg", "/fonts/inter-latin-wght.woff2"]); })); self.skipWaiting(); });
self.addEventListener("activate", function (e) { e.waitUntil(caches.keys().then(function (k) { return Promise.all(k.filter(function (x) { return x !== C; }).map(function (x) { return caches.delete(x); })); })); self.clients.claim(); });
self.addEventListener("fetch", function (e) {
  var r = e.request; if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  // Guarda una sola copia por ruta: borra las de otra ?v= antes de guardar la nueva.
  var save = function (res) { if (res.ok) { var copy = res.clone(), p = new URL(r.url).pathname; caches.open(C).then(function (c) { return c.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return new URL(k.url).pathname === p && k.url !== r.url; }).map(function (k) { return c.delete(k); })); }).then(function () { return c.put(r, copy); }); }); } return res; };
  if (r.mode === "navigate") e.respondWith(fetch(r).then(save).catch(function () { return caches.match(r, { ignoreSearch: true }).then(function (m) { return m || caches.match("/", { ignoreSearch: true }); }); }));
  else e.respondWith(caches.match(r).then(function (m) { return m || fetch(r).then(save); }));
});

/* Booth Log offline worker.
   Bump CACHE when index.html changes so phones pick the new version up. */
var CACHE = "boothlog-v4";
var CORE = ["./", "./index.html", "./manifest.webmanifest",
            "./icon-192.png", "./icon-512.png", "./icon-180.png"];
var LIBS = [
  "https://cdnjs.cloudflare.com/ajax/libs/jsQR/1.4.0/jsQR.js",
  "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      // libraries are best-effort: never let one failure block the install
      LIBS.forEach(function (u) {
        fetch(u, { mode: "cors" }).then(function (r) { if (r.ok) c.put(u, r); }).catch(function () {});
      });
      return c.addAll(CORE);
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; })
                             .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;

  // The page itself: try the network so updates land, fall back to cache offline.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then(function (r) {
        var copy = r.clone();
        caches.open(CACHE).then(function (c) { c.put("./index.html", copy); });
        return r;
      }).catch(function () {
        return caches.match("./index.html").then(function (r) { return r || caches.match("./"); });
      })
    );
    return;
  }

  // Everything else: cache first, then network.
  e.respondWith(
    caches.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (r) {
        if (r && (r.ok || r.type === "opaque")) {
          var copy = r.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return r;
      });
    })
  );
});

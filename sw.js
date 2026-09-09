/* PrompterGo Booth Log offline worker.
   Bump CACHE when index.html changes so phones pick the new version up. */
var CACHE = "boothlog-v13";
var CORE = ["./", "./index.html", "./manifest.webmanifest",
            "./jsQR.min.js",
            "./icon-192.png", "./icon-512.png", "./icon-180.png"];
// Fetched best-effort; a failure here must never block the install.
var LIBS = [
  "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      LIBS.forEach(function (u) {
        fetch(u, { mode: "cors" }).then(function (r) { if (r.ok) c.put(u, r); }).catch(function () {});
      });
      // Each core file is cached on its own. addAll() rejects the whole batch if
      // any single file 404s, which silently kills the install and strands every
      // phone on the previously installed worker.
      return Promise.all(CORE.map(function (u) {
        return fetch(u, { cache: "reload" })
          .then(function (r) { if (r && r.ok) return c.put(u, r); })
          .catch(function () {});
      }));
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

  var url;
  try { url = new URL(req.url); } catch (err) { return; }

  // NEVER touch the sync API. The pull is a GET, so the old catch-all rule
  // below cached it: a phone that got one cached reply fed the stale
  // serverTime back in as its next cursor, asked the identical question, got
  // the identical cached answer, and stopped seeing other people's entries for
  // good. Anything that is not our own static asset goes straight to network.
  if (url.origin !== self.location.origin) return;
  if (/\/exec(\/|$)/.test(url.pathname) || url.search) return;

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

  e.respondWith(
    caches.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (r) {
        if (r && r.ok) {
          var copy = r.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return r;
      });
    })
  );
});

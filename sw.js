/* Schornstein Planer – Service Worker */

const VERSION = "v30";
const PREFIX = "schornstein-planer-";
const CACHE = PREFIX + VERSION;

const ASSETS = [
  "./",
  "index.html",
  "start-hub.js",
  "luftverbund.js",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png"
];

/* INSTALL */
self.addEventListener("install", event => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then(cache =>
        Promise.all(
          ASSETS.map(url =>
            cache
              .add(
                new Request(url, {
                  cache: "reload"
                })
              )
              .catch(err => {
                console.warn(
                  "SW: konnte nicht speichern:",
                  url,
                  err
                );
              })
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

/* ACTIVATE */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(
              key =>
                key.startsWith(PREFIX) &&
                key !== CACHE
            )
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

/* NACHRICHTEN */
self.addEventListener("message", event => {
  if (event.data === "skipWaiting") {
    self.skipWaiting();
  }
});

/* FETCH */
self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin
  ) {
    return;
  }

  /*
   * HTML:
   * Netzwerk zuerst.
   * Bei Offline auf Cache zurückfallen.
   */
  if (
    request.mode === "navigate" ||
    request.destination === "document"
  ) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();

            caches
              .open(CACHE)
              .then(cache =>
                cache.put(request, copy)
              )
              .catch(() => {});
          }

          return response;
        })
        .catch(() =>
          caches
            .match(request, {
              ignoreSearch: true
            })
            .then(
              hit =>
                hit ||
                caches.match("index.html")
            )
        )
    );

    return;
  }

  /*
   * JS / CSS / Bilder:
   * Cache zuerst.
   * Neue Version im Hintergrund aktualisieren.
   */
  event.respondWith(
    caches
      .match(request, {
        ignoreSearch: true
      })
      .then(hit => {
        const update = fetch(request)
          .then(response => {
            if (response && response.ok) {
              const copy = response.clone();

              caches
                .open(CACHE)
                .then(cache =>
                  cache.put(request, copy)
                )
                .catch(() => {});
            }

            return response;
          })
          .catch(() => null);

        return hit || update;
      })
  );
});
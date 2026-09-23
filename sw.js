const CACHE_NAME = "schornstein-planer-v9";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png"
];

// Installation
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// Aktivierung
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames =>
        Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME)
            .map(name => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Anfragen
self.addEventListener("fetch", event => {
  const request = event.request;

  // Nur GET-Anfragen behandeln
  if (request.method !== "GET") {
    return;
  }

  // HTML/Navigationsseiten:
  // zuerst Netzwerk, bei fehlender Verbindung Cache verwenden
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.ok) {
            const responseClone = response.clone();

            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }

          return response;
        })
        .catch(() =>
          caches.match(request)
            .then(cachedResponse =>
              cachedResponse || caches.match("./index.html")
            )
        )
    );

    return;
  }

  // Andere Dateien:
  // zuerst Cache, ansonsten Netzwerk
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then(response => {
            if (!response || !response.ok) {
              return response;
            }

            const responseClone = response.clone();

            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });

            return response;
          });
      })
  );
});
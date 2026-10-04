/* Schornstein Planer – Service Worker
   Bei JEDER Änderung an einer der Dateien unten die VERSION erhöhen (z. B. v10 -> v11),
   damit Geräte die neuen Dateien holen und die alten verwerfen. */
const VERSION = "v10";
const PREFIX = "schornstein-planer-";
const CACHE = PREFIX + VERSION;
/* Alles, was offline verfügbar sein soll (Pfade relativ zu sw.js).
   Neue Seiten/Funktionen hier ergänzen. */
const ASSETS = [
  "./",
  "index.html",
  "start-hub.js",
  "luftverbund.html",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png"
];
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE).then(cache =>
      /* Jede Datei einzeln: fehlt eine (z. B. ein Icon), schlägt nicht die ganze Installation fehl */
      Promise.all(
        ASSETS.map(url =>
          cache.add(new Request(url, { cache: "reload" })).catch(() => {
            console.warn("SW: nicht zwischengespeichert:", url);
          })
        )
      )
    ).then(() => self.skipWaiting())
  );
});
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key.startsWith(PREFIX) && key !== CACHE)
            .map(key => caches.delete(key))
      )
        )
      .then(() => self.clients.claim())
  );
});
self.addEventListener("message", event => {
  if (event.data === "skipWaiting") self.skipWaiting();
});
self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  /* Nur eigene GET-Anfragen behandeln (PayPal, Downloads usw. bleiben unberührt) */
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  /* Seiten (index.html, luftverbund.html): zuerst Netz, damit Updates sofort ankommen; offline aus dem Cache */
  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(() =>
          caches.match(request, { ignoreSearch: true })
            .then(hit => hit || caches.match("index.html"))
        )
    );
    return;
  }
  /* Alles andere (JS, Icons, Manifest): aus dem Cache liefern, im Hintergrund aktualisieren */
  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then(hit => {
      const update = fetch(request)
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => hit);
      return hit || update;
    })
  );
});
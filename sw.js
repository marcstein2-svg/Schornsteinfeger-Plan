/* Schornstein Planer – Service Worker 
   Bei JEDER Änderung an einer der Dateien unten 
   die VERSION erhöhen. 
*/ 
 
const VERSION = "v29"; 
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
 
self.addEventListener("install", event => { 
  event.waitUntil( 
    caches.open(CACHE).then(cache => 
      Promise.all( 
        ASSETS.map(url => 
          cache 
            .add( 
              new Request(url, { 
                cache: "reload" 
              }) 
            ) 
            .catch(() => { 
              console.warn( 
                "SW: nicht zwischengespeichert:", 
                url 
              ); 
            }) 
        ) 
      ) 
    ).then(() => 
      self.skipWaiting() 
    ) 
  ); 
}); 
 
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
            .map(key => 
              caches.delete(key) 
            ) 
        ) 
      ) 
      .then(() => 
        self.clients.claim() 
      ) 
  ); 
}); 
 
self.addEventListener( 
  "message", 
  event => { 
    if ( 
      event.data === 
      "skipWaiting" 
    ) { 
      self.skipWaiting(); 
    } 
  } 
); 
 
self.addEventListener( 
  "fetch", 
  event => { 
    const request = 
      event.request; 
 
    const url = 
      new URL(request.url); 
 
    if ( 
      request.method !== "GET" || 
      url.origin !== 
        self.location.origin 
    ) { 
      return; 
    } 
 
    /* 
     * HTML: 
     * zuerst Netzwerk, 
     * bei Offline Cache. 
     */ 
    if ( 
      request.mode === "navigate" || 
      request.destination === 
        "document" 
    ) { 
      event.respondWith( 
        fetch(request) 
          .then(response => { 
            if ( 
              response && 
              response.ok 
            ) { 
              const copy = 
                response.clone(); 
 
              caches 
                .open(CACHE) 
                .then(cache => 
                  cache.put( 
                    request, 
                    copy 
                  ) 
                ); 
            } 
 
            return response; 
          }) 
          .catch(() => 
            caches 
              .match( 
                request, 
                { 
                  ignoreSearch: true 
                } 
              ) 
              .then( 
                hit => 
                  hit || 
                  caches.match( 
                    "index.html" 
                  ) 
              ) 
          ) 
      ); 
 
      return; 
    } 
 
    /* 
     * JS / CSS / Bilder: 
     * Cache zuerst, 
     * Netzwerk aktualisiert im Hintergrund. 
     */ 
    event.respondWith( 
      caches 
        .match( 
          request, 
          { 
            ignoreSearch: true 
          } 
        ) 
        .then(hit => { 
          const update = 
            fetch(request) 
              .then(response => { 
                if ( 
                  response && 
                  response.ok 
                ) { 
                  const copy = 
                    response.clone(); 
 
                  caches 
                    .open(CACHE) 
                    .then(cache => 
                      cache.put( 
                        request, 
                        copy 
                      ) 
                    ); 
                } 
 
                return response; 
              }) 
              .catch(() => 
                hit 
              ); 
 
          return hit || update; 
        }) 
    ); 
  } 
); 

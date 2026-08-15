const CACHE_NAME = 'atmos-v1';
const CACHE_LIFETIME = 5 * 60 * 1000; // 5 minutes

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Basic static files for a PWA
      return cache.addAll([
        '/',
        '/manifest.json',
        '/index.html'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  
  if (request.url.includes('/api/')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          const fetchedOn = cachedResponse.headers.get('sw-fetched-on');
          if (fetchedOn && (new Date().getTime() - parseInt(fetchedOn)) < CACHE_LIFETIME) {
            return cachedResponse;
          }
        }
        
        return fetch(request).then((networkResponse) => {
          const cacheCopy = networkResponse.clone();
          caches.open('atmos-api-cache').then((cache) => {
            const headers = new Headers(cacheCopy.headers);
            headers.append('sw-fetched-on', new Date().getTime());
            
            cache.put(request, new Response(cacheCopy.body, {
              status: cacheCopy.status,
              statusText: cacheCopy.statusText,
              headers: headers
            }));
          });
          return networkResponse;
        }).catch(() => {
          return cachedResponse || new Response(JSON.stringify({ error: "Offline" }), { status: 503 });
        });
      })
    );
    return;
  }

  // Network first for other assets
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

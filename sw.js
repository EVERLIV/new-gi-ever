// sw.js

const CACHE_NAME = 'everliv-health-cache-v4'; // Bump version
const URLS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './maskable-icon.svg',
  './icons/icon-72x72.png',
  './icons/icon-96x96.png',
  './icons/icon-128x128.png',
  './icons/icon-144x144.png',
  './icons/icon-152x152.png',
  './icons/icon-192x192.png',
  './icons/icon-384x384.png',
  './icons/icon-512x512.png',
  './screenshots/screenshot-desktop-1.png',
  './screenshots/screenshot-mobile-1.png'
];

// Install event: cache the app shell
self.addEventListener('install', event => {
  self.skipWaiting(); // Activate new SW immediately
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(URLS_TO_CACHE);
      })
      .catch(err => {
        console.error('Failed to open cache', err);
      })
  );
});

// Fetch event: serve from cache first, then network
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Handle share target POST request
  if (event.request.method === 'POST' && url.pathname === '/share-target') {
    event.respondWith(Response.redirect('./#/blood-test', 303)); // Use 303 See Other for POST redirect
    event.waitUntil(async function() {
      try {
        const formData = await event.request.formData();
        const files = formData.getAll('files'); // 'files' must match the name in manifest.json
        if (files && files.length > 0) {
            // Find the main client to send the message to.
            const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
            if (clients && clients.length > 0) {
                 // Sort by visibility and focus to find the most likely active client.
                clients.sort((a, b) => {
                    if (a.focused) return -1;
                    if (b.focused) return 1;
                    if (a.visibilityState === 'visible') return -1;
                    if (b.visibilityState === 'visible') return 1;
                    return 0;
                });
                clients[0].postMessage({ type: 'SHARED_FILE', file: files[0] });
            }
        }
      } catch (e) {
        console.error('Error handling shared file in SW:', e);
      }
    }());
    return;
  }

  // We only want to cache GET requests for other cases.
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Not in cache - fetch from network
        return fetch(event.request).then(
          networkResponse => {
            // Check if we received a valid response
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }
            
            // IMPORTANT: Clone the response.
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                if (event.request.url.startsWith(self.location.origin)) {
                   cache.put(event.request, responseToCache);
                }
              });

            return networkResponse;
          }
        );
      })
      .catch(error => {
        console.error('Error in fetch handler:', error);
      })
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Claim clients immediately
  );
});
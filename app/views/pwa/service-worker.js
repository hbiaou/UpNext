const CACHE_NAME = 'upnext-v1'
const OFFLINE_URL = '/'

// Files to cache for offline functionality
const FILES_TO_CACHE = [
  '/',
  '/manifest',
  '/assets/tailwind.css',
  '/assets/application.js',
  '/icon.png',
  '/icon.svg'
]

// Install event - cache core files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching core files')
      return cache.addAll(FILES_TO_CACHE)
    })
  )
  self.skipWaiting()
})

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }

      return fetch(event.request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }

        // Clone the response for caching
        const responseToCache = response.clone()
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache)
        })

        return response
      }).catch(() => {
        // If fetch fails and no cached version, serve offline page
        return caches.match(OFFLINE_URL)
      })
    })
  )
})

// Background sync for offline task/note operations
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

function doBackgroundSync() {
  // This would handle syncing offline changes when connection returns
  // For now, we'll rely on IndexedDB for local storage
  console.log('Background sync triggered')
  return Promise.resolve()
}

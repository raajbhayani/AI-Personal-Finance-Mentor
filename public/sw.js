const CACHE_NAME = 'finance-ai-v1.0.0';
const STATIC_CACHE_NAME = 'finance-ai-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'finance-ai-dynamic-v1.0.0';

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/transactions',
  '/goals',
  '/analytics',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// API endpoints to cache with different strategies
const API_CACHE_PATTERNS = {
  userProfile: /\/api\/user\/profile/,
  transactions: /\/api\/transactions/,
  goals: /\/api\/goals/,
  analytics: /\/api\/analytics/,
  categories: /\/api\/categories/,
};

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only',
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME &&
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle different caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
  } else if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(handleStaticAssets(request));
  } else if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)) {
    event.respondWith(handleAssets(request));
  } else {
    event.respondWith(handleNavigation(request));
  }
});

// Handle API requests with different strategies based on endpoint
async function handleApiRequest(request) {
  const url = new URL(request.url);

  try {
    // Determine cache strategy based on endpoint
    let strategy = CACHE_STRATEGIES.NETWORK_FIRST;

    if (API_CACHE_PATTERNS.userProfile.test(url.pathname)) {
      strategy = CACHE_STRATEGIES.STALE_WHILE_REVALIDATE;
    } else if (API_CACHE_PATTERNS.categories.test(url.pathname)) {
      strategy = CACHE_STRATEGIES.CACHE_FIRST;
    } else if (API_CACHE_PATTERNS.analytics.test(url.pathname)) {
      strategy = CACHE_STRATEGIES.NETWORK_FIRST;
    }

    return await executeStrategy(request, strategy, DYNAMIC_CACHE_NAME);
  } catch (error) {
    console.error('[SW] API request failed:', error);

    // Return cached response if available
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline fallback for critical API calls
    if (API_CACHE_PATTERNS.userProfile.test(url.pathname)) {
      return new Response(
        JSON.stringify({
          error: 'Offline',
          message: 'User profile not available offline'
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    throw error;
  }
}

// Handle static assets (_next/static files)
async function handleStaticAssets(request) {
  return executeStrategy(request, CACHE_STRATEGIES.CACHE_FIRST, STATIC_CACHE_NAME);
}

// Handle other assets (images, fonts, etc.)
async function handleAssets(request) {
  return executeStrategy(request, CACHE_STRATEGIES.STALE_WHILE_REVALIDATE, STATIC_CACHE_NAME);
}

// Handle navigation requests (pages)
async function handleNavigation(request) {
  try {
    // Try network first for navigation
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Navigation request failed, trying cache:', error);

    // Try to serve from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Serve offline page for navigation failures
    const offlineResponse = await caches.match('/');
    if (offlineResponse) {
      return offlineResponse;
    }

    // Last resort - basic offline page
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Offline - Finance AI</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              text-align: center;
              padding: 50px;
              background: #f8fafc;
            }
            .offline-container {
              max-width: 400px;
              margin: 0 auto;
              background: white;
              padding: 40px;
              border-radius: 12px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .offline-icon {
              font-size: 48px;
              margin-bottom: 20px;
            }
            .offline-title {
              font-size: 24px;
              font-weight: 600;
              color: #374151;
              margin-bottom: 16px;
            }
            .offline-message {
              color: #6b7280;
              line-height: 1.6;
              margin-bottom: 24px;
            }
            .retry-button {
              background: #3b82f6;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-size: 16px;
              cursor: pointer;
              transition: background 0.2s;
            }
            .retry-button:hover {
              background: #2563eb;
            }
          </style>
        </head>
        <body>
          <div class="offline-container">
            <div class="offline-icon">📱</div>
            <div class="offline-title">You're offline</div>
            <div class="offline-message">
              Check your internet connection and try again. Some features may be available from your cached data.
            </div>
            <button class="retry-button" onclick="window.location.reload()">
              Try Again
            </button>
          </div>
        </body>
      </html>
      `,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
}

// Execute different caching strategies
async function executeStrategy(request, strategy, cacheName) {
  const cache = await caches.open(cacheName);

  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      return cacheFirst(request, cache);

    case CACHE_STRATEGIES.NETWORK_FIRST:
      return networkFirst(request, cache);

    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return staleWhileRevalidate(request, cache);

    case CACHE_STRATEGIES.NETWORK_ONLY:
      return fetch(request);

    case CACHE_STRATEGIES.CACHE_ONLY:
      return cache.match(request);

    default:
      return networkFirst(request, cache);
  }
}

// Cache first strategy
async function cacheFirst(request, cache) {
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache first network fallback failed:', error);
    throw error;
  }
}

// Network first strategy
async function networkFirst(request, cache) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network first falling back to cache:', error);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Stale while revalidate strategy
async function staleWhileRevalidate(request, cache) {
  const cachedResponse = await cache.match(request);

  // Always try to update cache in background
  const networkResponsePromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch((error) => {
    console.log('[SW] Background revalidation failed:', error);
  });

  // Return cached response immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }

  // Wait for network response if no cache available
  return networkResponsePromise;
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);

  if (event.tag === 'transaction-sync') {
    event.waitUntil(syncTransactions());
  } else if (event.tag === 'goal-sync') {
    event.waitUntil(syncGoals());
  }
});

// Sync offline transactions
async function syncTransactions() {
  try {
    console.log('[SW] Syncing offline transactions...');

    // Get pending transactions from IndexedDB or cache
    const pendingTransactions = await getPendingTransactions();

    for (const transaction of pendingTransactions) {
      try {
        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(transaction),
        });

        if (response.ok) {
          await removePendingTransaction(transaction.id);
          console.log('[SW] Transaction synced:', transaction.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync transaction:', transaction.id, error);
      }
    }
  } catch (error) {
    console.error('[SW] Transaction sync failed:', error);
  }
}

// Sync offline goals
async function syncGoals() {
  try {
    console.log('[SW] Syncing offline goals...');
    // Similar implementation for goals
  } catch (error) {
    console.error('[SW] Goal sync failed:', error);
  }
}

// Helper functions for offline data management
async function getPendingTransactions() {
  // Implementation would read from IndexedDB
  return [];
}

async function removePendingTransaction(id) {
  // Implementation would remove from IndexedDB
}

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  const options = {
    body: 'You have new financial insights available',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: {
      url: '/dashboard'
    },
    actions: [
      {
        action: 'view',
        title: 'View Dashboard',
        icon: '/icons/action-view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/action-dismiss.png'
      }
    ],
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification('Finance AI', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);

  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.matchAll().then((clientList) => {
        for (let client of clientList) {
          if (client.url === self.location.origin + '/dashboard' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/dashboard');
        }
      })
    );
  }
});

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  } else if (event.data && event.data.type === 'CLEAR_CACHE') {
    clearAllCaches().then(() => {
      event.ports[0].postMessage({ success: true });
    }).catch((error) => {
      event.ports[0].postMessage({ success: false, error: error.message });
    });
  }
});

// Clear all caches
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
}

console.log('[SW] Service worker script loaded');
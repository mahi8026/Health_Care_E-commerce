/**
 * MediportBD Service Worker
 *
 * Caching strategy:
 * - Static assets (_next/static, images, fonts): Cache-first (long TTL)
 * - API calls (/api/*): Network-first with 5s timeout, then stale cache
 * - HTML pages: Network-first, then offline fallback
 * - Cloudinary images: SKIP (let browser fetch directly — Cloudinary has own CDN)
 * - YouTube thumbnails: Cache-first with 24h TTL
 *
 * OneSignal push notifications are handled by importing their service worker script.
 */

// ── OneSignal Service Worker (handles push delivery) ─────────────────────────
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

const CACHE_VERSION = 'Mediport-v2'; // v2: Skip Cloudinary (CSP fix)
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;
const API_CACHE = `${CACHE_VERSION}-api`;
const PAGE_CACHE = `${CACHE_VERSION}-pages`;

// Assets to pre-cache on install (app shell)
const PRECACHE_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
];

// ── Install: precache app shell ──────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(PRECACHE_ASSETS).catch(() => {
        // Non-fatal — some assets may not exist yet
      })
    )
  );
  // Activate immediately without waiting for old tabs to close
  self.skipWaiting();
});

// ── Activate: clean up old caches ────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('Mediport-') && !key.startsWith(CACHE_VERSION))
          .map((key) => caches.delete(key))
      )
    )
  );
  // Take control of all clients immediately
  self.clients.claim();
});

// ── Fetch: intercept network requests ────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip Chrome extensions and non-http(s) requests
  if (!url.protocol.startsWith('http')) return;

  // ── Next.js static assets: Cache-first (they are content-hashed) ─────────
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // ── Cloudinary images: SKIP service worker (let browser fetch directly) ───
  // Cloudinary has its own CDN + caching. Service worker fetch context blocks
  // these requests due to CSP restrictions in SW scope. Skipping SW interception
  // allows browser to fetch images directly with proper CSP headers from the page.
  if (url.hostname === 'res.cloudinary.com') {
    return; // Don't intercept — browser handles it directly
  }

  // ── YouTube thumbnails: Cache-first with 24h TTL ──────────────────────────
  if (url.hostname === 'img.youtube.com') {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  // ── API requests: Network-first with timeout fallback ────────────────────
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstWithTimeout(request, API_CACHE, 5000));
    return;
  }

  // ── HTML pages: Network-first with offline fallback ──────────────────────
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstWithOfflineFallback(request, PAGE_CACHE));
    return;
  }
});

// ── Caching Strategies ───────────────────────────────────────────────────────

/** Cache-first: return from cache if available, else fetch and cache */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

/** Network-first with timeout: try network, fall back to cache */
async function networkFirstWithTimeout(request, cacheName, timeout) {
  const cache = await caches.open(cacheName);

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('timeout')), timeout)
  );

  try {
    const response = await Promise.race([fetch(request), timeoutPromise]);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'Offline', cached: false }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/** Network-first for pages with offline fallback page */
async function networkFirstWithOfflineFallback(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;

    // Return the pre-cached offline page
    const offlinePage = await caches.match('/offline');
    return offlinePage || new Response('<h1>You are offline</h1>', {
      headers: { 'Content-Type': 'text/html' },
    });
  }
}

// ── Push notification handler ───────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try { data = event.data.json(); }
  catch { data = { title: 'MediportBD', body: event.data.text() }; }

  const options = {
    body:    data.body    || '',
    icon:    data.icon    || '/icons/icon-192x192.png',
    badge:   data.badge   || '/icons/badge-72x72.png',
    image:   data.image   || undefined,
    tag:     data.tag     || 'mediportbd-notification',
    vibrate: [200, 100, 200],
    data:    { url: data.url || '/', ...data.data },
    actions: data.actions || [],
    requireInteraction: data.urgency === 'high',
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'MediportBD', options)
  );
});

// ── Notification click handler ──────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';
  const action = event.action;

  // Handle action buttons
  let targetUrl = url;
  if (action === 'track')   targetUrl = url;
  if (action === 'review')  targetUrl = '/account/orders';
  if (action === 'reorder') targetUrl = url;
  if (action === 'shop')    targetUrl = url;
  if (action === 'buy')     targetUrl = url;
  if (action === 'view')    targetUrl = url;
  if (action === 'dismiss') return; // Just close

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if open
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Open new window
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});

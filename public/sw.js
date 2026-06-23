// AWS Certification Quiz — service worker.
// Purpose: (1) make the app installable and (2) keep it usable offline.
//
// Strategy:
//   - Page navigations: network-first (fresh quiz shell/data), cache fallback when offline.
//   - Same-origin static assets (/_next/static, icons): cache-first for instant loads.
//   - Live data (Supabase + the app's own /api routes): bypassed (NetworkOnly) so
//     /api/quiz/stats and friends are ALWAYS live — never served stale on mobile.
//
// Bump VERSION on any meaningful change; the activate handler purges old caches
// and skipWaiting()/clients.claim() activate the new SW on installed PWAs.
//   v2: force installed clients onto this SW so the /api network-only policy
//       reaches phones where Insights was showing no data (stale-cache fix).
const VERSION = "v2";
const CACHE = `aws-quiz-${VERSION}`;
// The HTML shell + the stable static icon. Hashed /_next assets and per-route
// pages are populated at runtime by the fetch handler below.
const APP_SHELL = [
  "/",
  "/manifest.webmanifest",
  "/icon.svg",
  "/favicon.ico",
  "/apple-touch-icon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-192.png",
  "/icons/maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only GET requests are cacheable; let the browser handle the rest.
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never intercept live data — Supabase and the app's own /api routes always
  // go straight to the network and must never be served stale from the cache.
  if (url.hostname.endsWith("supabase.co") || url.pathname.startsWith("/api/")) return;

  // Page navigations: network-first with offline fallback to the cached shell.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches
            .match(request, { ignoreSearch: true })
            .then((cached) => cached || caches.match("/"))
        )
    );
    return;
  }

  // Same-origin static assets: cache-first (populate on first hit).
  if (url.origin === self.location.origin) {
    event.respondWith(
      // ignoreSearch so cache-busted static URLs (e.g. /favicon.ico?<hash>)
      // still match their precached entry.
      caches.match(request, { ignoreSearch: true }).then((cached) => {
        return (
          cached ||
          fetch(request)
            .then((response) => {
              const copy = response.clone();
              caches.open(CACHE).then((cache) => cache.put(request, copy));
              return response;
            })
            // Uncached + offline: degrade silently with a 504 instead of surfacing
            // ERR_FAILED (e.g. a cache-busted favicon URL we couldn't precache).
            .catch(() => new Response("", { status: 504, statusText: "Offline" }))
        );
      })
    );
  }
});

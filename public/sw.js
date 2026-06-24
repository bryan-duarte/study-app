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
//   v3: purge a poisoned CSS chunk — installed PWAs were serving an old
//       stylesheet (missing the navs' `position:fixed`, with a stale `body > *`
//       rule), which dropped the bottom nav into normal flow on the long
//       Explorer/Sessions/Tags lists. Paired with the stale-while-revalidate
//       fetch policy below so a changed asset at a stable URL self-heals.
//   v4: the real recurrence. Client-side <Link> navigations fetch the RSC
//       flight payload at `/<route>?_rsc=<buildId>`. The static branch matched
//       with `ignoreSearch:true`, so EVERY `?_rsc=` value collapsed onto one
//       cached entry — after a deploy the SW handed the new-build client an old
//       build's payload, pointing at content-hashed chunks the new deploy had
//       removed (404) and module ids the new runtime didn't know. Insights/
//       Explorer/Tags (reached via the nav) broke; Home (full navigation) did
//       not. Fix: treat navigations AND `?_rsc=` requests as network-first with
//       EXACT-url matching, and stop using a blanket ignoreSearch.
const VERSION = "v4";
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

  // Page navigations AND React Server Component flight payloads are dynamic,
  // build-versioned content. Next's App Router fetches client-side <Link>
  // navigations as `/<route>?_rsc=<buildId>` (with an `RSC: 1` header), so these
  // MUST be network-first — a fresh deploy is picked up immediately — and MUST
  // be matched by their EXACT url (never ignoreSearch). Collapsing every
  // `?_rsc=` value onto one cached entry is what served a stale cross-build
  // payload and broke Insights/Explorer/Tags after a deploy (see VERSION v4).
  const isRSC =
    request.headers.get("RSC") === "1" || url.searchParams.has("_rsc");
  if (request.mode === "navigate" || isRSC) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        // Offline: serve the exact cached entry if we have one, else the app
        // shell. Exact match only — see the ignoreSearch note above.
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match("/"))
        )
    );
    return;
  }

  // Same-origin static assets (/_next/static/* chunks, icons, manifest):
  // stale-while-revalidate keyed on the EXACT url. Production chunk urls are
  // content-hashed, so changed bytes always arrive under a new url (cache miss
  // → fresh fetch) and a cached entry can never be the wrong version; we still
  // refetch in the background so dev's stable chunk urls self-heal too.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((exact) => {
        // ignoreSearch ONLY as a fallback, so Next's cache-busted
        // /favicon.ico?<hash> still matches the precached /favicon.ico. RSC
        // payloads are handled above and never reach this branch, so this can
        // no longer collapse `?_rsc=` variants.
        const cachedPromise = exact
          ? Promise.resolve(exact)
          : caches.match(request, { ignoreSearch: true });
        return cachedPromise.then((cached) => {
          const network = fetch(request)
            .then((response) => {
              const copy = response.clone();
              caches.open(CACHE).then((cache) => cache.put(request, copy));
              return response;
            })
            // Offline: fall back to cache if we have it, else degrade silently
            // with a 504 instead of surfacing ERR_FAILED.
            .catch(() => cached || new Response("", { status: 504, statusText: "Offline" }));
          // Cache hit → serve instantly, refresh happens in the background.
          // Cache miss → wait on the network.
          return cached || network;
        });
      })
    );
  }
});

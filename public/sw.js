// Buildbybim.space service worker — Sprint 10A (mobile-readiness)
//
// Strategy:
//   - Cache app shell on install (index.html + manifest + icons)
//   - Network-first for everything else with cache fallback (offline read)
//   - Skip cache for Supabase API + auth calls (always live)
//
// IMPORTANT: bump CACHE_VERSION on every release so users get fresh shell.
// Vite hashes JS/CSS by default, so the network-first strategy will pull
// new assets automatically; this is just for the shell + icons.

const CACHE_VERSION = "buildbybim-v0.4.25";
const APP_SHELL = [
  "/",
  "/manifest.webmanifest",
  "/icon-app.svg",
  "/icon-apple-touch.svg",
  "/og-cover.svg"
];

const SUPABASE_HOSTS = ["supabase.co", "supabase.in"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION && key.startsWith("buildbybim-"))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Only handle GET — never cache POST/PUT/DELETE (writes)
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never cache Supabase API/auth/realtime/storage — always live
  if (SUPABASE_HOSTS.some((host) => url.hostname.endsWith(host))) return;

  // Never cache chrome-extension://, browser internals
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  // Network-first with cache fallback (offline read)
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Only cache same-origin successful responses
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached ?? caches.match("/")))
  );
});

// Allow the page to trigger an immediate update (used by sw register code)
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

/* ZPOS Service Worker — minimal app-shell + runtime cache strategy.
 *
 * Goals:
 *  - Allow the POS page to reload even when the customer Wi-Fi drops.
 *  - Never cache POST/PUT/DELETE — those are mutations we want to fail
 *    fast so the UI can decide to queue.
 *  - Use a network-first strategy for HTML so deploys are picked up
 *    quickly, falling back to cache when offline.
 *  - Use a stale-while-revalidate strategy for JS/CSS/images.
 */

const VERSION = "v1";
const CORE_CACHE = `zpos-core-${VERSION}`;
const RUNTIME_CACHE = `zpos-runtime-${VERSION}`;

const CORE_ASSETS = ["/app/pos", "/manifest.json", "/theme-boot.js"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CORE_CACHE).then((cache) => cache.addAll(CORE_ASSETS).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CORE_CACHE && k !== RUNTIME_CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

function isHtml(req) {
  return req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html");
}

function isStaticAsset(url) {
  return /\.(?:js|css|woff2?|ttf|png|jpg|jpeg|svg|webp|ico)$/i.test(url.pathname);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never touch non-GET requests — let the queue logic in the page handle them.
  if (request.method !== "GET") return;

  // Never cache same-origin API routes — they're mutation-adjacent.
  if (url.pathname.startsWith("/api/")) return;

  // Don't cache cross-origin (Supabase, etc.).
  if (url.origin !== self.location.origin) return;

  if (isHtml(request)) {
    // Network-first for HTML, fall back to cache when offline.
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return (
            cached ||
            (await caches.match("/app/pos")) ||
            new Response(
              `<!doctype html><html lang="vi"><meta charset="utf-8"><title>ZPOS Offline</title><body style="font-family:system-ui;padding:2rem"><h1>ZPOS đang offline</h1><p>Trang chưa được lưu cache. Hãy kết nối mạng và thử lại.</p></body></html>`,
              { headers: { "content-type": "text/html; charset=utf-8" } },
            )
          );
        }),
    );
    return;
  }

  if (isStaticAsset(url)) {
    // Stale-while-revalidate for static assets.
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((res) => {
            if (res.ok) cache.put(request, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || (await network);
      }),
    );
  }
});

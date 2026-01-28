/* Tusto SW - cache básico para GitHub Pages */
const CACHE_NAME = "tusto-v1";

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./service-worker.js",
  "./assets/mapa-tusto-prototipo.png",
  "./data/pins.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./historias/h01/index.html",
  "./historias/h02/index.html"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => (k === CACHE_NAME ? null : caches.delete(k))));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Solo GET
  if (req.method !== "GET") return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req, { ignoreSearch: true });
      if (cached) return cached;

      try {
        const res = await fetch(req);
        // Cachea solo respuestas OK y mismo origen
        if (res && res.ok && new URL(req.url).origin === self.location.origin) {
          cache.put(req, res.clone());
        }
        return res;
      } catch (e) {
        // Offline fallback mínimo: vuelve al index
        const fallback = await cache.match("./index.html");
        return fallback || new Response("Offline", { status: 503, statusText: "Offline" });
      }
    })()
  );
});

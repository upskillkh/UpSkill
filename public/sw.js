// Up Skill service worker.
//
// Caching policy is deliberately conservative:
//   - Public, non-personal assets (app shell, icons, stylesheets) are cached.
//   - /api/** responses are NEVER cached. They carry per-user learning records,
//     progress and coach conversations. Caching any of them in a shared Cache
//     Storage bucket would expose one account's data to the next device or user.
//   - Authenticated HTML pages are never precached either.
//
// Only successful GET responses for same-origin static paths enter the cache.

const VERSION = "upskill-v1";
const SHELL = ["/welcome.html", "/skills.html", "/offline.html", "/manifest.webmanifest",
  "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(SHELL).catch(() => undefined))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isCacheableStatic(url) {
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.startsWith("/api/")) return false;        // never cache user data
  if (url.pathname.startsWith("/icons/")) return true;
  return /\.(?:css|js|png|svg|webp|woff2?|json|webmanifest)$/i.test(url.pathname);
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // API traffic: straight to the network, never served from cache.
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(req));
    return;
  }

  if (!isCacheableStatic(url)) return;

  event.respondWith(
    caches.match(req).then((hit) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => hit || caches.match("/offline.html"));
      return hit || network;
    })
  );
});

// Let the page trigger an immediate update after a deploy.
self.addEventListener("message", (event) => {
  if (event.data === "skip-waiting") self.skipWaiting();
});

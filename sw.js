/* 계획과 실제 — service worker.
   Network first, cache as a fallback: online you always get the newest build,
   offline you get the last one that loaded. Records live in the browser's own
   storage and are never touched by this cache. */
/* 버전 = v0.MINOR.PATCH (규칙은 index.html 의 BUILD 주석 참고). index.html 의 BUILD 와 항상 같게 유지할 것. */
const CACHE = "plan-actual-v0.9.2";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./fb.js", "./icon-192.png", "./icon-512.png", "./icon-512-maskable.png", "./icon-180.png"];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {}); }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match("./index.html")))
  );
});

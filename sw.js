/* Service worker : met toute l'application en cache pour fonctionner sans Internet. */
const VERSION = "efv-6ce199340d";
const ASSETS = [
 "./",
 "index.html",
 "manifest.webmanifest",
 "css/app.css",
 "data/ex_A1.json.gz",
 "data/ex_A2.json.gz",
 "data/ex_B1.json.gz",
 "data/ex_B2.json.gz",
 "data/ex_C1.json.gz",
 "data/ex_C2.json.gz",
 "data/ex_Expert.json.gz",
 "data/i18n.json",
 "data/index.json",
 "data/photos.json",
 "data/placement.json.gz",
 "data/tasks.json",
 "data/words.txt.gz",
 "icons/apple-touch-icon.png",
 "icons/icon-192.png",
 "icons/icon-512.png",
 "js/app.js",
 "js/engine.js",
 "js/media.js",
 "js/store.js",
 "snd/correct.m4a",
 "snd/lose.m4a",
 "snd/win.m4a",
 "snd/wrong.m4a"
];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("efv-") && k !== VERSION && k !== "efv-photos")
    .map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;            // Wikipedia, etc. : reseau direct
  e.respondWith(caches.open(VERSION).then(async c => {
    const hit = await c.match(req, { ignoreSearch: true }) || (req.mode === "navigate" ? await c.match("./") : null);
    if (hit) return hit;
    try {
      const r = await fetch(req);
      if (r.ok && url.pathname.startsWith(new URL("./", location).pathname)) c.put(req, r.clone());
      return r;
    } catch (err) {
      return hit || Response.error();
    }
  }));
});

// Service worker scritto a mano: rete prima, cache se la rete manca. Le /api/ le gestisce TanStack Query.
const CACHE = "prenota-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((nomi) => Promise.all(nomi.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/api/")) return;
  // dati RSC della navigazione interna di Next: non in cache (chiavi sempre diverse); senza rete
  // Next ripiega su una navigazione normale, che qui trova la pagina salvata
  if (req.headers.has("RSC")) return;
  e.respondWith(
    fetch(req)
      .then((r) => {
        // solo risposte 200 vere: niente redirect (es. al login) salvati al posto della pagina
        if (r.ok && !r.redirected) {
          const copia = r.clone();
          e.waitUntil(caches.open(CACHE).then((c) => c.put(req, copia)));
        }
        return r;
      })
      .catch(async () => {
        const salvata = await caches.match(req);
        if (salvata) return salvata;
        if (req.mode === "navigate") return (await caches.match("/")) ?? Response.error();
        return Response.error();
      }),
  );
});

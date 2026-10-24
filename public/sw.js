// Service worker scritto a mano: rete prima, cache se la rete manca o (pagine) non risponde entro 4 s. Le /api/ le gestisce TanStack Query.
const CACHE = "prenota-v1";
const ATTESA_RETE = 4000; // ms prima di mostrare la pagina salvata se la rete non risponde

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
  const pagina = req.mode === "navigate";
  // copia salvata; per una pagina mai vista, la home
  const salvata = async () => (await caches.match(req)) ?? (pagina ? await caches.match("/") : undefined);
  const rete = fetch(req);
  // solo risposte 200 vere: niente redirect (es. al login) salvati al posto della pagina.
  // Si salva anche se la risposta arriva dopo che è già stata mostrata la copia (waitUntil tiene vivo il worker).
  e.waitUntil(rete.then((r) => {
    if (r.ok && !r.redirected) {
      const copia = r.clone();
      return caches.open(CACHE).then((c) => c.put(req, copia));
    }
  }).catch(() => {}));
  const senzaRete = rete.catch(async () => (await salvata()) ?? Response.error());
  if (!pagina) { e.respondWith(senzaRete); return; }
  // rete lenta ("c'è ma non va"): dopo ATTESA_RETE si mostra la copia salvata, se c'è; altrimenti si aspetta la rete
  const lenta = new Promise((ok) => setTimeout(() => salvata().then((s) => s && ok(s)), ATTESA_RETE));
  e.respondWith(Promise.race([senzaRete, lenta]));
});

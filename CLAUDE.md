# Prenota

Web app (mobile-first, ottimizzata anche desktop) per le prenotazioni degli spettacoli teatrali: locali, opere,
eventi, prenotazioni con pacchetti ristorante (Giamaica / Casale). Multi utente (admin / operatore).

**A ogni avvio leggere la skill [skill/guidelines/skill.md](skill/guidelines/skill.md)** e seguirne le indicazioni.

**Documentazione completa: [docs/wiki/README.md](docs/wiki/README.md)** – leggerla prima di modificare l'app.
Design: `docs/superpowers/specs/2026-10-24-prenota-design.md`. Design system UI: `docs/design-system/` (token in `src/app/globals.css`, classi in `src/components/stili.ts`).

Stato: app completa (login, admin, eventi, prenotazioni, elenco ristoranti, offline); immagine Docker e compose pronti,
primo `docker build` da provare sull'homelab.

## Stack e comandi

Next.js 16.2.10 (App Router, `output: "standalone"`), React 19.2.3, Tailwind v4, TanStack Query 5, react-hook-form +
zod 4, Postgres con driver `postgres` (nessun ORM), Vitest. Node 20 in locale, `node:22-alpine` nell'immagine.

```bash
npm run dev | build | start | test | lint
npm run db:init           # schema (usa .env.local)
npm run crea-admin        # solo recupero (il primo admin si crea da /primo-accesso): ADMIN_EMAIL, ADMIN_NOME, ADMIN_PASSWORD
npm run docker:deploy     # build linux/amd64 + push su ghcr.io/dario993/prenota
```

Prima di ogni commit: `npm test && npm run lint && npm run build`.

## Mappa del codice

- `src/app/` pagine e Server Action (`login/`, `(app)/eventi/[id]/`, `(app)/admin/`), `api/` route JSON, `POST /api/prenotazioni` e `POST /api/sql` (gestione remota: utente con ruolo «API key» da Admin → Utenti, `Authorization: Bearer`).
- `src/lib/` logica pura e testata: `calcoli.ts`, `schemi.ts`, `auth.ts`, `db.ts`, `query.ts` (cache e coda offline), `righe.ts` (righe tariffa di una prenotazione, lato server), `storico.ts` (cronologia con copia della prenotazione), `password.mjs`, `liveticket.ts` + `liveticket-db.ts` (ordini LiveTicket: abbinamento evento/tariffe, salvataggio, riabbinamento; `POST /api/liveticket` da n8n, pagina Admin → LiveTicket).
- `src/proxy.ts` reindirizza a `/login`; `public/sw.js` service worker; `db/schema.sql` + `db/migrazioni/`; `scripts/` (db-init, crea-admin, esporta-dati.sh, backup.sh).
- `Dockerfile`, `docker-compose.yml`: deploy homelab, vedi wiki 13.

## Cose da non rompere

- Importi in centesimi; data/ora sempre `Europe/Rome` (il server è in UTC).
- Tariffe per opera (`tariffe`, `prenotazioni_tariffe`) con prezzo congelato per riga; una tariffa usata non si elimina, si nasconde. Il pacchetto resta a parte.
- Migrazioni in `db/migrazioni/`, idempotenti: `db-init` le esegue a ogni avvio.
- Capienza: avvisa, non blocca. Offline: si possono solo aggiungere prenotazioni, mai doppioni (id UUID + `on conflict do nothing`).
- Ogni route API e Server Action valida con zod e controlla sessione/ruolo.
- Ogni creazione, modifica o cambio di stato di una prenotazione chiama `registraStorico` nella stessa transazione.
- Ordini LiveTicket (`liveticket_ordini`) non sono prenotazioni: fuori da incassi e cronologia Prenota («Incasso teatro/pacchetti previsto» = solo lista); la commissione (`COMMISSIONE_LIVETICKET`) non si conteggia mai negli incassi.
- Cookie `Secure` in produzione: serve HTTPS.

## Regole del progetto

- **Prima in locale, poi in produzione**: ogni modifica richiesta (dati, eventi, tariffe, prenotazioni, codice) si fa
  solo in locale (`.env.local`) se non è indicato altro; in produzione solo su richiesta esplicita, dopo la verifica in locale.
- **I dati di produzione sono la cosa più importante: nessun dato va mai perso.** Mai aggiungere, modificare o
  cancellare dati in produzione (`/api/sql`, psql, script, migrazioni) senza prima un riepilogo che dica
  esplicitamente «sto per modificare dati IN PRODUZIONE», con tabelle, righe coinvolte e query, e senza l'ok
  dell'utente. Prima di ogni scrittura: esportare le righe toccate (backup), usare una transazione e verificare dopo.
  Le sole letture (`select`) sono libere.
- Interfaccia, testi, nomi di variabili e commit in **italiano** (`feat: …`, `fix: …`, `docs: …`).
- Logica in moduli TS puri e testati (`src/lib/`); i componenti li collegano soltanto.
- Nessuna nuova dipendenza senza motivo forte.
- **Prima di ogni modifica leggere la sezione della wiki che la riguarda** (`docs/wiki/`, indice in `README.md`).
- **Ogni modifica all'app aggiorna la wiki nello stesso commit** (pagina interessata + `docs/wiki/15-registro-modifiche.md`)
  e, se cambia qualcosa di essenziale, anche questo file.

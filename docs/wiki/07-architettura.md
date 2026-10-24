# 7. Architettura

> Stato: fatto

## Stack

| Ruolo | Pacchetto |
|---|---|
| Framework | Next.js 16.2.10 (App Router + Turbopack) |
| UI runtime | React 19.2.3 + react-dom 19.2.3 (versioni esatte) |
| Stile | Tailwind CSS v4 + @tailwindcss/postcss |
| Dati / cache client | TanStack Query 5 + query-sync-storage-persister + react-query-persist-client (localStorage) |
| Form | react-hook-form 7 + zod 4 |
| Icone | lucide-react |
| Toast | sonner |
| Classi | clsx |
| Database | PostgreSQL, driver `postgres` (nessun ORM) |
| Test | Vitest (solo logica pura) |
| Dev | TypeScript 5, ESLint 9 + eslint-config-next |

Un solo progetto: interfaccia e server stanno entrambi in Next.js.

## Cartelle

```
prenota/
  src/app/                 pagine (App Router) e Server Actions
    login/
    eventi/[id]/           pagina evento, prenotazioni/, ristoranti/
    admin/                 locali/, opere/, eventi/, utenti/
    api/                   route JSON per TanStack Query + POST /api/prenotazioni (offline)
  src/components/          componenti UI (nav, contatore, card…)
  src/lib/db.ts            client Postgres – unico punto di accesso al database
  src/lib/auth.ts          sessioni, hash password, controllo ruolo
  src/lib/calcoli.ts       funzioni pure: persone, incassi per tariffa, posti liberi, tariffe del modulo, elenco e testo ristoranti
  src/lib/schemi.ts        schemi zod condivisi tra form e server
  src/lib/righe.ts         righe tariffa di una prenotazione (prezzo congelato, tariffa della stessa opera)
  src/proxy.ts             reindirizza a /login chi non ha sessione
  public/sw.js             service worker (offline)
  db/schema.sql            schema del database (stato finale)
  db/migrazioni/           modifiche ai database esistenti, idempotenti, eseguite da db-init a ogni avvio
  scripts/                 db-init, crea-admin, backup.sh
  Dockerfile, docker-compose.yml   immagine e deploy (vedi [Deploy homelab](13-deploy-homelab.md))
  docs/wiki/               questa wiki
```

## Flusso dei dati

- **Lettura**: le pagine leggono tramite TanStack Query dalle route `GET /api/...`; la cache è salvata in localStorage,
  così le liste restano visibili con rete debole o assente.
- **Route di lettura** (401 `{ errore: "Sessione scaduta" }` senza sessione, 500 `{ errore: "Errore imprevisto, riprova" }`):
  - `GET /api/eventi` → eventi da oggi 00:00 (Europe/Rome) in poi, per data: `{ id, data_ora (ISO), titolo, locale, capienza, persone }[]`, chiave query `["eventi"]`.
  - `GET /api/eventi?passati=1` → eventi prima di oggi 00:00 (Europe/Rome), dal più recente, stessa forma, chiave `["eventi", "passati"]` (ricaricata insieme a `["eventi"]`). Altri valori di `passati` → 400.
  - `GET /api/eventi/[id]` → `{ evento: { id, data_ora, titolo, locale, capienza, prezzi correnti dell'opera }, prenotazioni[] }`, 404 se l'id non è valido o non esiste, chiave `["evento", id]`.
  - `GET /api/provenienze` → `string[]` distinte, non vuote, ordinate, chiave `["provenienze"]`.
- **Scrittura**: Server Actions (admin, modifica/eliminazione prenotazioni). La **creazione** di prenotazioni passa da
  `POST /api/prenotazioni`, così può essere messa in coda offline (vedi [Offline](10-offline.md)).
- Dopo ogni scrittura: `invalidateQueries` per aggiornare le liste.
- Il server **valida sempre** con zod e controlla sessione e ruolo: il client non è fidato.
- Errori di salvataggio → toast (sonner), il form resta compilato.

## Regole di codice

- Logica e calcoli in moduli TS puri e testati (`src/lib/`); i componenti li collegano soltanto.
- Interfaccia, testi, nomi e commit in italiano.
- Nessuna nuova dipendenza senza un motivo forte.

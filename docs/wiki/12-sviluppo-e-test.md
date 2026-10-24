# 12. Sviluppo e test

> Stato: fatto

## Setup locale (macOS, senza Docker)

Richiede Node 20 (`node --env-file` per gli script `.mjs`) e npm 10 (per questo Vitest 3 e `@hookform/resolvers` 5). Le variabili stanno in `.env.local` (non versionato).

```bash
brew install postgresql@17
brew services start postgresql@17
createdb prenota

cp .env.example .env.local     # DATABASE_URL=postgres://localhost/prenota
npm install
npm run db:init                # applica db/schema.sql
npm run dev                    # http://localhost:3000: al primo accesso crea il primo admin dal browser
```

`ADMIN_EMAIL=... ADMIN_PASSWORD=... ADMIN_NOME=... npm run crea-admin` serve solo per recuperare un accesso.

## Comandi

```bash
npm run dev      # sviluppo (Turbopack)
npm run start    # server di produzione (output standalone)
npm test         # Vitest (vitest run)
npm run lint     # ESLint
npm run build    # build di produzione
npm run db:init  # node --env-file=.env.local scripts/db-init.mjs
npm run crea-admin  # node --env-file=.env.local scripts/crea-admin.mjs
npm run docker:build   # immagine ghcr.io/dario993/prenota:latest (linux/amd64)
npm run docker:push    # pubblica su ghcr (docker:deploy = build + push)
```

Prima di ogni commit: `npm test && npm run lint && npm run build`.

## Test automatici

Solo la logica pura (TDD):

- `src/lib/calcoli.test.ts` – persone, incasso teatro/ristorante, posti liberi, elenco e testo ristoranti;
- `src/lib/schemi.test.ts` – validazione (almeno una quantità, ristorante e pasto obbligatori con pacchetti);
- `src/lib/password.test.ts` – hash e verifica password;
- altri test accanto ai moduli di `src/lib/` e dei componenti con logica.

I controlli nel browser sono manuali: la checklist qui sotto.

## Checklist nel browser

**Telefono** (DevTools, 390 px) e **desktop** (≥ 1024 px):

- [ ] Login admin → crea locale (capienza 105), opera con tariffe, evento.
- [ ] Login operatore: `/admin` non accessibile.
- [ ] Prenotazioni: gruppo da 35, 2 pacchetti Casale cena, 1 omaggio, note.
- [ ] 2 pacchetti → incasso teatro +44 €, incasso ristorante +54 €.
- [ ] Superare la capienza → avviso rosso, salvataggio possibile.
- [ ] Pacchetti > 0 senza ristorante o pasto → errore.
- [ ] Elenco ristoranti: Condividi (telefono) / copia (desktop), Stampa.
- [ ] Telefono: barra in basso, schede; desktop: menu laterale, tabella.

### Offline

Solo con `npm run build && npm start` (il service worker non è attivo in sviluppo). Prima apri con la rete la home e
l'evento.

- [ ] DevTools → Network "Offline" → aggiungi 2 prenotazioni → torni subito all'evento, compaiono "in attesa di
  invio", numero 2 sul menu.
- [ ] Ricarica la pagina → si apre lo stesso e sono ancora lì.
- [ ] Modifica / elimina disattivati ("Serve la rete").
- [ ] Torna online → "Prenotazione inviata", numero sparito; nel database una sola riga per ciascuna.
- [ ] Ripeti chiudendo la scheda mentre sei offline e riaprendola online → inviate una volta.
- [ ] Sessione scaduta (cancella le righe in `sessioni` mentre sei offline, poi torna online) → "Accedi di nuovo…";
  dopo il login l'invio parte da solo.

## Workflow git

Un branch per funzionalità, merge in `main` dopo test verdi. Commit in italiano (`feat: …`, `fix: …`, `docs: …`).
Ogni commit che cambia l'app aggiorna la wiki (vedi [README](README.md#manutenzione-della-wiki)).

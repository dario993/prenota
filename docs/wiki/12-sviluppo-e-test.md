# 12. Sviluppo e test

> Stato: da implementare (comandi definitivi dopo lo scaffold)

## Setup locale (macOS, senza Docker)

```bash
brew install postgresql@17
brew services start postgresql@17
createdb prenota

cp .env.example .env.local     # DATABASE_URL=postgres://localhost/prenota
npm install
npm run db:init                # applica db/schema.sql
ADMIN_EMAIL=... ADMIN_PASSWORD=... ADMIN_NOME=... npm run crea-admin
npm run dev                    # http://localhost:3000
```

## Comandi

```bash
npm run dev      # sviluppo (Turbopack)
npm test         # Vitest
npm run lint     # ESLint
npm run build    # build di produzione
```

Prima di ogni commit: `npm test && npm run lint && npm run build`.

## Test automatici

Solo la logica pura (TDD):

- `src/lib/calcoli.test.ts` – persone, incasso teatro/ristorante, posti liberi, elenco e testo ristoranti;
- `src/lib/schemi.test.ts` – validazione (almeno una quantità, ristorante e pasto obbligatori con pacchetti).

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

- [ ] DevTools → Network "Offline" → aggiungi 2 prenotazioni → compaiono "in attesa di invio".
- [ ] Ricarica la pagina → sono ancora lì.
- [ ] Modifica / elimina disattivati.
- [ ] Torna online → inviate; nel database una sola riga per ciascuna.

## Workflow git

Un branch per funzionalità, merge in `main` dopo test verdi. Commit in italiano (`feat: …`, `fix: …`, `docs: …`).
Ogni commit che cambia l'app aggiorna la wiki (vedi [README](README.md#manutenzione-della-wiki)).

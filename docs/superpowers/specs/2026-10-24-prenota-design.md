# Prenota — web app prenotazioni spettacoli teatrali (design + piano)

## Context
Oggi le prenotazioni stanno su un Google Sheet: un blocco per data/spettacolo ("10 ottobre · DOCUFILM · 105"),
colonne NOME, INT, RID, NOTE, TELEFONO, POSTI PREN. Note libere tipo "1 CARROZZINA", "Invito", "SEDERE VICINO AL SINDACO".
Serve un'app mobile-first, multi utente, che sostituisca il foglio: gestire locali, opere, eventi e le prenotazioni
per evento, con pacchetti ristorante (Giamaica / Casale, pranzo o cena) ed elenchi da inviare ai ristoranti.
Cartella `/Users/dario/Documents/APP/prenota` è vuota. Progetti vicini: `biglietteria` (piantina posti, localStorage) e
`stagetrack_backend` (Docker su ghcr → homelab) — solo come riferimento di deploy, nessun codice riusato.

## Goals
- Inserire/modificare prenotazioni velocemente dal telefono.
- Vedere per ogni evento: persone prenotate vs capienza, posti liberi, incasso previsto.
- Elenco per ristorante e per evento da condividere (WhatsApp/email) dal telefono.
- Più persone dello staff con accesso proprio.

## Non-goals
- Prenotazione pubblica da parte degli spettatori.
- Piantina/selezione sedie (i posti sono testo libero, es. `K1-4`).
- Pagamenti, incasso effettivo, stampa biglietti.
- Import automatico dal Google Sheet.
- App nativa mobile.

## Anti-goals
- Interfaccia lenta o piena di passaggi su telefono: inserire una prenotazione deve stare in una schermata.
- Perdere prenotazioni (es. salvataggi a vuoto con rete debole senza avviso).

## Decisioni dell'utente
- Stack web: Next.js 16.2.10 (App Router + Turbopack), React 19.2.3 / react-dom esatti, Tailwind v4 + @tailwindcss/postcss,
  TanStack Query 5 + query-sync-storage-persister + react-query-persist-client (cache in localStorage),
  react-hook-form 7 + zod 4, lucide-react, sonner, clsx, TypeScript 5, ESLint 9 + eslint-config-next.
- Un solo progetto: API / Server Actions di Next.js, **Postgres**, **login con sessione**.
- Sviluppo locale su questa macchina **senza Docker** (Postgres locale, es. Homebrew); deploy in **Docker sull'homelab** come stagetrack.
- Grafica minimal su bianco, accento blu.
- Posti prenotati = testo libero.
- Capienza superata → **avvisa ma lascia salvare**.
- Pacchetto ristorante: **49 €/persona** = **22 € tariffa teatro + 27 € tariffa ristorante**, entrambe modificabili nel
  tariffario; l'app mostra separati il totale incasso teatro e il totale incasso pacchetti ristorante.
- **Mobile prima, ma ottimizzata anche per desktop**: barra in basso su telefono, menu laterale su schermo largo.
- Una prenotazione ha quantità separate: **adulti, ridotti gruppi, bambini, pacchetti, omaggi**.
- Campo **provenienza contatto** (clienti, Facebook, manifesti, …).
- Elenco ristorante per evento inviato col tasto Condividi del telefono.
- **Offline: solo aggiunta.** Senza rete si possono creare nuove prenotazioni: restano salvate sul telefono e vengono
  inviate da sole quando torna la rete. Modifica/eliminazione richiedono la rete (pulsanti disabilitati offline).

## Offline (come funziona)
- Nuova prenotazione = mutation TanStack Query con `mutationKey` + `setMutationDefaults` e chiamata a `POST /api/prenotazioni`
  (route handler, non Server Action, così la mutation può riprendere dopo un riavvio). Senza rete la mutation resta
  "in pausa" e viene salvata in localStorage dal persister; al ritorno della rete/all'avvio `resumePausedMutations()`.
- L'id della prenotazione (UUID) lo genera il telefono → l'insert è idempotente (`ON CONFLICT (id) DO NOTHING`):
  un doppio invio non crea doppioni.
- Le prenotazioni in attesa compaiono subito nell'elenco dell'evento con etichetta "in attesa di invio" e un contatore
  nella barra; il calcolo capienza offline usa i dati in cache (il server accetta comunque: la capienza avvisa, non blocca).
- Per riaprire l'app senza rete serve un service worker minimale scritto a mano (`public/sw.js`): network-first,
  fallback alle pagine/asset già visitati. Niente librerie PWA.
- Offline la sessione non viene verificata dal client; al momento dell'invio il server la controlla. Sessione scaduta →
  le prenotazioni restano in coda e si chiede di rifare login, poi partono.

## Modello dati (Postgres)
- `utenti`: id, nome, email (unique), password_hash, ruolo (`admin` | `operatore`), attivo.
- `sessioni`: id (token random), utente_id, scade_il.
- `locali`: id, nome, capienza (int > 0).
- `opere`: id, titolo, prezzo_adulto, prezzo_ridotto, prezzo_bambino, prezzo_pacchetto_teatro (default 2200),
  prezzo_pacchetto_ristorante (default 2700) — importi in centesimi. Prezzo pacchetto = teatro + ristorante (49 €).
- `eventi`: id, opera_id → opere (restrict), locale_id → locali (restrict), data_ora (timestamptz).
  Un locale ha molti eventi; un evento ha una sola opera.
- `prenotazioni`: id, evento_id → eventi (restrict), cognome_nome, telefono, adulti, ridotti, bambini, pacchetti, omaggi
  (int ≥ 0, almeno una > 0), ristorante (`GIAMAICA` | `CASALE` | null), pasto (`PRANZO` | `CENA` | null),
  posti (testo), provenienza (testo), note (testo), creata_da → utenti, creata_il, aggiornata_il.
  Vincolo DB: se pacchetti > 0 allora ristorante e pasto obbligatori, altrimenti null.
- Totale persone = adulti + ridotti + bambini + pacchetti + omaggi (gli omaggi occupano posto, valgono 0 €).
- **Incasso teatro** = adulti·p_adulto + ridotti·p_ridotto + bambini·p_bambino + pacchetti·p_pacchetto_teatro.
- **Incasso pacchetti ristorante** = pacchetti·p_pacchetto_ristorante (totale e diviso per Giamaica / Casale).
- Totale prenotazione = incasso teatro + incasso ristorante. Prezzi presi da quelli congelati sulla prenotazione.

## Ruoli
- **admin**: tutto, più gestione locali, opere, eventi, utenti.
- **operatore**: vede eventi, crea/modifica/elimina prenotazioni.
- Primo admin creato da script `npm run crea-admin` con email/password da env.

## Schermate (mobile-first; barra in basso < `lg`, menu laterale fisso ≥ `lg` — stesso componente nav, solo CSS)
Su desktop: elenco prenotazioni come tabella con colonne (nome, tipi, ristorante, posti, note), riepilogo evento
affiancato; su mobile: card impilate.
- `/login`
- `/` Prossimi eventi: card con opera, data/ora, locale, barra `persone/capienza`.
- `/eventi/[id]`: riepilogo (persone, posti liberi, per tipo, coperti per ristorante/pasto, incasso teatro,
  incasso pacchetti ristorante totale e per ristorante) +
  elenco prenotazioni alfabetico con ricerca; tasto "+" nuova prenotazione.
- `/eventi/[id]/prenotazioni/nuova` e `/prenotazioni/[id]`: un solo form (react-hook-form + zod), contatori +/- per le
  quantità, sezione ristorante visibile se pacchetti > 0 (scelta ristorante Giamaica/Casale + pranzo/cena in quel
  ristorante, entrambi obbligatori), totale persone e importo live, avviso rosso se si supera la capienza.
  Provenienza = input con suggerimenti dai valori già usati (`<datalist>`).
- `/eventi/[id]/ristoranti`: elenco per Giamaica e per Casale, separato pranzo/cena: nome, telefono, n. coperti, note.
  Tasto Condividi (`navigator.share`, fallback copia negli appunti) e Stampa (`window.print`).
- `/admin/locali`, `/admin/opere`, `/admin/eventi`, `/admin/utenti`: liste + form semplici.

## Architettura
```
prenota/
  src/app/…            pagine (App Router), Server Actions per le mutazioni
  src/app/api/…        route GET JSON per TanStack Query (lista eventi, evento + prenotazioni)
  src/lib/db.ts        client Postgres (pacchetto `postgres`) — unico punto d'accesso
  src/lib/auth.ts      sessione: cookie httpOnly + tabella sessioni, hash password con node:crypto scrypt
  src/lib/calcoli.ts   funzioni pure: totale persone, importo, posti liberi, elenco ristoranti, testo da condividere
  src/lib/schemi.ts    schemi zod condivisi tra form e Server Actions
  src/proxy.ts         redirect a /login senza sessione (proxy.ts è il nome Next 16 del middleware — verificare con Context7)
  db/schema.sql        schema; `npm run db:init` lo applica
  Dockerfile           build `output: "standalone"`, immagine su ghcr come stagetrack
```
- Server Actions validano sempre con zod e controllano sessione/ruolo (non fidarsi del client).
- TanStack Query con persister localStorage: le liste restano leggibili con rete debole; dopo ogni mutazione `invalidateQueries`.
  Mutazioni fallite → toast sonner di errore, il form resta compilato (niente perdita dati).
- Stile: Tailwind v4, palette bianco/grigi + un blu d'accento definito in `@theme`; font di sistema.

## Mie scelte (da controllare)
- Ristoranti e pasti come lista fissa in codice (2 + 2 valori); tabella `ristoranti` solo se ne arrivano altri.
- Tariffe pacchetto (teatro 22 € + ristorante 27 €) nel tariffario di ogni opera, così si possono cambiare per opera.
- Campo telefono aggiunto (presente nel foglio).
- Nessun ORM: driver `postgres` + SQL esplicito; migrazioni = file SQL numerati quando servono.
- Hash password con `node:crypto` scrypt invece di bcrypt (nessuna dipendenza in più).
- Vitest solo per `calcoli.ts` e schemi zod.
- Eliminare locale/opera/evento con prenotazioni collegate è bloccato dal DB (messaggio chiaro).
- **Prezzi congelati**: al salvataggio la prenotazione copia i prezzi dell'opera (colonne `prezzo_*` su `prenotazioni`),
  così cambiare il tariffario non altera l'incasso delle prenotazioni già fatte.
- "Ridotto gruppi" = un prezzo fisso per opera, non dipende dalla dimensione del gruppo.
- Un gruppo diviso tra due ristoranti o pranzo/cena = due prenotazioni.
- Operatori possono modificare/eliminare qualsiasi prenotazione; eliminazione con conferma, definitiva. Niente storico modifiche.
- Produzione: Postgres in un proprio container accanto all'app (docker-compose), volume persistente + `pg_dump` giornaliero;
  esposizione in HTTPS tramite il reverse proxy già usato per stagetrack (HTTPS necessario per Condividi, appunti e
  service worker). Cookie di sessione `Secure` in produzione.

## Wiki (`docs/wiki/`, in italiano, scritta prima del codice)
Stessa impostazione di `biglietteria/docs/wiki`: `README.md` indice + un file per pagina, raggruppati in categorie.
Ogni pagina nasce dal design con stato "da implementare" e viene aggiornata man mano.

| Categoria | Pagine |
|---|---|
| **1. Prodotto** | `01-panoramica.md` (cos'è, per chi, cosa fa e non fa, glossario: locale, opera, evento, prenotazione, pacchetto, omaggio, provenienza) |
| **2. Guida d'uso** | `02-manuale-operatore.md` (inserire/modificare prenotazioni, ricerca, elenco ristoranti, offline) · `03-manuale-admin.md` (locali, opere e tariffario, eventi, utenti) |
| **3. Regole di business** | `04-tariffe-e-incassi.md` (tipi biglietto, pacchetto 22+27, prezzi congelati, formule incassi, esempi) · `05-capienza-e-posti.md` (conteggio persone, avviso oltre capienza, posti testo libero) · `06-ristoranti-e-pacchetti.md` (Giamaica/Casale, pranzo/cena, elenco e condivisione) |
| **4. Tecnica** | `07-architettura.md` (stack con versioni, cartelle, flusso dati, Server Actions vs route API) · `08-database.md` (schema tabelle, vincoli, migrazioni) · `09-autenticazione-e-ruoli.md` (sessioni, cookie, permessi admin/operatore) · `10-offline.md` (coda nuove prenotazioni, idempotenza, service worker) · `11-interfaccia-e-stile.md` (palette bianco/blu, layout mobile/desktop, componenti) |
| **5. Operatività** | `12-sviluppo-e-test.md` (setup locale Postgres senza Docker, comandi, test, checklist browser) · `13-deploy-homelab.md` (Docker, compose, reverse proxy HTTPS, backup) |
| **6. Storia** | `14-decisioni-e-roadmap.md` (scelte fatte, limiti, evoluzioni) · `15-registro-modifiche.md` |

Regola (anche in `CLAUDE.md`): ogni modifica all'app aggiorna nello stesso commit la pagina interessata + il registro modifiche.

## Piano di implementazione (dettaglio con superpowers:writing-plans dopo l'approvazione)
1. `git init`; salvare questo design in `docs/superpowers/specs/2026-10-24-prenota-design.md`; poi **creare la wiki
   prima di qualsiasi codice** (vedi sezione Wiki), commit `docs: wiki iniziale`. Si passa al codice solo dopo
   che l'utente ha riletto la wiki.
2. Scaffold Next.js 16.2.10 + dipendenze con versioni esatte richieste; Tailwind v4; ESLint; Vitest.
3. `db/schema.sql` + `src/lib/db.ts` + script `db:init`, `crea-admin`.
4. Auth: login/logout, sessioni, `proxy.ts`, controllo ruolo.
5. `calcoli.ts` + `schemi.ts` con test (TDD).
6. Admin: locali, opere (tariffario), eventi, utenti.
7. Home eventi + dettaglio evento con riepilogo.
8. Form prenotazione (nuova/modifica/elimina) con avviso capienza.
9. Pagina ristoranti con Condividi/Stampa.
10. TanStack Query + persister, toast, rifinitura mobile.
11. Offline: coda nuove prenotazioni (mutation in pausa + resume), `POST /api/prenotazioni` idempotente, `public/sw.js`.
12. Dockerfile standalone + docker-compose (app + Postgres) + istruzioni deploy homelab; CLAUDE.md/README.
Ogni passo 2–12 aggiorna la pagina wiki corrispondente e il registro modifiche.

## Verifica
- `npm test` (calcoli e schemi), `npm run lint`, `npm run build`.
- Desktop (≥1024px): menu laterale visibile, tabella prenotazioni; mobile: barra in basso, card.
- Totali: 2 pacchetti → incasso teatro +44 €, incasso ristorante +54 €.
- Manuale in browser a larghezza telefono (DevTools 390px): login admin → crea locale (capienza 105), opera con tariffe,
  evento → login operatore → inserisci prenotazioni (incluso gruppo da 35, pacchetti Casale cena, omaggi) →
  verifica totali, avviso oltre capienza, elenco ristorante e Condividi.
- Operatore non può aprire `/admin/*` né chiamare le relative Server Actions.
- Offline: DevTools → Network "Offline" → aggiungi 2 prenotazioni (compaiono "in attesa"), ricarica la pagina (restano),
  torna online → inviate una sola volta ciascuna (controllo in DB); modifica/elimina disabilitati offline.
- `docker build` locale dell'immagine prima del deploy.

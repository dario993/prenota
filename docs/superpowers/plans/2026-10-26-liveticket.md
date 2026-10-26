# LiveTicket Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gli ordini LiveTicket letti da n8n arrivano nell'app, assegnati alle tariffe/pacchetti dell'opera, e compaiono
in un tab dedicato, nel riepilogo (capienza, tariffe, ristoranti divisi Prenotati/LiveTicket), nell'elenco ristoranti
e in Admin → LiveTicket; l'app segnala i possibili doppioni.

**Architecture:** Tabella `liveticket_ordini`; `POST /api/liveticket` (ruolo admin/api) abbina evento e tariffe
all'arrivo e congela i prezzi. Lato client ogni ordine viene convertito in voci a forma di `Prenotazione`
(`vociLiveticket`), così `riepilogoEvento`, `elencoRistorante` e `testoElencoRistorante` si riusano senza duplicare
calcoli. n8n: si corregge la lettura del PDF e si aggiunge un nodo HTTP.

**Tech Stack:** Next.js 16 App Router, React 19, Postgres (`postgres`), zod 4, Vitest, TanStack Query; n8n (MCP).

**Spec:** `docs/superpowers/specs/2026-10-26-liveticket-design.md`

## Global Constraints

- Importi in centesimi; data/ora `Europe/Rome` (server in UTC).
- Migrazioni in `db/migrazioni/`, idempotenti; aggiornare anche `db/schema.sql` (stato finale).
- Ogni route API e Server Action valida con zod e controlla sessione/ruolo.
- Testi, nomi, commit in italiano (`feat: …`, `fix: …`, `docs: …`).
- Logica in moduli TS puri e testati in `src/lib/`; i componenti collegano soltanto.
- Nessuna nuova dipendenza.
- Ogni commit aggiorna la wiki interessata + `docs/wiki/15-registro-modifiche.md`; prima di modificare leggere la
  sezione wiki relativa.
- Prima di ogni commit: `npm test && npm run lint && npm run build`.
- Prima in locale (`.env.local`); produzione e workflow n8n **solo dopo ok esplicito** del committente.
- `COMMISSIONE_LIVETICKET = 150` (centesimi a biglietto), mai conteggiata negli incassi.
- «Incasso teatro previsto» e «Incasso pacchetti previsto» = solo lista Prenota.
- Colori dei contrassegni intoccabili.

## Review Focus

1. Ordine rinviato due volte da n8n (stesso `codice`) → una sola riga, dati aggiornati, nessun doppio conteggio
   (Task 2, test upsert via curl).
2. Ordine per un evento non ancora creato → salvato «senza evento», poi «Riabbina» lo aggancia (Task 2 test
   `abbinaEvento` 0/2 eventi; Task 7 verifica manuale).
3. Ordine con anomalia del parser (conteggio non coincidente) → persone contate, zero pacchetti in elenco ristorante
   (Task 1 test fail-closed; Task 3 test `vociLiveticket`).
4. Telefoni scritti in modi diversi (`+39 347…`, `347 …`, `0039347…`) → riconosciuti come doppione (Task 6 test).
5. Ordine con pacchetti misti (PRANZO CM + CENA GG) → compare in entrambi gli elenchi ristorante con i propri coperti
   (Task 3 test).

---

### Task 1: Tabella e assegnazione biglietti (logica pura)

**Files:**
- Create: `db/migrazioni/007-liveticket.sql`, `src/lib/liveticket.ts`, `src/lib/liveticket.test.ts`
- Modify: `db/schema.sql` (in fondo), `docs/wiki/08-database.md`, `docs/wiki/15-registro-modifiche.md`

**Interfaces:**
- Produces (in `src/lib/liveticket.ts`):
  ```ts
  export const COMMISSIONE_LIVETICKET = 150;
  export interface BigliettoLetto { posto: string; tariffa: string }            // da n8n
  export interface BigliettoLiveticket extends BigliettoLetto {                 // salvato in jsonb
    tariffa_id: string | null; ristorante: Ristorante | null; pasto: Pasto | null; prezzo: number }
  export interface OrdineLiveticket {
    codice: string; cognome_nome: string; telefono: string; spettacolo: string; data_ora: string | null;
    evento_id: string | null; biglietti_dichiarati: number | null; biglietti: BigliettoLiveticket[];
    importo_pagato: number | null; anomalie: string[]; ricevuto_il: string }
  export function pacchettoDaTariffa(t: string): { ristorante: Ristorante; pasto: Pasto } | null;
  export function assegnaBiglietti(a: {
    biglietti: BigliettoLetto[]; tariffe: Tariffa[]; prezzi: PrezziPacchetto;
    importo_pagato: number | null; anomalieLettura: string[] }): { biglietti: BigliettoLiveticket[]; anomalie: string[] };
  ```

- [ ] **Step 1: Migrazione e schema.** `007-liveticket.sql` = la `create table if not exists liveticket_ordini …` e
  l'indice su `evento_id` esattamente come nello spec (sezione Database); stessa definizione in fondo a `schema.sql`.
  Run: `npm run db:init` → nessun errore; ripetuto → nessun errore (idempotente).

- [ ] **Step 2: Test che falliscono** in `liveticket.test.ts` (tariffario CHIARA DI DIO: Intero 2800, Over 65 2200,
  Gruppi 2200, Bambini 1200, Associato 500, Omaggio 0; pacchetto 2200 + 2700):
  - `pacchettoDaTariffa("PRANZO + SPETTACOLO CM")` → `{ristorante:"CASALE", pasto:"PRANZO"}`; `"cena + spettacolo gg"`
    → `{GIAMAICA, CENA}`; `"Intero"` → `null`.
  - Ferro: 2× `Intero`, `importo_pagato` 5900 → due righe `tariffa_id` = Intero, `prezzo` 2800, `anomalie` `[]`.
  - De Dominicis: 3× `Intero` + 2× `Bambini   4 - 12 anni`, pagato 11550 → Bambini abbinato (prezzo 1200), nessuna
    anomalia.
  - Guerra: 2× `PRANZO + SPETTACOLO CM`, pagato 10100 → `tariffa_id` null, CASALE/PRANZO, `prezzo` 4900, nessuna anomalia.
  - `Ridotto` → `tariffa_id` null, `prezzo` 0, anomalia `"Tariffa non presente nell'opera: Ridotto"`.
  - Ferro con pagato 6000 → anomalia `"Importo diverso dal tariffario"`.
  - Prefisso più lungo vince: tariffe `Bambini` e `Bambini piccoli`, biglietto `Bambini piccoli 0-3` → `Bambini piccoli`.
  - Tariffa nascosta abbinata comunque.
  - Fail closed: `anomalieLettura: ["Conteggio non coincidente…"]` con un `PRANZO + SPETTACOLO CM` → ogni riga
    `tariffa_id` null, `ristorante` null, `prezzo` 0; anomalie = quelle di lettura.

- [ ] **Step 3:** Run `npx vitest run src/lib/liveticket.test.ts` → FAIL (modulo assente).

- [ ] **Step 4: Implementare** `pacchettoDaTariffa` (regex dello spec) e `assegnaBiglietti`: confronto nomi con
  maiuscole/spazi normalizzati (`toUpperCase`, spazi multipli → uno), «nome tariffa è prefisso del nome LiveTicket
  seguito da fine o spazio»; controllo importo solo se `importo_pagato` non è null e non ci sono anomalie di lettura:
  `Σ prezzo + COMMISSIONE_LIVETICKET × biglietti.length`.

- [ ] **Step 5:** Run test → PASS. Wiki 08: tabella `liveticket_ordini`. Registro modifiche.

- [ ] **Step 6: Commit** `feat: tabella liveticket_ordini e assegnazione biglietti alle tariffe dell'opera`

---

### Task 2: `POST /api/liveticket`

**Files:**
- Create: `src/app/api/liveticket/route.ts`
- Modify: `src/lib/schemi.ts`, `src/lib/schemi.test.ts`, `src/lib/liveticket.ts` (+test), `docs/wiki/07-architettura.md`, registro

**Interfaces:**
- Consumes: `assegnaBiglietti`, `BigliettoLetto` (Task 1); `utenteCorrente` (`@/lib/auth`).
- Produces:
  ```ts
  // schemi.ts
  export const schemaOrdineLiveticket: z.ZodType<…>; // campi del contratto nello spec
  // liveticket.ts
  export function cognomeNome(nome: string, cognome: string): string; // «FERRO CHIARA»
  export function abbinaEvento(dataOra: string | null, eventi: { id: string; data_ora: string }[]): string | null;
  export async function salvaOrdine(o: z.infer<typeof schemaOrdineLiveticket>): Promise<void>; // in src/lib/liveticket-db.ts
  ```
  `salvaOrdine` sta in `src/lib/liveticket-db.ts` (usa `sql`, non testato a unità) perché la riusa il «Riabbina» del Task 7.

- [ ] **Step 1: Test che falliscono:**
  - `schemaOrdineLiveticket` accetta il JSON d'esempio dello spec (con `nome`/`cognome`); accetta `telefono`,
    `importo_pagato`, `data`, `ora` null/assenti; rifiuta `codice` che non sia `/^lvtckt-\d+$/`; `ora` deve essere `HH:MM`,
    `data` `YYYY-MM-DD`; `biglietti` max 200.
  - `cognomeNome("Chiara", "Ferro")` → `"FERRO CHIARA"`; `cognomeNome("Chiara Ferro", "")` → `"CHIARA FERRO"`.
  - `abbinaEvento`: un evento con stessa ISO → suo id; zero o due eventi → `null`; `dataOra` null → `null`.

- [ ] **Step 2:** Run `npx vitest run src/lib` → FAIL.

- [ ] **Step 3: Implementare** schema, `cognomeNome`, `abbinaEvento` e la route: 401 se ruolo non `admin`/`api`
  (come `api/sql`); 400 con `{ errore }` se zod fallisce; conversione `data`+`ora` Rome → timestamptz in SQL
  (`(${data} || ' ' || ${ora})::timestamp at time zone 'Europe/Rome'`); legge gli eventi a quella data_ora con
  tariffe e prezzi pacchetto dell'opera; `assegnaBiglietti`; `insert … on conflict (codice) do update set …,
  aggiornato_il = now()` (non toccare `ricevuto_il`); risposta `{ ok: true, evento_id }`.

- [ ] **Step 4:** Run test → PASS.

- [ ] **Step 5: Verifica locale** con `npm run dev` e una API key locale (Admin → Utenti): `curl -X POST
  localhost:3000/api/liveticket -H "Authorization: Bearer …"` con l'ordine De Dominicis portato al 01/11/2026 16:30.
  Atteso `{"ok":true,"evento_id":"<uuid>"}`; reinviato → in DB una sola riga (`select count(*) from liveticket_ordini`
  = 1). Senza header → 401. Data 02/11/2026 → `evento_id` null.

- [ ] **Step 6:** Wiki 07 (nuova route), registro. **Commit** `feat: POST /api/liveticket per gli ordini letti da n8n`

---

### Task 3: Ordini nell'API evento e voci per i calcoli

**Files:**
- Modify: `src/app/api/eventi/[id]/route.ts`, `src/lib/calcoli.ts`, `src/lib/calcoli.test.ts`, `src/lib/liveticket.ts`, `src/lib/liveticket.test.ts`

**Interfaces:**
- Consumes: `OrdineLiveticket` (Task 1).
- Produces:
  ```ts
  // calcoli.ts
  interface Prenotazione { …; liveticket?: string }   // codice ordine; solo voci LiveTicket
  interface DettaglioEvento { …; liveticket: OrdineLiveticket[] }
  export const TARIFFA_NON_ABBINATA = "Non abbinata (LiveTicket)";
  // liveticket.ts
  export function vociLiveticket(o: OrdineLiveticket, prezzi: PrezziPacchetto): Prenotazione[];
  ```

- [ ] **Step 1: Test che falliscono** (`vociLiveticket`):
  - Ferro → una voce: `liveticket: "lvtckt-30534501"`, `righe [{tariffa_id: Intero, quantita: 2, prezzo: 2800}]`,
    `pacchetti 0`, `contrassegno` null, `persone(voce)` = 2.
  - Ordine con 1 PRANZO CM e 2 CENA GG → due voci: CASALE/PRANZO `pacchetti 1` e GIAMAICA/CENA `pacchetti 2`
    (le righe tariffa solo nella prima voce).
  - Biglietti non abbinati → riga con `tariffa_id: ""`, `prezzo: 0`.
  - `biglietti_dichiarati` 3 con 2 righe → una riga `""` in più (persone = 3).
  - `riepilogoEvento` con una voce che ha `tariffa_id ""` → `perTariffa` contiene `{ nome: TARIFFA_NON_ABBINATA }`.
  - `elencoRistorante` include le voci LiveTicket; `testoElencoRistorante` su una voce LiveTicket → riga
    `- FERRO CHIARA (2) – +393472300236 – LiveTicket`.

- [ ] **Step 2:** Run → FAIL.

- [ ] **Step 3: Implementare** `vociLiveticket` (prezzi pacchetto della voce = quelli dell'opera, come il server ha
  congelato); in `riepilogoEvento` le righe con `tariffa_id ""` hanno nome `TARIFFA_NON_ABBINATA`; in
  `testoElencoRistorante` suffisso `– LiveTicket` quando `x.liveticket`. Route evento: aggiungere
  `liveticket` = `select … from liveticket_ordini where evento_id = ${id} order by cognome_nome` (`data_ora`,
  `ricevuto_il` in ISO).

- [ ] **Step 4:** Run → PASS. **Commit** `feat: ordini LiveTicket nei dati dell'evento`

---

### Task 4: Riepilogo con LiveTicket

**Files:**
- Modify: `src/app/(app)/eventi/[id]/Riepilogo.tsx`, `PaginaEvento.tsx`, `src/lib/calcoli.ts` (+test), wiki `04-tariffe-e-incassi.md`, `05-capienza-e-posti.md`, `06-ristoranti-e-pacchetti.md`, registro

**Interfaces:**
- Consumes: `vociLiveticket`, `DettaglioEvento.liveticket` (Task 3).
- Produces: `Riepilogo` riceve `liveticket: Prenotazione[]` (voci già convertite) oltre a `prenotazioni`.

- [ ] **Step 1: Test che falliscono** in `calcoli.test.ts` con `riepilogoEvento` chiamato tre volte (lista, LiveTicket,
  unione) e verifica che: persone/posti liberi dell'unione = somma; `incassoTeatro` della sola lista non cambia
  aggiungendo LiveTicket. (Nessuna nuova funzione: il test fissa il modo d'uso.)

- [ ] **Step 2: UI.** `PaginaEvento` calcola `lt = data.liveticket.flatMap(o => vociLiveticket(o, prezzi))` e lo passa.
  In `Riepilogo`: `r` = unione (sala, `perTariffa`, Pacchetti), `rp` = solo lista, `rl` = solo LiveTicket.
  - Sala: numero grande, barra, posti liberi da `r`; righe esistenti + «LiveTicket» = `rl.persone` persone ·
    N ordini (ordini distinti per codice).
  - Biglietti: righe per tariffa e Pacchetti da `r`; «Incasso teatro previsto» = `rp.incassoTeatro`; nuova riga totale
    «Incasso LiveTicket» = `rl.incassoTeatro` (`testId="liveticket"`); pagamenti da `rp`.
  - Ristoranti: per ogni ristorante/pasto con coperti in `r`, riga totale e due righe `sotto` «Prenotati» (`rp`) e
    «LiveTicket» (`rl`); incassi per ristorante e «Incasso pacchetti previsto» da `rp`.

- [ ] **Step 3: Verifica** `npm run dev`, evento 01/11 con l'ordine del Task 2: persone e posti liberi includono i 5
  LiveTicket; Intero +3, Bambini +2; «Incasso teatro previsto» invariato; «Incasso LiveTicket» = 3×28 + 2×12 = 108,00 €.

- [ ] **Step 4:** Wiki 04/05/06, registro. `npm test && npm run lint && npm run build`. **Commit**
  `feat: riepilogo evento con i biglietti LiveTicket`

---

### Task 5: Tab LiveTicket e pagina Ristoranti

**Files:**
- Create: `src/app/(app)/eventi/[id]/ElencoLiveticket.tsx`
- Modify: `PaginaEvento.tsx`, `ristoranti/PaginaRistoranti.tsx`, wiki `02-manuale-operatore.md`, `06-…`, registro

**Interfaces:**
- Consumes: `OrdineLiveticket`, `vociLiveticket`, `descriviBiglietti`, `formattaEuro`.
- Produces: `ElencoLiveticket({ ordini, tariffe, prezzi, doppioni? })` — `doppioni` arriva nel Task 6.

- [ ] **Step 1:** In `PaginaEvento` due tab (`role="tablist"`, pulsanti `aria-selected`) sopra l'elenco:
  «Prenotazioni (N)» e «LiveTicket (N persone)»; scelta ricordata in `?tab=liveticket` (link condivisibile). Il tab
  LiveTicket compare per tutti i ruoli anche se vuoto («Nessun biglietto LiveTicket per questo evento»).
- [ ] **Step 2:** `ElencoLiveticket`: per ordine nome, telefono (link `tel:`), biglietti con `descriviBiglietti` delle
  sue voci, posti, incasso teatro dell'ordine, codice; anomalie in un riquadro `bg-warning-soft` con il testo. Sola
  lettura, stile come `ElencoPrenotazioni` (`stili.ts`), responsive telefono/desktop.
- [ ] **Step 3:** `PaginaRistoranti` passa a `elencoRistorante`/`testoElencoRistorante` le prenotazioni + voci
  LiveTicket; nella scheda la riga LiveTicket mostra l'etichetta «LiveTicket».
- [ ] **Step 4: Verifica** nel browser (telefono e desktop): tab, elenco, pagina Ristoranti con un ordine Guerra
  portato a un evento locale → «Casale – Pranzo» include «… (2) – LiveTicket», «Condividi» copia il testo con il
  suffisso.
- [ ] **Step 5:** Wiki, registro, controlli, **Commit** `feat: tab LiveTicket e pacchetti LiveTicket nell'elenco ristoranti`

---

### Task 6: Possibili doppioni

**Files:**
- Create: `src/lib/doppioni.ts`, `src/lib/doppioni.test.ts`
- Modify: `ElencoPrenotazioni.tsx`, `ElencoLiveticket.tsx`, `Riepilogo.tsx`, `FormPrenotazione.tsx`, wiki `02-…`, registro

**Interfaces:**
- Produces:
  ```ts
  export const normalizzaNome: (s: string) => string;      // maiuscolo, senza accenti, parole ordinate
  export const normalizzaTelefono: (s: string) => string;  // "" se vuoto
  export interface Doppione { id: string; nome: string; liveticket: boolean; motivo: "nome" | "telefono" }
  // chiave = id prenotazione o codice LiveTicket
  export function possibiliDoppioni(voci: Prenotazione[]): Map<string, Doppione[]>;
  ```

- [ ] **Step 1: Test che falliscono:** `normalizzaNome("Rossi  Mario")` = `normalizzaNome("MARIO ROSSI")`;
  `"Nicolò"` = `"NICOLO"`; telefoni `"+39 347 230 0236"`, `"3472300236"`, `"0039347-2300236"` uguali; `"39"` da solo
  non viene accorciato (resta sotto 9 cifre); telefono vuoto non crea doppioni; due voci LiveTicket con stesso nome →
  nessun doppione; prenotazione annullata esclusa; due voci della stessa prenotazione/ordine (pacchetti misti) non
  sono doppioni tra loro; prenotazione + ordine con stesso telefono → entrambi nella mappa, motivo `"telefono"`.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implementare. **Step 4:** Run → PASS.
- [ ] **Step 5: UI:** etichetta «Possibile doppione: <nome>» (+ «· LiveTicket» se l'altro è LiveTicket) nelle righe dei
  due elenchi; riga «Possibili doppioni» in Sala solo se > 0 (conta le voci coinvolte); nel modulo, avviso non
  bloccante sotto nome/telefono quando i valori digitati coincidono con una voce dell'evento diversa da quella in
  modifica (dati dalla cache `chiaveEvento`, quindi anche offline).
- [ ] **Step 6:** Verifica nel browser: nuova prenotazione «Dominicis Vera» → avviso; salvata → etichetta in entrambi i
  tab. Wiki, registro, controlli, **Commit** `feat: avviso di possibile doppione per nome o telefono`

---

### Task 7: Admin → LiveTicket

**Files:**
- Create: `src/app/(app)/admin/liveticket/page.tsx`, `src/app/(app)/admin/liveticket/azioni.ts`
- Modify: `src/app/(app)/admin/page.tsx` (voce `["/admin/liveticket", "LiveTicket", "Ordini online e anomalie", Ticket…]`), wiki `03-manuale-admin.md`, registro, `CLAUDE.md` (mappa del codice + «Cose da non rompere»: ordini LiveTicket fuori dagli incassi Prenota, commissione mai conteggiata)

**Interfaces:**
- Consumes: `salvaOrdine`/logica di abbinamento (Task 2), `OrdineLiveticket`.
- Produces: Server Action `riabbina(): Promise<{ aggiornati: number }>` (`verificaAdmin`), che per gli ordini con
  `evento_id` null o anomalie di tariffa rifà abbinamento evento + `assegnaBiglietti` dai `biglietti` salvati.

- [ ] **Step 1:** Pagina (`richiediAdmin`): tabella di tutti gli ordini ordinati per `data_ora desc`; colonne dello spec;
  evento abbinato come link `/eventi/<id>?tab=liveticket`, altrimenti «Senza evento»; filtri `?filtro=anomalie` e
  `?filtro=senza-evento`; pulsante «Riabbina» (Server Action, toast con il numero aggiornato).
- [ ] **Step 2: Verifica:** ordine del 02/11 (Task 2) appare «Senza evento»; creato l'evento 02/11 16:30 in Admin →
  Riabbina → collegato. Operatore che apre `/admin/liveticket` → rediretto.
- [ ] **Step 3:** Wiki, `CLAUDE.md`, registro, controlli, **Commit** `feat: pagina Admin LiveTicket con riabbinamento`

---

### Task 8: Workflow n8n (solo dopo ok esplicito del committente; produzione)

Prerequisito: Task 1–7 rilasciati in produzione su richiesta del committente; utente «API key» creato in produzione e
chiave salvata come credenziale Header Auth in n8n. **Chiedere conferma prima di ogni modifica al workflow attivo.**

- [ ] **Step 1: Diagnosi.** Prima di correggere, guardare (copia del workflow o versione salvata, ripristinabile con
  la cronologia n8n) cosa arriva al Code node: `Object.keys(item.binary||{})` e `fileName` di ciascun binario.
  Atteso: capire se il binario manca (impostazione `binaryMode`) o ha altro nome/chiave.
- [ ] **Step 2: Correzione** di «Seleziona solo riepilogo PDF» secondo la diagnosi; in `parseOrder` aggiungere
  `nome`, `cognome` (già letti), `telefono` (`Telefono (mobile)`/`Mobile phone`, se presente) e `importo_pagato`
  (`€ X per i biglietti` / `€ X per tickets`, centesimi).
- [ ] **Step 3: Nodo HTTP Request** «Invia a Prenota» da «Classifica pacchetti e anomalie», in parallelo al ramo
  esistente: `POST https://<app>/api/liveticket`, corpo nel formato del contratto (`data`, `ora` da
  `eventDate`/`eventTime`; `anomalie` = `issues`), «On Error: Continue». `validate_workflow` → nessun errore.
- [ ] **Step 4: Prova** con `test_workflow` e pin data della mail Ferro → in produzione compare l'ordine, il foglio
  Google si aggiorna; poi pubblicare.
- [ ] **Step 5: Recupero dal 21/10** con un'esecuzione una tantum che non passa dal ramo Telegram (copia temporanea
  del workflow senza i nodi Telegram, poi archiviata). Verifica: in Admin → LiveTicket ci sono gli ordini arretrati
  (almeno Bertozzi `lvtckt-30515531`, Sacchetti `lvtckt-30513669`, Ferro `lvtckt-30534501`).
- [ ] **Step 6:** Wiki: nuova pagina o sezione «LiveTicket» (flusso n8n → app, cosa fare se un ordine è in anomalia),
  registro; **Commit** `docs: flusso LiveTicket da n8n all'app`

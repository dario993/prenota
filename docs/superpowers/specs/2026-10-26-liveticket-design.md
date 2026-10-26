# LiveTicket nell'app Prenota – design

Data: 2026-10-26. Stato: proposta, da approvare.

## Perché

I biglietti venduti online su LiveTicket oggi vivono fuori dall'app: un workflow n8n legge le mail di conferma e
scrive un foglio Google + avvisi Telegram. Chi gestisce la giornata deve sommare a mano le persone e i pacchetti
ristorante LiveTicket a quelli della lista prenotazioni. Obiettivo: vedere nell'app, per ogni evento, anche i biglietti
LiveTicket, con un riepilogo unico (sala, biglietti, ristoranti) e l'elenco ristorante completo.

## Obiettivi

1. Ogni ordine LiveTicket letto da n8n arriva all'app e viene salvato una sola volta (chiave = codice `lvtckt-…`).
2. Pagina evento: tab **Prenotazioni** (la lista attuale, invariata) e tab **LiveTicket** (gli ordini di quell'evento).
   Il tab LiveTicket lo vedono **tutti** i ruoli, in sola lettura.
3. Riepilogo evento: le persone LiveTicket **contano nella capienza** (barra, posti liberi); compare il **totale
   LiveTicket**; nel riquadro Ristoranti i coperti di ogni ristorante/pasto sono **divisi in «Prenotati» e
   «LiveTicket»** (stesse combinazioni GIAMAICA/CASALE × PRANZO/CENA).
4. Pagina Ristoranti (elenco da condividere/stampare): i pacchetti LiveTicket compaiono, **indicati come LiveTicket**,
   e contano nei coperti.
5. Pagina **Admin → LiveTicket** (solo admin): tutti gli ordini, con anomalie e ordini senza evento in evidenza.
6. Il workflow n8n torna a funzionare (oggi fallisce su ogni mail vera, vedi sotto) e continua a fare quello che fa
   (Google Sheets, Telegram), in più invia gli ordini all'app.
7. Segnalare i **possibili doppioni** (stesso nome o telefono) tra prenotazioni e tra prenotazioni e LiveTicket,
   senza bloccare nulla (vedi sezione dedicata).

## Non obiettivi

- L'app **non** legge la posta: lo fa n8n (scelta del committente, «proposta A»).
- Gli ordini LiveTicket **non** diventano prenotazioni: niente modifica, stato/contrassegno, riordino, cronologia
  (`registraStorico` riguarda solo `prenotazioni`), offline in scrittura.
- **Commissioni** LiveTicket ignorate (decisione del committente): si usa solo l'importo «per i biglietti».
- Annullamenti/rimborsi LiveTicket: non gestiti in questa versione.
- Niente stampa dedicata del tab LiveTicket.

## Anti-obiettivi (sarebbe un fallimento anche se funziona)

- Un ordine contato due volte (mail rielaborata, rinvio da n8n).
- Un ordine con anomalie che sparisce in silenzio o che aggiunge pacchetti sbagliati all'elenco del ristorante.
- La lista prenotazioni attuale che cambia comportamento.

## Situazione attuale del workflow n8n (verificata il 2026-10-26)

Workflow «Teatro pacchetti — 1. Lettura riepiloghi LiveTicket» (id `sITU9Jim9OSDh06Z`, attivo):
IMAP su `info@teatroleoamici.it`, mittente `acquisti-ticket@liveticket.it`, `SINCE 21-Oct-2026`,
`trackLastMessageId`, scarica allegati → Code «Seleziona solo riepilogo PDF» (cerca allegato `lvtckt-<n>.pdf`) →
estrae testo → Code «Classifica pacchetti e anomalie» (`parseOrder`, IT/EN) → «Prepara archivio ordini» →
Google Sheets (append/update per ORDINE) → filtro domenicale → sub-workflow Telegram `TPGACAIQW00fOkft`.

**Problema:** tutte le 28 esecuzioni da trigger dal 21/10 falliscono in «Seleziona solo riepilogo PDF» con
`atteso un solo riepilogo lvtckt-NUMERO.pdf; trovati 0`. Le uniche esecuzioni riuscite sono manuali con i dati di prova:
il parser non ha mai letto una mail vera. Il PDF esiste e ha il nome atteso (verificato su `lvtckt-30534501.pdf`)
e il testo ha il formato atteso dal parser. Causa più probabile: il binario non arriva a `item.binary` nel Code node
(impostazione workflow `binaryMode: "separate"` o simile). **Da diagnosticare come primo passo** con un nodo che elenca
le chiavi/nome file dei binari ricevuti.

Effetto collaterale: con `trackLastMessageId` le mail dal 21/10 potrebbero risultare già «viste». Dopo la correzione
serve un **recupero** degli ordini arretrati (esecuzione una tantum che rilegge da `SINCE 21-Oct-2026`): l'app non
duplica grazie alla chiave sul codice ordine; il foglio Google fa già append/update per ORDINE.

## Contenuto del riepilogo PDF (esempio reale)

```
Codice d'Ordine: lvtckt-30534501 - Conferma di acquisto n. 2 biglietti per CHIARA DI DIO -
25/10/2026 16:30 presso Teatro Leo Amici a Monte Colombo - …
Gentile Chiara Ferro,
 - Platea, Fila P, Posto n. 14 (Platea) - Intero
 - Platea, Fila P, Posto n. 15 (Platea) - Intero
TOTALE PAGATO : € 61,36 (€ 59,00 per i biglietti + € 2,36 per commissioni del servizio/consegna)
Nome : Chiara
Cognome : Ferro
Telefono (mobile) : +393472300236
```

Versione inglese: `Order:`, `Purchase confirmation n. 2 tickets for`, `Dear`, `TOTAL PAID : € 105,04 (€ 101,00 per
tickets + …)`. Tariffe pacchetto: `PRANZO|CENA + SPETTACOLO CM|GG` (CM = CASALE, GG = GIAMAICA).

## Modifiche al workflow n8n

1. Correggere «Seleziona solo riepilogo PDF» dopo la diagnosi (sopra).
2. In `parseOrder` aggiungere: telefono (`Telefono (mobile)` / equivalente inglese, se presente) e importo biglietti
   (`€ X per i biglietti` / `€ X per tickets`) in centesimi. Il resto del parser invariato.
3. Nuovo nodo **HTTP Request** che parte da «Classifica pacchetti e anomalie» **in parallelo** al ramo Google Sheets
   (così l'app riceve tutti gli ordini, anche quelli che il filtro «snapshot» esclude dal foglio):
   `POST <URL app>/api/liveticket`, `Authorization: Bearer <chiave>` (utente ruolo «API key» creato da Admin → Utenti,
   chiave salvata come credenziale Header Auth in n8n). Un errore dell'app non deve bloccare il ramo Sheets/Telegram
   (`continueOnFail`/«On Error: Continue»).
4. Ramo Sheets/Telegram invariato.

## Contratto `POST /api/liveticket`

Accesso: ruolo `admin` o `api` (stesso controllo di `POST /api/sql`), validazione zod. Corpo (un ordine per chiamata):

```json
{
  "codice": "lvtckt-30534501",
  "nome": "Chiara",
  "cognome": "Ferro",
  "telefono": "+393472300236",
  "spettacolo": "CHIARA DI DIO",
  "data": "2026-10-25",
  "ora": "16:30",
  "biglietti_dichiarati": 2,
  "biglietti": [{ "posto": "Platea, Fila P, Posto n. 14", "tariffa": "Intero" }],
  "importo_pagato": 5900,
  "anomalie": [],
  "email_id": "<…@…>",
  "email_data": "24 Oct 2026 12:10:05 +0200"
}
```

- `data`/`ora` sono ora locale `Europe/Rome`; il server le converte in `timestamptz`.
- `telefono`, `importo_pagato`, `data`, `ora` possono mancare/essere null (ordine con anomalie): l'ordine si salva
  comunque, mai scartato.
- Upsert su `codice` (`on conflict (codice) do update`): un rinvio aggiorna, non duplica. Risposta `{ ok: true }`.

## Database

Migrazione `db/migrazioni/007-liveticket.sql` (idempotente) + aggiornamento `db/schema.sql`:

```sql
create table if not exists liveticket_ordini (
  codice text primary key,               -- lvtckt-…
  cognome_nome text not null default '',
  telefono text not null default '',
  spettacolo text not null default '',
  data_ora timestamptz,                  -- null se non letta
  evento_id uuid references eventi (id) on delete set null, -- null = senza evento
  biglietti_dichiarati integer,
  -- una riga per biglietto: {posto, tariffa_lt, tariffa_id|null, ristorante|null, pasto|null, prezzo}
  -- prezzo in centesimi, congelato all'arrivo dal tariffario dell'opera (o pacchetto teatro), senza commissione
  biglietti jsonb not null default '[]',
  importo_pagato integer,                -- «€ X per i biglietti» di LiveTicket, centesimi, solo per controllo
  anomalie text[] not null default '{}',
  email_id text not null default '',
  email_data text not null default '',
  ricevuto_il timestamptz not null default now(),
  aggiornato_il timestamptz not null default now()
);
create index if not exists liveticket_ordini_evento_id_idx on liveticket_ordini (evento_id);
```

**Abbinamento all'evento** (all'arrivo): l'evento con **la stessa `data_ora`** (confronto esatto). Se nessun evento
(o più di uno) corrisponde, `evento_id` resta null: «senza evento», visibile solo in Admin → LiveTicket, dove il
pulsante **«Riabbina»** ripete abbinamento e assegnazione tariffe per gli ordini senza evento o con anomalie di tariffa
(utile se l'evento o la tariffa sono stati creati dopo).

**Assegnazione alle tariffe dell'opera** (decisione del committente: le tariffe LiveTicket sono le stesse dell'opera,
non se ne creano di nuove):
- `PRANZO|CENA + SPETTACOLO CM|GG` → **pacchetto** (CM = CASALE, GG = GIAMAICA) con prezzo
  `prezzo_pacchetto_teatro + prezzo_pacchetto_ristorante` dell'opera, come i pacchetti delle prenotazioni.
- Altrimenti → la tariffa dell'opera (anche nascosta) il cui nome coincide con l'inizio del nome LiveTicket, senza
  distinzione di maiuscole/spazi: «Bambini 4 - 12 anni» → **Bambini**, «Intero» → **Intero**. Se più tariffe
  coincidono vince il nome più lungo.
- Nessuna corrispondenza → anomalia «Tariffa non presente nell'opera: X»; il biglietto conta nelle persone ma non in
  nessuna tariffa né incasso.
- **Commissione LiveTicket: 1,50 € a biglietto**, trattenuta da LiveTicket, mai conteggiata. Controllo:
  `importo_pagato` deve valere Σ(prezzo) + 1,50 € × biglietti; se no, anomalia «Importo diverso dal tariffario»
  (verificato sugli ordini reali Ferro, De Dominicis, Guerra: tornano tutti).

## Logica pura: `src/lib/liveticket.ts` (con test Vitest)

- `assegnaBiglietti(biglietti, tariffe, prezziPacchetto)` → righe con `tariffa_id`/pacchetto/prezzo + anomalie
  (regole sopra). Costante `COMMISSIONE_LIVETICKET = 150`.
- `riepilogoLiveticket(ordini)` → persone, ordini, quantità per `tariffa_id`, pacchetti per ristorante/pasto,
  **incasso teatro LiveTicket** = Σ prezzi delle righe tariffa + `prezzo_pacchetto_teatro` per ogni pacchetto (solo la
  parte teatro). **Persone** = `biglietti_dichiarati` (se null: righe biglietto).
- Ordine con anomalie di lettura (dal parser n8n: conteggio non coincidente, riga non riconosciuta…) → conta nelle
  persone ma non porta pacchetti né tariffe («fail closed», come il parser). Le anomalie di tariffa/importo riguardano
  solo il biglietto interessato.
- Test con i tre ordini reali (Ferro, De Dominicis, Guerra) e il tariffario di CHIARA DI DIO.
- Riutilizzare tipi/costanti esistenti di `calcoli.ts` (`RISTORANTI`, `PASTI`, `NOMI_*`, `formattaEuro`).

## Interfaccia

**API evento** (`GET /api/eventi/[id]`, già usata da pagina evento e Ristoranti, anche offline in lettura): aggiunge
`liveticket: OrdineLiveticket[]` (ordini con `evento_id` = l'evento). Visibile a tutti i ruoli.

**Pagina evento** – due tab sopra l'elenco: «Prenotazioni (N)» e «LiveTicket (N persone)». Il tab Prenotazioni è
l'elenco attuale invariato. Il tab LiveTicket elenca gli ordini: nome, telefono, numero biglietti, posti con tariffa,
pacchetto (ristorante + pasto) se presente, incasso teatro dell'ordine (prezzi app, senza commissione), codice
ordine; ordini con anomalie evidenziati con il testo dell'anomalia. Sola lettura.

**Riepilogo** (`Riepilogo.tsx`):
- *Sala*: persone = prenotazioni valide + LiveTicket; barra e posti liberi di conseguenza. Righe: «Prenotazioni
  attive» (com'è) + nuova «LiveTicket» (persone · ordini).
- *Biglietti*: le righe per tariffa (Intero, Bambini…) e la riga Pacchetti contano **anche** i biglietti LiveTicket.
  «Incasso teatro previsto» resta **solo della lista Prenota** (decisione del committente). Sotto, nuova riga
  **«Incasso LiveTicket»** = incasso teatro LiveTicket (solo biglietti teatro, prezzi app, senza commissione).
- *Ristoranti*: per ogni ristorante/pasto con coperti, il totale e sotto due righe «Prenotati» e «LiveTicket».
  «Incasso pacchetti previsto» resta solo della lista Prenota.

**Pagina Ristoranti** (`elencoRistorante`, `testoElencoRistorante`): gli ordini LiveTicket con quel pacchetto entrano
nell'elenco con il suffisso «– LiveTicket» (anche nel testo condiviso e in stampa); i coperti li includono.
Esempio: `- FERRO CHIARA (2) – 347 2300236 – LiveTicket`.

**Admin → LiveTicket** (`/admin/liveticket`, `richiediAdmin`, voce nel menu Admin): tabella di tutti gli ordini, più
recenti per data evento; colonne codice, nome, data/ora evento, evento abbinato (link) o «senza evento», persone,
pacchetti, importo, anomalie, ricevuto il. Filtri rapidi: «con anomalie», «senza evento».

## Possibili doppioni

Richiesta del committente: di norma chi compra su LiveTicket non viene inserito a mano, ma può capitare; e può capitare
anche un doppione dentro la lista Prenotazioni. L'app **segnala, non blocca** (come la capienza).

- Due voci dello stesso evento sono «possibile doppione» se hanno **stesso nome** oppure **stesso telefono**. Si
  confrontano prenotazioni con prenotazioni e prenotazioni con ordini LiveTicket (tra due ordini LiveTicket no: ogni
  ordine è un acquisto distinto e reale). I biglietti/tariffe non si confrontano.
- Escluse le prenotazioni annullate.
- Nome: maiuscolo, senza accenti e spazi doppi, parole in qualsiasi ordine («ROSSI MARIO» = «Mario Rossi»).
  Telefono: solo cifre, tolto il prefisso `39`/`0039` iniziale se il numero resta di almeno 9 cifre; vuoto = non
  confrontato.
- Funzione pura `possibiliDoppioni(prenotazioni, ordini)` in `src/lib/` con test; restituisce per ogni voce le voci
  con cui coincide e il motivo (nome / telefono).
- Dove si vede:
  - nelle righe di entrambi i tab, un'etichetta «Possibile doppione» con il nome dell'altra voce (e «LiveTicket» se è
    lì);
  - nel riquadro Sala del riepilogo, una riga «Possibili doppioni: N» se N > 0;
  - nel modulo di nuova prenotazione / modifica, un avviso non bloccante quando nome o telefono coincidono con una voce
    già presente nell'evento (dati già in cache nella pagina evento, quindi funziona anche offline).
- Nessuna azione automatica: chi vede l'avviso decide (annulla la prenotazione doppia, o la lascia).

## Vincoli dal progetto

- Importi in centesimi; date `Europe/Rome`.
- Migrazione idempotente in `db/migrazioni/`.
- Ogni route valida con zod e controlla ruolo.
- «Prima in locale, poi in produzione»: in locale l'endpoint si prova con `curl` sui due esempi + l'ordine reale
  sopra; n8n punta all'app di produzione **solo su richiesta esplicita**, dopo la verifica in locale.
- Wiki aggiornata nello stesso commit (nuova sezione LiveTicket, 05 capienza, 06 ristoranti, 08 database,
  03 manuale admin, 15 registro modifiche) e `CLAUDE.md` (mappa del codice / cose da non rompere).
- Nessuna nuova dipendenza.

## Scelte fatte dal progettista (da confermare leggendo)

- Abbinamento evento per data/ora esatta, senza `evento_id` salvato.
- Ordini con anomalie: contano nelle persone, non nei pacchetti; visibili ovunque con l'anomalia.
- Abbinamento tariffa per inizio del nome («Bambini 4 - 12 anni» → Bambini); pulsante «Riabbina» in Admin.
- La quota ristorante dei pacchetti LiveTicket non entra in nessun incasso (né «Incasso pacchetti previsto», né
  «Incasso LiveTicket», che è solo teatro).
- Verificato: gli eventi nel DB locale sono tutti alle 16:30 al Teatro Leo Amici, come negli ordini LiveTicket.
- Nome: n8n invia `nome` e `cognome` separati (dal blocco anagrafico del PDF; se mancano, il nome dopo «Gentile/Dear»
  in `nome`); l'app salva `cognome_nome` = «COGNOME NOME» in maiuscolo, come le prenotazioni.
- Pacchetti: ogni riga biglietto con tariffa pacchetto = un coperto. Un ordine con pacchetti diversi (es. PRANZO CM e
  CENA GG) compare in ciascun elenco ristorante con il proprio numero di coperti.
- Messa in opera: prima l'app (locale, poi produzione su richiesta), poi la correzione del workflow con il nodo HTTP
  già collegato, così nessuna mail viene «vista» senza arrivare all'app. Il recupero dal 21/10 si fa con un'esecuzione
  una tantum che **non** passa dal ramo Telegram.

## Lasciato al costruttore

Struttura componenti dei tab, stile (design system esistente, `stili.ts`), nomi interni, query SQL,
dettagli della diagnosi del binario in n8n.

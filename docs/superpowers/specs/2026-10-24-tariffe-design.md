# Tariffe libere per opera – design

Data: 2026-10-24. Stato: approvato dall'utente (2026-10-24).

## Perché

Oggi i tipi di biglietto sono cinque e fissi (adulto, ridotto gruppi, bambino, pacchetto, omaggio), cablati in
database, calcoli, modulo, riepilogo, elenco e coda offline. Nella realtà ogni spettacolo ha prezzi suoi
(es. CHIARA DI DIO: 28 / 22 / 12 €, «Associato» 5 €) e in certe serate alcune tariffe non servono: l'operatore
non deve vederle mentre prenota.

## Obiettivi

1. **Ogni opera ha il suo tariffario** (decisione dell'utente): da Admin → Opere si aggiungono, modificano ed
   eliminano tariffe (nome + prezzo).
2. **Spunta «Nascosta»** per tariffa: una tariffa nascosta non compare tra i contatori di Nuova prenotazione;
   resta nel database e le prenotazioni che la usano continuano a contare ovunque.
3. Aggiungere **«Associato» a 5,00 €** al tariffario di CHIARA DI DIO.

## Non obiettivi

- Tariffe diverse per singolo evento (la spunta vale per l'opera, quindi per tutti i suoi eventi).
- Ristoranti o pasti configurabili.
- Ricalcolare prezzi di prenotazioni già salvate.

## Anti-obiettivi (sarebbe un fallimento anche se "funziona")

- Perdere o alterare quantità o importi delle prenotazioni esistenti nella conversione.
- Una prenotazione in modifica che perde le quantità di una tariffa nel frattempo nascosta.
- Doppioni o perdite nella coda offline.

## Decisioni prese (con l'utente)

- Tariffario **per opera**.
- **Prezzi congelati** come oggi: la prenotazione salva il prezzo di ogni tariffa al primo inserimento; cambiare il
  tariffario non tocca le prenotazioni salvate.
- **Eliminare** una tariffa già usata da almeno una prenotazione **non è permesso** (messaggio chiaro, es.
  «Impossibile eliminare: tariffa usata da prenotazioni. Puoi nasconderla»).
- **Pacchetto resta speciale**: porta ristorante (Giamaica/Casale) e pasto (pranzo/cena), quota teatro + quota
  ristorante, alimenta coperti ed elenchi ristoranti. Si può **nascondere** (spunta sull'opera) ma non eliminare né
  trasformare in tariffa libera.
- **Omaggio diventa una tariffa normale** a 0 € (rinominabile, nascondibile, eliminabile se mai usata).
- Le prenotazioni nascoste **contano sempre** in persone, capienza, riepilogo e incassi.

## Modello dati (proposta; dettagli SQL al builder)

- Nuova tabella `tariffe`: `id uuid`, `opera_id` (→ opere, `on delete cascade`: un'opera si elimina solo senza
  eventi, quindi senza prenotazioni), `nome text` (1–40 caratteri, unico per opera, senza distinzione
  maiuscole), `prezzo integer` centesimi ≥ 0, `nascosta boolean default false`, `ordine integer` (ordine di
  visualizzazione = ordine di inserimento; riordino manuale non richiesto).
- Nuova tabella `prenotazioni_tariffe`: `prenotazione_id` (→ prenotazioni, `on delete cascade`), `tariffa_id`
  (→ tariffe, `on delete restrict`: è questo vincolo a impedire l'eliminazione di una tariffa usata),
  `quantita integer > 0`, `prezzo integer` congelato; chiave primaria (prenotazione_id, tariffa_id).
  Righe con quantità 0 non si salvano.
- `prenotazioni`: restano `pacchetti`, `ristorante`, `pasto`, `prezzo_pacchetto_teatro`,
  `prezzo_pacchetto_ristorante` e tutti i campi anagrafici; spariscono `adulti`, `ridotti`, `bambini`, `omaggi`,
  `prezzo_adulto`, `prezzo_ridotto`, `prezzo_bambino`. Il check «almeno una persona» non è più esprimibile con
  un CHECK di riga: lo garantisce lo schema zod (server) — sufficiente.
- `opere`: restano le quote del pacchetto; nuova colonna `pacchetto_nascosto boolean default false`;
  spariscono `prezzo_adulto`, `prezzo_ridotto`, `prezzo_bambino`.

## Conversione dei dati esistenti

- Per ogni opera crea, in quest'ordine: «Adulti» (prezzo_adulto), «Ridotti gruppi» (prezzo_ridotto),
  «Bambini» (prezzo_bambino), «Omaggi» (0). Nomi uguali alle etichette attuali del modulo.
- Per ogni prenotazione crea una riga in `prenotazioni_tariffe` per ogni quantità > 0, con il prezzo congelato
  della prenotazione (non quello attuale dell'opera).
- Poi elimina le colonne vecchie.
- Deve girare **da sola all'avvio** (`scripts/db-init.mjs` è eseguito a ogni avvio del container, vedi
  `docker-compose.portainer.yml`), **una sola volta**, **in una transazione**, ed essere **idempotente** (rilanciata
  non fa nulla). È la prima migrazione vera: la wiki 08 prevede file numerati `db/migrazioni/001-....sql`;
  meccanismo (tabella delle migrazioni applicate o controllo sull'esistenza delle colonne) a scelta del builder.
  `db/schema.sql` va aggiornato allo stato finale per i database nuovi.
- Verifica dopo la conversione: per ogni evento persone e incasso teatro identici a prima (test con dati di
  esempio + controllo sul database locale, 47 prenotazioni attuali).
- Poi aggiunge «Associato» 5,00 € a CHIARA DI DIO (dato, non schema: si fa sul database dopo la conversione).

## Dati in produzione (decisione dell'utente: «sia in locale che in produzione»)

I dati locali (locali, opere con tariffario, eventi, 47 prenotazioni con le loro righe tariffa, «Associato»
compreso) devono esistere anche sull'homelab. Percorso:
1. Conversione e «Associato» sul database locale.
2. Deploy della nuova versione sull'homelab: all'avvio `db-init` porta il database di produzione allo schema
   nuovo (se è vuoto o non esiste ancora, crea direttamente lo schema finale; se contiene dati vecchi, li
   converte come in locale).
3. Trasferimento dei **soli dati applicativi** (locali, opere, tariffe, eventi, prenotazioni,
   prenotazioni_tariffe) dal locale alla produzione con uno script ripetibile in `scripts/` (dump solo dati in
   formato schema nuovo + caricamento in una transazione, `on conflict do nothing` sugli id). **Utenti e sessioni
   non si copiano**: in produzione gli utenti si creano da `/primo-accesso`; `creata_da` delle prenotazioni
   copiate va a `null`.
4. Verifica sul database di produzione: stessi conteggi per evento (prenotazioni, persone, incasso teatro).
L'esecuzione sull'homelab (punti 2–4) richiede il via esplicito dell'utente al momento.

## Comportamento per schermata

**Admin → Opere → Nuova/Modifica opera** (pagina a sé, già esistente)
- Titolo; sezione **Tariffe**: una riga per tariffa con nome, prezzo (€ con virgola, come oggi), spunta
  **Nascosta**, pulsante **Elimina**; pulsante **Aggiungi tariffa** che aggiunge una riga vuota.
- Sezione **Pacchetto**: quota teatro, quota ristorante, spunta **Nascosto**; testo che spiega la somma (come oggi).
- Un solo **Salva** per tutto. Nuova opera: parte con le righe Adulti / Ridotti gruppi / Bambini / Omaggi vuote
  (Omaggi a 0,00) e pacchetto 22,00 + 27,00, modificabili.
- Errori: nome vuoto o doppio, importo non valido (con il nome della tariffa nel messaggio, come oggi),
  eliminazione di tariffa usata. In caso di errore nulla viene salvato e i campi restano compilati.
- Almeno una tariffa o il pacchetto deve restare visibile, altrimenti non si può prenotare: errore al salvataggio.
- Elenco opere: sotto il titolo le tariffe con prezzo (le nascoste in grigio con «nascosta»).

**Nuova prenotazione**
- Un contatore per ogni tariffa **visibile** dell'opera, nell'ordine del tariffario, con prezzo sotto (0 € →
  «gratuito», come oggi per gli omaggi); poi Pacchetti se non nascosto. Contatori, digitazione a mano, totali in
  tempo reale e avviso di capienza come oggi.

**Modifica prenotazione**
- Come la nuova, **più** le tariffe nascoste (o il pacchetto nascosto) che la prenotazione già usa, così non si
  perdono quantità. Prezzi mostrati = quelli congelati della prenotazione; una tariffa aggiunta in modifica prende
  il prezzo attuale dell'opera (oggi in modifica i prezzi non cambiano: il builder sceglie se congelare al momento
  della modifica, purché coerente e documentato).

**Pagina evento – riepilogo**
- Al posto delle 5 righe fisse, una riga per tariffa **usata** nell'evento (anche se nascosta), nell'ordine del
  tariffario, poi Pacchetti se > 0. Persone, posti liberi, coperti, incassi come oggi. Su desktop i blocchi restano
  affiancati con le voci in colonne (layout attuale).

**Elenco prenotazioni**
- Oggi la tabella desktop ha una colonna per tipo. Con tariffe libere: una colonna «Biglietti» con testo compatto
  (es. «2 Adulti · 1 Associato · 2 Pacchetti») più la colonna Persone; su telefono la stessa riga di testo nella
  scheda. Ricerca invariata.

**Elenco ristoranti**: invariato (dipende solo dai pacchetti).

**Home / API eventi**: il conteggio persone somma `prenotazioni_tariffe.quantita` + `pacchetti`.

## Offline

- Il dettaglio evento in cache include il tariffario dell'opera (tutte le tariffe, con `nascosta`), così il
  modulo funziona senza rete come oggi.
- Il payload di una nuova prenotazione porta l'elenco `{ tariffa_id, quantita }` + pacchetti; i prezzi li
  congela il server all'arrivo (come oggi). Stesso id UUID, `on conflict do nothing`.
- Una prenotazione in coda che arriva dopo che una sua tariffa è stata eliminata (possibile solo se mai usata
  prima): il server la rifiuta con un messaggio chiaro e resta in rosso da scartare a mano (flusso esistente).
- Code salvate sui telefoni nel vecchio formato: l'app non è ancora in produzione (primo deploy da fare), quindi
  non serve compatibilità; il server rifiuta con errore di validazione.

## Commit

Il lavoro pendente (design system e ritocchi) è già stato salvato e inviato (`67b3a62`): le tariffe partono da
una base pulita, in commit propri.

## Vincoli di progetto (da CLAUDE.md)

Importi in centesimi; logica in `src/lib/` pura e testata (Vitest); ogni route/Server Action valida con zod e
controlla sessione/ruolo (tariffe: solo admin); nessuna nuova dipendenza; testi e nomi in italiano; wiki
aggiornata nello stesso commit (pagine 3, 4, 2, 7, 8, 10, 11 e registro 15); prima del commit
`npm test && npm run lint && npm run build`.

## Lasciato al builder

Meccanismo di migrazione; forma esatta dei tipi TS e dello schema zod; come gestire le righe tariffa nel form
admin (react-hook-form `useFieldArray` è già disponibile tramite react-hook-form, oppure form semplice con
Server Action); dettagli di layout coerenti con il design system (`docs/design-system/`, `src/components/stili.ts`).

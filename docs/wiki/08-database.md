# 8. Database

> Stato: fatto

PostgreSQL. Schema (stato finale) in `db/schema.sql` e migrazioni in `db/migrazioni/`, applicati con `npm run db:init` (anche a ogni avvio del container). Importi in **centesimi** (`integer`).

## Tabelle

### `utenti`
| Colonna | Tipo | Note |
|---|---|---|
| id | uuid PK | |
| nome | text | |
| email | text unique | obbligatoria tranne per il ruolo `api` (vincolo `utenti_email_check`) |
| password_hash | text | scrypt (`node:crypto`) |
| ruolo | text | `admin` \| `operatore` \| `visualizzatore` \| `api` (accesso remoto: in `password_hash` lo sha256 della chiave, `sha256$…`) |
| attivo | boolean | default true |

### `sessioni`
| Colonna | Tipo | Note |
|---|---|---|
| id | text PK | token casuale |
| utente_id | uuid → utenti | on delete cascade |
| scade_il | timestamptz | |

### `locali`
| Colonna | Tipo | Note |
|---|---|---|
| id | uuid PK | |
| nome | text | |
| capienza | integer | `> 0` |

### `opere`
| Colonna | Tipo | Note |
|---|---|---|
| id | uuid PK | |
| titolo | text | |
| prezzo_pacchetto_teatro | integer | default 2200 |
| prezzo_pacchetto_ristorante | integer | default 2700 |
| pacchetto_nascosto | boolean | default false: il pacchetto non compare nel modulo di prenotazione |

### `tariffe`
Tariffario libero di ogni opera (il pacchetto resta sull'opera).
| Colonna | Tipo | Note |
|---|---|---|
| id | uuid PK | |
| opera_id | uuid → opere | on delete cascade |
| nome | text | unico per opera senza distinzione di maiuscole (`tariffe_opera_nome_idx`) |
| prezzo | integer | centesimi, `>= 0` (0 = gratuito, es. Omaggi) |
| nascosta | boolean | non compare tra i contatori di una nuova prenotazione |
| ordine | integer | ordine di visualizzazione |

### `eventi`
| Colonna | Tipo | Note |
|---|---|---|
| id | uuid PK | |
| opera_id | uuid → opere | on delete restrict |
| locale_id | uuid → locali | on delete restrict |
| data_ora | timestamptz | |

### `prenotazioni`
| Colonna | Tipo | Note |
|---|---|---|
| id | uuid PK | generato dal **client** (idempotenza offline) |
| evento_id | uuid → eventi | on delete restrict |
| cognome_nome | text | obbligatorio |
| telefono | text | |
| pacchetti | integer | `>= 0` |
| ristorante | text | `GIAMAICA` \| `CASALE` \| null |
| pasto | text | `PRANZO` \| `CENA` \| null |
| posti, provenienza, note | text | |
| ordine | integer | posizione scelta con «Riordina»; null = in fondo, per `creata_il` |
| contrassegno | text | null (nessuno stato, all'inserimento) \| `prenotato` \| `stampato` \| `modificato` \| `annullato` |
| pagamento | text | null (nessuna scelta) \| `da_pagare` \| `bonifico`; si sceglie solo nel dettaglio della prenotazione |
| prezzo_pacchetto_teatro, prezzo_pacchetto_ristorante | integer | copiati dall'opera al primo salvataggio |
| creata_da | uuid → utenti | |
| creata_il, aggiornata_il | timestamptz | |

### `prenotazioni_storico`
Cronologia di ogni prenotazione (on delete cascade). Una riga a ogni creazione (`POST /api/prenotazioni`), modifica e
cambio di stato.
| Colonna | Tipo | Note |
|---|---|---|
| id | bigint identity PK | |
| prenotazione_id | uuid → prenotazioni | indicizzata |
| utente_id | uuid → utenti | chi ha fatto l'azione |
| il | timestamptz | `now()` |
| azione | text | `creata` \| `modificata` \| `stato` |
| contrassegno | text | stato della prenotazione dopo l'azione (null = nessuno) |
| dati | jsonb | copia della prenotazione dopo l'azione (campi, quote pacchetto, righe tariffa con prezzi), scritta da `src/lib/storico.ts`; null per le voci ricostruite da 004 |

### `prenotazioni_tariffe`
Quantità per tariffa di ogni prenotazione. PK (`prenotazione_id`, `tariffa_id`).
| Colonna | Tipo | Note |
|---|---|---|
| prenotazione_id | uuid → prenotazioni | on delete cascade |
| tariffa_id | uuid → tariffe | on delete **restrict**: una tariffa usata non si elimina (si nasconde) |
| quantita | integer | `> 0` (le righe a 0 non si salvano) |
| prezzo | integer | congelato: prezzo della tariffa al primo salvataggio della riga |

### `liveticket_ordini`
Ordini LiveTicket ricevuti da n8n (un'email = un ordine). PK `codice` (`lvtckt-…`), indice su `evento_id`.
| Colonna | Tipo | Note |
|---|---|---|
| codice | text PK | |
| cognome_nome, telefono, spettacolo | text | |
| data_ora | timestamptz | null se non letta |
| evento_id | uuid → eventi | on delete set null; null = senza evento |
| biglietti_dichiarati | integer | persone dell'ordine = max(dichiarati, biglietti letti) |
| biglietti | jsonb | una riga per biglietto: `posto`, `tariffa` (LiveTicket), `tariffa_id`, `ristorante`, `pasto`, `prezzo` (centesimi congelati, senza commissione); assegnate da `assegnaBiglietti` in `src/lib/liveticket.ts` |
| importo_pagato | integer | «€ X per i biglietti» di LiveTicket, solo per controllo (Σ prezzi + 1,50 € a biglietto) |
| anomalie | text[] | |
| email_id, email_data | text | |
| ricevuto_il, aggiornato_il | timestamptz | |

## Vincoli

- `check ((pacchetti > 0) = (ristorante is not null and pasto is not null))` e ristorante/pasto entrambi null se
  pacchetti = 0.
- Almeno una persona per prenotazione (somma delle quantità + pacchetti `> 0`): lo garantisce la validazione zod
  sul server, non più un check di riga.
- Eliminare locale, opera o evento con righe collegate fallisce (`restrict`): l'app mostra un messaggio chiaro.
- Indice su `prenotazioni(evento_id)` ed `eventi(data_ora)`.

## Migrazioni

`db/schema.sql` descrive lo stato finale (database nuovi). Le modifiche a database esistenti stanno in file numerati
`db/migrazioni/NNN-....sql`: `scripts/db-init.mjs` li esegue in ordine alfabetico, ciascuno in una transazione,
**a ogni avvio**. Per questo ogni migrazione deve essere **idempotente** (controlla lo stato e non fa nulla se già
applicata).

- `001-tariffe.sql`: dai tipi fissi (adulti, ridotti, bambini, omaggi) al tariffario per opera. Crea per ogni opera
  Adulti, Ridotti gruppi, Bambini (prezzi dell'opera) e Omaggi (0 €), copia le quantità di ogni prenotazione in
  `prenotazioni_tariffe` con i suoi prezzi congelati, poi elimina le colonne vecchie. Si attiva solo se esiste ancora
  `prenotazioni.adulti`.
- `002-utenti-api.sql`: aggiunge il ruolo `api` al vincolo su `utenti.ruolo` (che elenca anche `visualizzatore`), rende `email` facoltativa per i soli utenti `api` ed
  elimina la tabella `chiavi_api` della prima versione delle chiavi. Riapplicarla non cambia nulla.
- `003-ordine-contrassegno.sql`: aggiunge `prenotazioni.ordine` e `prenotazioni.contrassegno` (facoltativo, senza default).
- `004-storico.sql`: aggiunge `prenotazioni_storico.dati` se manca; per le prenotazioni senza cronologia crea la voce «creata» da `creata_il` / `creata_da` (senza copia).
- `005-pagamento.sql`: aggiunge `prenotazioni.pagamento` (facoltativo, senza default).
- `006-visualizzatore.sql`: aggiunge il ruolo `visualizzatore` al vincolo su `utenti.ruolo`.
- `007-liveticket.sql`: crea `liveticket_ordini` e l'indice su `evento_id` (`if not exists`).

## Backup

Vedi [Deploy homelab](13-deploy-homelab.md).

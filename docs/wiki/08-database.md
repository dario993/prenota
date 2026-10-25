# 8. Database

> Stato: fatto

PostgreSQL. Schema (stato finale) in `db/schema.sql` e migrazioni in `db/migrazioni/`, applicati con `npm run db:init` (anche a ogni avvio del container). Importi in **centesimi** (`integer`).

## Tabelle

### `utenti`
| Colonna | Tipo | Note |
|---|---|---|
| id | uuid PK | |
| nome | text | |
| email | text unique | minuscole |
| password_hash | text | scrypt (`node:crypto`) |
| ruolo | text | `admin` \| `operatore` |
| attivo | boolean | default true |

### `sessioni`
| Colonna | Tipo | Note |
|---|---|---|
| id | text PK | token casuale |
| utente_id | uuid → utenti | on delete cascade |
| scade_il | timestamptz | |

### `chiavi_api`
| Colonna | Tipo | Note |
|---|---|---|
| id | uuid PK | |
| nome | text | etichetta scelta dall'admin |
| hash | text unique | sha256 della chiave; la chiave in chiaro non si salva |
| utente_id | uuid → utenti | admin che l'ha creata, on delete cascade |
| creata_il / usata_il | timestamptz | `usata_il` aggiornata a ogni richiesta |

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
| prezzo_pacchetto_teatro, prezzo_pacchetto_ristorante | integer | copiati dall'opera al primo salvataggio |
| creata_da | uuid → utenti | |
| creata_il, aggiornata_il | timestamptz | |

### `prenotazioni_tariffe`
Quantità per tariffa di ogni prenotazione. PK (`prenotazione_id`, `tariffa_id`).
| Colonna | Tipo | Note |
|---|---|---|
| prenotazione_id | uuid → prenotazioni | on delete cascade |
| tariffa_id | uuid → tariffe | on delete **restrict**: una tariffa usata non si elimina (si nasconde) |
| quantita | integer | `> 0` (le righe a 0 non si salvano) |
| prezzo | integer | congelato: prezzo della tariffa al primo salvataggio della riga |

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

## Backup

Vedi [Deploy homelab](13-deploy-homelab.md).

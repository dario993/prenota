# 8. Database

> Stato: fatto

PostgreSQL. Schema in `db/schema.sql`, applicato con `npm run db:init`. Importi in **centesimi** (`integer`).

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
| prezzo_adulto, prezzo_ridotto, prezzo_bambino | integer | `>= 0` |
| prezzo_pacchetto_teatro | integer | default 2200 |
| prezzo_pacchetto_ristorante | integer | default 2700 |

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
| adulti, ridotti, bambini, pacchetti, omaggi | integer | `>= 0`, somma `> 0` |
| ristorante | text | `GIAMAICA` \| `CASALE` \| null |
| pasto | text | `PRANZO` \| `CENA` \| null |
| posti, provenienza, note | text | |
| prezzo_adulto … prezzo_pacchetto_ristorante | integer | copiati dall'opera al primo salvataggio |
| creata_da | uuid → utenti | |
| creata_il, aggiornata_il | timestamptz | |

## Vincoli

- `check ((pacchetti > 0) = (ristorante is not null and pasto is not null))` e ristorante/pasto entrambi null se
  pacchetti = 0.
- `check (adulti + ridotti + bambini + pacchetti + omaggi > 0)`.
- Eliminare locale, opera o evento con righe collegate fallisce (`restrict`): l'app mostra un messaggio chiaro.
- Indice su `prenotazioni(evento_id)` ed `eventi(data_ora)`.

## Migrazioni

All'inizio basta `db/schema.sql`. Dalla prima modifica a un database in produzione: file numerati
`db/migrazioni/001-....sql`, applicati in ordine.

## Backup

Vedi [Deploy homelab](13-deploy-homelab.md).

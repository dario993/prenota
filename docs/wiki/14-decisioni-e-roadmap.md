# 14. Decisioni e roadmap

## Decisioni dell'utente

- Web app mobile-first, ottimizzata anche per desktop (menu laterale).
- Stack: Next.js 16.2.10, React 19.2.3, Tailwind v4, TanStack Query 5 + persister, react-hook-form + zod 4,
  lucide-react, sonner, clsx.
- Un solo progetto Next.js, Postgres, login con sessione; sviluppo locale senza Docker, deploy Docker sull'homelab.
- Grafica minimal bianca con accento blu.
- Posti prenotati in testo libero.
- Capienza: avvisa ma lascia salvare.
- Pacchetto 49 € = 22 € teatro + 27 € ristorante, entrambe modificabili; incassi teatro e ristorante separati.
- Quantità per tariffa: tariffario libero per opera (nome, prezzo, spunta «nascosta»), più i pacchetti.
- Campo provenienza del contatto.
- Elenco per ristorante da condividere dal telefono.
- Offline: solo aggiunta di nuove prenotazioni.
- Wiki scritta prima del codice.

## Scelte tecniche fatte in autonomia (da rivedere se serve)

| Scelta | Motivo | Quando cambiarla |
|---|---|---|
| Ristoranti e pasti fissi nel codice | sono due e non cambiano | se arrivano altri ristoranti → tabella `ristoranti` |
| Tariffe pacchetto per opera | flessibilità senza complicazioni | – |
| Prezzi congelati sulla prenotazione | cambiare il tariffario non altera incassi passati | – |
| Ridotto gruppi a prezzo fisso | così nel foglio | se il prezzo dipende dalla grandezza del gruppo |
| Gruppo diviso = più prenotazioni | modello semplice | se capita spesso |
| Driver `postgres`, nessun ORM | meno dipendenze, SQL chiaro | se lo schema cresce molto |
| scrypt di `node:crypto` | nessuna dipendenza in più | – |
| Eliminazione definitiva, nessuno storico | semplicità | se servono audit o annullamento |
| Telefono aggiunto | presente nel foglio | – |
| Sessione fissa di 30 giorni dal login, senza rinnovo | semplice e prevedibile | se serve una scadenza per inattività |
| Data/ora evento: `::text::timestamp at time zone 'Europe/Rome'` in SQL | l'orario inserito resta lo stesso con il server in UTC | – |
| Esci bloccato finché ci sono prenotazioni in coda; poi svuota i dati locali | niente perdita silenziosa, niente dati di un utente sul telefono di un altro | – |
| Sessione scaduta con coda piena: login nella stessa scheda | la coda e il form restano; dopo il login l'invio riparte | – |
| Errori 5xx riprovati ogni 30 s; errori 4xx → «non inviata» con Scarta | il server giù passa da solo, un rifiuto richiede una decisione | se servono tentativi limitati o notifiche |
| Vitest 3 e `@hookform/resolvers` 5 | compatibili con npm 10 e con i vincoli di peer dependency di zod 4 / Node 20 | aggiornare quando si passa a Node 22 in locale |
| Immagine su `node:22-alpine`, locale su Node 20 | l'immagine è libera dal vincolo locale; gli script sono `.mjs` e girano su entrambi | allineare le versioni |
| Nessun sistema di migrazioni: `schema.sql` idempotente | un solo schema, pochi utenti | alla prima modifica dello schema in produzione |

## Limiti noti

- Offline: niente modifica/eliminazione; l'avviso capienza offline conta la coda del telefono ma non le prenotazioni fatte nel frattempo da altri.
- Nessun controllo di sovrapposizione dei posti.
- Gli incassi sono previsti, non registrati.
- Il `docker build` non è stato eseguito durante lo sviluppo (Docker assente sul computer di sviluppo): primo build da verificare sull'homelab.

## Roadmap (non pianificata)

- Import del Google Sheet esistente.
- Collegamento alla piantina di `biglietteria` per la scelta dei posti.
- Esportazione CSV/PDF di un evento.

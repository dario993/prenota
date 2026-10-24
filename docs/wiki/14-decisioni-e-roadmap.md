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
- Quantità separate per adulti, ridotti gruppi, bambini, pacchetti, omaggi.
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

## Limiti noti

- Offline: niente modifica/eliminazione; l'avviso capienza offline può essere impreciso.
- Nessun controllo di sovrapposizione dei posti.
- Gli incassi sono previsti, non registrati.

## Roadmap (non pianificata)

- Import del Google Sheet esistente.
- Collegamento alla piantina di `biglietteria` per la scelta dei posti.
- Stato di pagamento sulle prenotazioni.
- Esportazione CSV/PDF di un evento.

# 1. Panoramica

> Stato: fatto

## Cos'è

**Prenota** è una web app per raccogliere le prenotazioni degli spettacoli teatrali. Sostituisce il Google Sheet
usato finora, dove ogni blocco era una data/spettacolo ("10 ottobre · DOCUFILM · 105") con le colonne
NOME, INT, RID, NOTE, TELEFONO, POSTI PREN.

## Per chi è

Solo lo **staff interno** (nessuna prenotazione pubblica). Più persone, ognuna con il proprio accesso:

- **admin** – gestisce locali, opere, eventi e utenti, oltre alle prenotazioni;
- **operatore** – inserisce, modifica ed elimina prenotazioni.

Si usa soprattutto dal **telefono**, ma è ottimizzata anche per il **desktop**.

## Cosa fa

- Gestisce **locali** (con capienza), **opere** (titolo e tariffario) ed **eventi** (data e ora di una rappresentazione).
- Per ogni evento raccoglie le **prenotazioni**: cognome e nome, telefono, quantità per ogni tariffa dell'opera
  (es. adulti, ridotti gruppi, bambini, omaggi, associato) e pacchetti, posti, provenienza del contatto, note.
- Gestisce i **pacchetti ristorante** (Giamaica o Casale, pranzo o cena).
- Mostra per ogni evento persone prenotate, posti liberi, **incasso teatro** e **incasso pacchetti ristorante**.
- Prepara l'**elenco per ciascun ristorante**, da condividere (WhatsApp, email…) o stampare.
- Permette di **aggiungere** prenotazioni anche **senza rete**: partono da sole quando la rete torna.

## Cosa non fa

- Prenotazioni fatte direttamente dagli spettatori.
- Piantina della sala / scelta delle sedie (i posti si scrivono a mano, es. `K1-4`).
- Pagamenti, incasso effettivo, stampa biglietti.
- Import automatico dal Google Sheet.
- App nativa per iOS/Android (è una web app).

## Glossario

| Termine | Significato |
|---|---|
| **Locale** | Il luogo dello spettacolo, con una capienza (numero massimo di persone). Ospita più eventi. |
| **Opera** | Lo spettacolo (titolo) con il suo tariffario. |
| **Evento** | Una rappresentazione: un'opera in un locale in una data e ora. Un evento ha una sola opera. |
| **Prenotazione** | Una richiesta per un evento a nome di una persona o gruppo, con le quantità per tariffa. |
| **Tariffa** | Tipo di biglietto con nome e prezzo (es. Adulti, Ridotti gruppi, Associato), definito nel tariffario di ogni opera; si può nascondere. |
| **Pacchetto** | Biglietto + pasto in un ristorante adiacente: 49 € a persona (22 € teatro + 27 € ristorante). |
| **Omaggi** | Tariffa a 0 € (es. "Invito"): occupa un posto ma non incassa. |
| **Provenienza** | Da dove arriva il contatto: clienti, Facebook, manifesti, ecc. |
| **In attesa di invio** | Prenotazione inserita senza rete, salvata sul telefono, non ancora arrivata al server. |

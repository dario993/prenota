# Prenota – descrizione delle schermate

Documento per chi deve progettare l'interfaccia da zero. Descrive **cosa** c'è in ogni schermata (contenuti, azioni,
stati, messaggi), non **come** appare: colori, font, icone, stile e componenti grafici sono liberi.

## Contesto

Web app interna per lo staff di un teatro che raccoglie le prenotazioni degli spettacoli. Nessun accesso pubblico.
Si usa soprattutto dal **telefono** (spesso in piedi, con una mano, mentre si parla al telefono con il cliente), ma deve
funzionare bene anche su **desktop**. Lingua dell'interfaccia: italiano. Importi in euro con la virgola (`49,00 €`),
date e ore in ora italiana (es. "sab 10 ottobre 2026, 21:00").

**Ruoli**

- **Operatore**: vede eventi e prenotazioni; crea, modifica, elimina prenotazioni; usa l'elenco ristoranti.
- **Admin**: tutto quello che fa l'operatore + gestione di locali, opere, eventi e utenti.

**Concetti**

| Termine | Significato |
|---|---|
| Locale | Il luogo dello spettacolo, con una capienza (es. 105 persone). |
| Opera | Lo spettacolo (titolo) con il suo tariffario. |
| Evento | Un'opera in un locale in una data e ora. |
| Prenotazione | Richiesta per un evento a nome di una persona o gruppo, con le quantità per tipo di biglietto. |
| Tipi di biglietto | Adulto, Ridotto gruppi, Bambino, Pacchetto (biglietto + pasto al ristorante), Omaggio (0 €). Tutti occupano un posto. |
| Pacchetto ristorante | Ristorante **Giamaica** o **Casale**, pasto **pranzo** o **cena**. Prezzo = quota teatro + quota ristorante (default 22 + 27 = 49 €). |
| In attesa di invio | Prenotazione inserita senza rete, salvata sul telefono, non ancora arrivata al server. |

**Regole che l'interfaccia deve rendere evidenti**

- La capienza **avvisa, non blocca**: si può sempre salvare anche oltre la capienza, ma va segnalato chiaramente
  (posti liberi negativi, avviso).
- Senza rete si possono **solo aggiungere** prenotazioni; modifica ed eliminazione richiedono la rete.
- Le conferme e gli errori delle azioni compaiono come **messaggi temporanei** non bloccanti; gli errori di un campo
  compaiono sotto il campo stesso, senza perdere quanto già scritto.

## Struttura e navigazione

Due schermate fuori dall'app (Login, Primo accesso) e poi l'app con una navigazione principale sempre visibile:

- Voci: **Eventi** (home) e, solo per l'admin, **Admin**; azione **Esci**.
- Telefono: navigazione raggiungibile con il pollice (es. in basso), che rispetti le aree sicure degli iPhone.
- Desktop: navigazione persistente laterale o equivalente.
- Sulla voce **Eventi** un **contatore** indica quante prenotazioni sono in attesa di invio; diventa di tipo
  "errore" se qualcuna è stata rifiutata dal server.

Mappa:

```
/primo-accesso          (solo con database vuoto)
/login
/                       Prossimi eventi (home)
/eventi/:id             Pagina evento
/eventi/:id/prenotazioni/nuova
/eventi/:id/prenotazioni/:pid      Modifica prenotazione
/eventi/:id/ristoranti  Elenco ristoranti
/admin                  Menu admin
/admin/locali
/admin/opere
/admin/eventi
/admin/utenti
```

---

## 1. Primo accesso

Compare solo alla prima apertura, quando non esiste ancora nessun utente (tutte le altre pagine portano qui).

- Titolo e breve spiegazione: "Crea il primo amministratore".
- Campi: **Nome**, **Email**, **Password** (almeno 8 caratteri), **Conferma password**.
- Pulsante **Crea e accedi** → entra direttamente nell'app.
- Errori: campi mancanti, email non valida, password troppo corta, password diverse.

## 2. Login

- Nome dell'app, campi **Email** e **Password**, pulsante **Accedi**.
- Errore unico per credenziali sbagliate o utente disattivato: "Email o password errati".
- Il pulsante si disattiva durante l'invio.

## 3. Prossimi eventi (home)

Elenco degli eventi da oggi in poi, dal più vicino.

- Ogni evento è una **scheda** toccabile con: titolo dell'opera, data e ora, locale, indicatore di riempimento
  `persone / capienza` (es. "87 / 105") che segnala visivamente quando si supera la capienza.
- In cima, solo se presenti, il riquadro **Prenotazioni non inviate** (vedi "Stati offline").
- In fondo una sezione **Eventi passati**, chiusa di default: aprendola si caricano gli eventi passati, dal più recente,
  con le stesse schede.
- Stati: caricamento; "Nessun evento in programma"; senza rete resta visibile l'ultimo elenco caricato; se il
  dispositivo non ha mai caricato i dati: "Serve la rete per caricare i dati la prima volta".

## 4. Pagina evento

Intestazione: opera, data e ora, locale. Azioni: **Nuova prenotazione** (azione principale, sempre a portata di
pollice su telefono) e link **Ristoranti**.

**Riepilogo** (su telefono sopra l'elenco, su desktop affiancato):

- Persone prenotate e **posti liberi** (capienza − persone; se negativo va evidenziato come superamento).
- Quantità per tipo: adulti, ridotti, bambini, pacchetti, omaggi.
- Coperti per ristorante e pasto (Giamaica pranzo/cena, Casale pranzo/cena).
- **Incasso teatro**, **incasso pacchetti ristorante** (totale e per ristorante). Sono importi previsti.

**Elenco prenotazioni**, in ordine alfabetico, con un **campo di ricerca** per nome o numero di telefono.

- Telefono: una scheda per prenotazione con nome, telefono, quantità compatte in sigla (es. "A2 R1 B1 P2 Casale cena O1")
  e totale persone.
- Desktop: tabella con colonne nome, telefono (cliccabile per chiamare), adulti, ridotti, bambini, pacchetti,
  ristorante/pasto, omaggi, posti, note, totale persone.
- Toccare una prenotazione apre la modifica.
- Le prenotazioni in attesa di invio compaiono nell'elenco con l'etichetta **"in attesa di invio"** e contano già nel
  riepilogo; quelle rifiutate con l'etichetta **"non inviata"** e il motivo.
- Stati: elenco vuoto ("Nessuna prenotazione"), nessun risultato di ricerca, "Evento non trovato", "Serve la rete per
  caricare i dati la prima volta".

## 5. Nuova prenotazione

Tutto in **una sola schermata**, pensata per essere compilata al telefono mentre si parla con il cliente.

1. **Cognome Nome** (obbligatorio; può essere un gruppo, es. "Gruppo Sicilia").
2. **Telefono** (facoltativo, tastiera telefonica).
3. **Quantità**: Adulti, Ridotti gruppi, Bambini, Pacchetti, Omaggi. Ognuna con pulsanti − / + **e** numero scrivibile
   a mano (per gruppi grandi, es. 35). Interi da 0 a 10000, vuoto = 0, toccando il campo il valore si seleziona per
   essere sostituito. Almeno una quantità > 0. Mostrare accanto il prezzo unitario è utile.
4. Solo se **Pacchetti > 0** compare la sezione ristorante: scelta **Giamaica / Casale** e **Pranzo / Cena**,
   entrambe obbligatorie (scelte a pulsanti, non menu a tendina).
5. **Posti prenotati**: testo libero (es. `K1-4, L5`).
6. **Provenienza**: testo libero con suggerimenti tra i valori già usati (clienti, Facebook, manifesti…).
7. **Note**: testo libero (es. "1 carrozzina").

**Riepilogo in tempo reale**, sempre visibile (es. fisso in fondo su telefono): totale persone, importo teatro,
importo ristorante, totale. Se l'evento supererebbe la capienza compare un avviso evidente
"Supera la capienza di N posti" che **non** impedisce di salvare.

Pulsante **Salva**: disattivato durante l'invio; esito "Prenotazione inviata: Rossi Mario" e ritorno alla pagina evento.
Errori sotto i campi: nome mancante, nessuna persona, ristorante o pasto non scelti. Azione secondaria **Annulla**.

## 6. Modifica prenotazione

Stesso modulo della nuova prenotazione, già compilato, con in più:

- Gli importi usano le tariffe salvate al momento della creazione (non quelle attuali): può essere utile dirlo.
- Portando i pacchetti a 0, ristorante e pasto vengono tolti.
- Pulsante **Elimina** (azione distruttiva, separata da Salva) con conferma "Eliminare la prenotazione di …?".
- Senza rete: Salva ed Elimina disattivati con la scritta "Serve la rete".
- Stato "Prenotazione non trovata".

## 7. Elenco ristoranti

Raggiunto dalla pagina evento; link per tornare all'evento. Serve a mandare a ciascun ristorante la lista dei coperti.

- Una sezione per ogni combinazione con coperti (Giamaica pranzo, Giamaica cena, Casale pranzo, Casale cena); quelle
  vuote non compaiono.
- Ogni sezione: ristorante, pasto, data, opera, totale coperti, righe in ordine alfabetico con nome, numero coperti,
  telefono e note (se presenti).
- Per ogni sezione un pulsante **Condividi** (menu di condivisione del telefono: WhatsApp, email…; su desktop copia il
  testo negli appunti con conferma "Copiato").
- Pulsante **Stampa** per l'intera pagina; la versione stampata è solo testo, senza navigazione né pulsanti.
- Stato vuoto: "Nessun pacchetto ristorante per questo evento".

Esempio del testo condiviso:

```
CASALE – CENA – sab 10 ottobre 2026
Opera: DOCUFILM
Coperti: 12

- Gruppo Sicilia (10)
- ROSSI MARIO (2) – 333 1234567 – 1 celiaco
```

## 8. Admin (menu)

Solo admin. Elenco di accessi a: **Locali**, **Opere**, **Eventi**, **Utenti**. Ordine consigliato per un nuovo
spettacolo: locale → opera → evento (può essere suggerito). Un operatore che apre una pagina admin torna alla home.

Le quattro pagine admin seguono lo stesso schema: **modulo** per creare/modificare in alto e **elenco** sotto. Su ogni
riga dell'elenco **Modifica** (ricarica il modulo con i dati, con possibilità di annullare) ed **Elimina** (con
conferma). Esito come messaggio temporaneo; in caso di errore i campi restano compilati.

### 8a. Locali

- Campi: **Nome**, **Capienza** (intero > 0).
- Elenco: nome e capienza.
- Errore eliminazione: "Impossibile eliminare: ci sono eventi collegati".

### 8b. Opere

- Campi: **Titolo**; tariffario in euro: **Adulto**, **Ridotto gruppi**, **Bambino**, **Pacchetto – quota teatro**
  (precompilato 22,00), **Pacchetto – quota ristorante** (precompilato 27,00). Mostrare il prezzo del pacchetto come
  somma delle due quote.
- Gli importi accettano virgola o punto; errore "Importo non valido: Bambino" (nome del campo sbagliato).
- Avviso utile: cambiare il tariffario non modifica le prenotazioni già salvate.
- Elenco: titolo, tariffe, pacchetto totale.
- Errore eliminazione: "Impossibile eliminare: ci sono eventi collegati".

### 8c. Eventi

- Campi: **Opera** (scelta tra le opere), **Locale** (scelta tra i locali), **Data e ora**.
- Elenco ordinato per data, compresi gli eventi passati (distinguibili): opera, locale, data e ora; il titolo apre la
  pagina dell'evento.
- Errore eliminazione: "Impossibile eliminare: ci sono prenotazioni".

### 8d. Utenti

- Campi: **Nome**, **Email**, **Password** (obbligatoria alla creazione, almeno 8 caratteri; in modifica facoltativa:
  vuota = invariata), **Ruolo** (admin / operatore).
- Elenco: nome, email, ruolo, stato (attivo / disattivato). Azioni: Modifica, **Disattiva** / **Attiva** (al posto
  di Elimina).
- Errori: "Email già in uso"; non si può disattivare né declassare sé stessi (azioni non disponibili sulla propria riga).

---

## Stati offline (trasversali)

L'app funziona anche con rete assente o instabile. Elementi da progettare:

- **Avviso globale** in cima alle pagine quando ci sono prenotazioni in attesa: "Salvate sul telefono, verranno inviate
  quando torna la rete".
- **Contatore** sulla voce Eventi (vedi navigazione).
- **Etichetta "in attesa di invio"** sulle prenotazioni non ancora inviate.
- **Prenotazioni non inviate** (rifiutate dal server, es. evento cancellato): riquadro di tipo errore in cima alla home
  e riga "non inviata" con il motivo nella pagina evento. Mostrano i dati (nome, quantità, telefono, posti, note) per
  poterli copiare e un pulsante **Scarta**. Non spariscono da sole.
- Messaggi temporanei: "Prenotazione inviata: …" (invio riuscito al ritorno della rete); "Invio non riuscito, riprovo
  automaticamente"; "Serve la rete per modificare una prenotazione" (toccando una prenotazione senza rete).
- **Sessione scaduta** con prenotazioni in attesa: "Accedi di nuovo per inviare le prenotazioni in attesa" con
  pulsante **Accedi**.
- **Esci** con prenotazioni in attesa viene bloccato: "Ci sono N prenotazioni non ancora inviate: torna online e
  attendi l'invio prima di uscire".

## Requisiti generali

- Mobile-first; layout adattato su desktop (tabelle e colonne affiancate dove c'è spazio).
- Elementi toccabili alti almeno 44 px; tastiere giuste (numerica per quantità, telefonica per il telefono).
- Etichette su tutti i campi, contrasto sufficiente, focus visibile, pulsanti solo icona con etichetta accessibile.
- Le azioni distruttive (Elimina, Scarta, Disattiva) sono distinguibili e chiedono conferma.
- Stile di stampa per l'elenco ristoranti.

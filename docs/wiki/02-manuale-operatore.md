# 2. Manuale operatore

> Stato: fatto

## Accesso

Apri l'app, inserisci email e password ricevute dall'admin. La sessione resta attiva finché non fai *Esci*
o finché scade (vedi [Autenticazione e ruoli](09-autenticazione-e-ruoli.md)).

## Navigazione

- **Telefono**: barra in basso con *Eventi* (e *Admin* se sei admin).
- **Desktop**: le stesse voci in un menu laterale fisso a sinistra.

## Prossimi eventi

La pagina iniziale mostra gli eventi futuri, dal più vicino. Ogni scheda indica opera, data e ora, locale e una barra
`persone / capienza`. Tocca una scheda per aprire l'evento. Se non ci sono eventi futuri compare "Nessun evento in programma". Senza rete
resta visibile l'ultimo elenco caricato.

## Pagina evento

- **Riepilogo** in alto (su desktop affiancato all'elenco): persone prenotate, posti liberi, quantità per tipo,
  coperti per ristorante e pasto, incasso teatro, incasso pacchetti ristorante (totale e per ristorante).
- **Elenco prenotazioni** in ordine alfabetico, con campo di **ricerca** per nome.
  Telefono: una scheda per prenotazione, con le quantità in sigla (A adulti, R ridotti, B bambini, P pacchetti con
  ristorante e pasto, O omaggi). Desktop: tabella (nome, quantità, ristorante, posti, note, totale persone).
  Tocca una prenotazione per aprirla. I posti liberi diventano rossi se superi la capienza (la prenotazione non viene bloccata).
- Pulsante **+** per una nuova prenotazione; link **Ristoranti** per gli elenchi da inviare.
- Se l'evento non esiste compare "Evento non trovato".

## Nuova prenotazione

Tutto in una schermata:

1. **Cognome Nome** (obbligatorio) – anche un nome di gruppo, es. "Gruppo Sicilia".
2. **Telefono** (facoltativo).
3. **Quantità** con pulsanti − / +: adulti, ridotti gruppi, bambini, pacchetti, omaggi. Almeno una deve essere > 0.
4. Se **pacchetti > 0** compare la sezione ristorante: scegli **Giamaica** o **Casale**, poi **pranzo** o **cena**
   (entrambi obbligatori).
5. **Posti prenotati** – testo libero, es. `K1-4, L5`.
6. **Provenienza** – scrivi o scegli tra i valori già usati (clienti, Facebook, manifesti…).
7. **Note** – es. "1 carrozzina", "sedere vicino al sindaco".

In fondo vedi in tempo reale **totale persone** e **importo** (teatro, ristorante e totale), calcolato con le tariffe
attuali dell'opera. Se l'evento supera la capienza compare un **avviso rosso** "Supera la capienza di N posti":
puoi comunque salvare.

Premi **Salva**: compare "Prenotazione inviata: …" e torni alla pagina evento. Il pulsante si disattiva durante l'invio;
anche toccandolo due volte la prenotazione viene registrata una sola volta. Se qualcosa non va (nome mancante, nessuna
persona, ristorante o pasto non scelti) il messaggio compare sotto il campo e nulla viene perso.

Un gruppo che va in due ristoranti diversi, o in parte a pranzo e in parte a cena, si inserisce come **due prenotazioni**.

## Modificare o eliminare

Tocca una prenotazione per aprirla, cambia i campi e salva. Gli importi restano quelli delle tariffe in vigore quando
la prenotazione è stata creata, anche se nel frattempo l'admin ha cambiato il tariffario. Se porti i pacchetti a 0,
ristorante e pasto vengono tolti. **Elimina** chiede conferma ("Eliminare la prenotazione di …?") ed è definitivo.
Modifica ed eliminazione richiedono la rete. Se la prenotazione non esiste più compare "Prenotazione non trovata".

## Elenco ristoranti

Dalla pagina evento → **Ristoranti**: un elenco per Giamaica e uno per Casale, divisi in pranzo e cena, con nome,
telefono, coperti e note. **Condividi** apre il menu del telefono (WhatsApp, email…); su desktop il testo viene copiato
negli appunti. **Stampa** apre la stampa del browser. Vedi [Ristoranti e pacchetti](06-ristoranti-e-pacchetti.md).

## Senza rete

- Puoi **solo aggiungere** prenotazioni. Premendo **Salva** torni subito alla pagina evento: la prenotazione è salvata
  sul telefono, compare in elenco con l'etichetta gialla **"in attesa di invio"** e conta già nel riepilogo (con le
  tariffe attuali dell'opera). In cima alla pagina un avviso ricorda "Salvate sul telefono, verranno inviate quando
  torna la rete"; un numero sull'icona **Eventi** del menu indica quante sono in attesa.
- Per aprire **Nuova prenotazione** senza rete devi aver aperto quell'evento almeno una volta con la rete.
- Quando la rete torna vengono inviate da sole (compare "Prenotazione inviata: …"), anche se nel frattempo hai chiuso
  l'app o spento il telefono: basta riaprirla. Non vengono mai inviate due volte.
- Modifica ed eliminazione richiedono la rete: senza rete toccando una prenotazione compare "Serve la rete per
  modificare una prenotazione"; se eri già nella pagina di modifica, i pulsanti sono disattivati con la scritta
  "Serve la rete".
- Se la rete c'è ma l'invio non riesce (rete debole, server momentaneamente in errore) compare "Invio non riuscito,
  riprovo automaticamente": la prenotazione resta "in attesa di invio" e l'app riprova ogni 30 secondi.
- **Sessione scaduta**: compare "Accedi di nuovo per inviare le prenotazioni in attesa" con il pulsante **Accedi**, che
  porta al login. Dopo il login le prenotazioni in attesa partono da sole.
- **Esci** non funziona finché ci sono prenotazioni non inviate: compare "Ci sono N prenotazioni non ancora inviate:
  torna online e attendi l'invio prima di uscire". Uscendo, l'app cancella dal telefono tutti i dati salvati.
- **Invio rifiutato** (per esempio l'evento è stato cancellato nel frattempo): la prenotazione diventa rossa,
  **"non inviata"**, con il motivo, e compare anche in cima alla home in **Prenotazioni non inviate**; il numero sul
  menu diventa rosso. Non sparisce mai da sola, nemmeno chiudendo l'app: copia i dati se servono (nome, quantità,
  telefono, posti, note), poi premi **Scarta**.

Dettagli tecnici: [Offline](10-offline.md).

# 2. Manuale operatore

> Stato: fatto

## Accesso

Apri l'app, inserisci email e password ricevute dall'admin. La sessione resta attiva finché non fai *Esci*
o finché scade (vedi [Autenticazione e ruoli](09-autenticazione-e-ruoli.md)).

## Navigazione

- **Telefono**: barra in basso con *Eventi* (e *Admin* se sei admin).
- **Desktop**: le stesse voci in un menu laterale fisso a sinistra.
- **Tema scuro / Tema chiaro** (nel menu laterale su desktop, nella pagina **Admin** su telefono) cambia i colori con un tocco; la scelta resta sul dispositivo.

## Eventi

La pagina iniziale si apre con una frase sul prossimo evento (giorno, ora, persone, posti rimasti) e mostra, nella
scheda **In programma**, gli eventi da oggi in poi, dal più vicino. Ogni riga indica la data come un biglietto (giorno,
mese, ora), opera, locale, numero di prenotazioni, `persone / capienza` con la barra e, a destra in grande, i posti occupati (le annullate non
contano). Su desktop a destra c'è il riquadro del prossimo evento, con la barra della capienza e le persone per tariffa. Tocca una riga per aprire l'evento. Se non ci sono eventi futuri compare "Nessun evento in programma". Senza rete
resta visibile l'ultimo elenco caricato; se il telefono non ha mai caricato i dati compare "Serve la rete per caricare
i dati la prima volta" (lo stesso nella pagina evento).

La scheda **Passati** carica, quando la apri, gli eventi prima di oggi, dal più recente, con
le stesse righe. Tocca una scheda per rivedere riepilogo e prenotazioni di un evento già fatto.

## Pagina evento

- **Riepilogo** sempre in alto, sopra l'elenco, in tre riquadri: **Sala** (persone su capienza, posti liberi, la barra
  della capienza, prenotazioni attive, senza stato, annullate), **Biglietti** (quantità per tariffa
  con il prezzo, solo quelle usate anche se nel frattempo nascoste, pacchetti, incasso teatro previsto; sotto, solo se scelti in almeno una prenotazione, **Da pagare** e **Bonifico**
  con il numero di prenotazioni e il loro totale teatro + ristorante, annullate escluse) e **Ristoranti**
  (coperti per ristorante e pasto, incasso pacchetti per ristorante e totale).
- **Due tab** sopra l'elenco: «Prenotazioni (N)» e «LiveTicket (N persone)» (la scelta resta nel link, `?tab=liveticket`). Il tab LiveTicket è in sola lettura, per tutti i ruoli: per ogni ordine nome, telefono, biglietti, posti, incasso teatro e codice; gli ordini con anomalie hanno un riquadro giallo con il motivo.
- **Possibile doppione**: due voci dello stesso evento con lo stesso nome (maiuscole, accenti e ordine delle parole non contano) o lo stesso telefono (senza prefisso 39/0039) sono segnalate con «Possibile doppione: nome» (+ «· LiveTicket») in entrambi i tab, con «Possibili doppioni» nel riquadro Sala e con un avviso sotto nome/telefono nel modulo. Si confrontano prenotazioni con prenotazioni e prenotazioni con ordini LiveTicket (non due ordini tra loro); le annullate sono escluse; anche le prenotazioni in coda sul telefono. Si segnala soltanto: decide chi legge (logica in `src/lib/doppioni.ts`).
- **Elenco prenotazioni** nell'ordine in cui sono state inserite (le nuove in fondo), con campo di **ricerca** per nome o numero di telefono.
  Ogni riga ha un **numero progressivo** (resta lo stesso anche filtrando con la ricerca).
  **Riordina**: su ogni prenotazione compare la maniglia ⋮⋮, in testa subito dopo il numero: tienila premuta (dito o
  mouse) e trascina la riga dove vuoi, le altre si scostano per farle posto (sul telefono, finché sei in Riordina, la
  scheda non si apre al tocco); vicino al bordo dello schermo l'elenco scorre da solo. Ci sono anche le
  frecce ↑ ↓ per spostare di un posto (utili da tastiera). L'ordine è salvato per tutti (serve la rete, e la ricerca
  vuota). Le prenotazioni aggiunte dopo vanno in fondo.
  **Stato** colorato di ogni prenotazione, scelto dal menu sulla riga: appena inserita non ha stato (nessun colore);
  poi **Stampato** (verde), **Prenotato** (giallo), **Modificato** (arancio), **Annullato** (rosso, non conta più nel
  riepilogo né negli elenchi per i ristoranti) oppure di nuovo «Nessuno stato». Il colore è la tacca a sinistra della
  riga (staccata dai bordi, le righe vicine non si toccano) e il pallino accanto alla parola.
  **Stampa** (in testa alla pagina, solo su desktop): apre la stampa del browser con la sola tabella (numero, nome, telefono, biglietti, posti, note,
  stato, persone), impaginata A4 con l'intestazione ripetuta su ogni pagina; per il PDF scegli «Salva come PDF». Stampa
  ciò che è in elenco: svuota la ricerca per averlo tutto.
  Telefono: una scheda per prenotazione, con i biglietti in una riga (es. «2 Adulti · 1 Associato · 2 Pacchetti Casale
  cena») e il telefono del cliente. Desktop: tabella (numero, nome, telefono cliccabile per chiamare, biglietti, posti, note,
  stato, totale persone).
  Tocca una prenotazione per aprirla. Se superi la capienza i posti liberi diventano negativi (es. `−6`), evidenziati con la scritta "oltre capienza" (la prenotazione non viene bloccata).
- Aprendo una prenotazione, nel riquadro «Posti e note» c'è **Pagamento** a segmenti (come Ristorante e Pasto), **Da pagare** e **Bonifico**,
  con la spunta sulla scelta: se ne mette una sola o nessuna (si toglie toccandola di nuovo), e vale con «Salva modifiche». Solo nel dettaglio, non
  nella nuova prenotazione né nell'elenco.
- Aprendo una prenotazione, sotto il modulo c'è la **Cronologia**: ogni creazione, modifica e cambio di stato con
  data e ora, utente, stato e campi cambiati, dalla più recente. Toccando una voce si vede la prenotazione com'era
  dopo quell'azione (nome, telefono, biglietti, persone, totale, posti, provenienza, note, stato, pagamento), con il valore
  precedente barrato accanto ai campi cambiati. Le prenotazioni inserite prima della cronologia hanno solo la voce
  «Creata», senza dati.
- Pulsanti in testa: **Ristoranti** per gli elenchi da inviare, **Stampa** e **Nuova prenotazione** (su telefono **Nuova** è nella barra fissa in alto, accanto al titolo).
- Se l'evento non esiste compare "Evento non trovato".

## Nuova prenotazione

L'evento che stai prenotando resta sempre visibile: su telefono nella barra fissa in alto (titolo e giorno, con
**Annulla**), su desktop nel riepilogo a destra che resta fermo mentre scorri; vale anche per la modifica. Sotto il
titolo: in una nuova i posti che restano, in modifica lo stato attuale.

Tutto in una schermata, in tre riquadri (**Cliente**, **Biglietti**, **Posti e note**):

1. **Cognome Nome** (obbligatorio) – anche un nome di gruppo, es. "Gruppo Sicilia".
2. **Telefono** (facoltativo).
3. **Quantità** con pulsanti − / + oppure scrivendo il numero nel campo (comodo per i gruppi, es. 35): un contatore
   per ogni tariffa **visibile** dell'opera (es. Adulti, Ridotti gruppi, Omaggi, Associato), nell'ordine del
   tariffario, con il prezzo sotto, poi **Pacchetti** (se l'admin non l'ha nascosto). In **modifica** compaiono anche
   le tariffe nascoste che la prenotazione usa già, con il loro prezzo salvato. Toccando il campo il numero si seleziona e si sostituisce; campo vuoto = 0,
   solo numeri interi da 0 a 10000. Almeno una deve essere > 0. I totali si aggiornano mentre scrivi.
4. Se **pacchetti > 0** compare la sezione ristorante: scegli **Giamaica** o **Casale**, poi **pranzo** o **cena**
   (entrambi obbligatori).
5. **Posti prenotati** – testo libero, es. `K1-4, L5`.
6. **Provenienza** – scrivi o scegli tra i valori già usati (clienti, Facebook, manifesti…).
7. **Note** – es. "1 carrozzina", "sedere vicino al sindaco".

Ogni riga dei biglietti mostra anche il suo importo. Il **riepilogo** (a destra su desktop largo, sotto i riquadri
altrimenti) è come un biglietto: evento, nome del cliente, righe quantità × prezzo, teatro, ristorante, **totale** e
persone, e la **capienza** con la barra di riempimento (già prenotati più questa prenotazione) e i posti liberi dopo
questa. **Salva** e **Annulla** sono sotto il riepilogo; su telefono una barra fissa in basso (sopra il menu) mostra
persone, totale e **Salva**. Gli importi sono calcolati con le tariffe
attuali dell'opera. Se l'evento supera la capienza compare un **avviso** "Supera la capienza di N posti":
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
  sul telefono, compare in elenco con l'etichetta **"in attesa di invio"** e conta già nel riepilogo (con le
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
  menu cambia colore (rosso). Non sparisce mai da sola, nemmeno chiudendo l'app: copia i dati se servono (nome, quantità,
  telefono, posti, note), poi premi **Scarta**.

Dettagli tecnici: [Offline](10-offline.md).

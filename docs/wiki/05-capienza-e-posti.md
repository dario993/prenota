# 5. Capienza e posti

> Stato: fatto

## Capienza

- Ogni **locale** ha una capienza; ogni **evento** usa la capienza del suo locale.
- **Persone prenotate** dell'evento = somma delle persone di tutte le prenotazioni (omaggi e pacchetti inclusi).
- **Posti liberi** = capienza − persone prenotate (può diventare negativo).

## Oltre la capienza: avvisa, non blocca

Se salvando una prenotazione l'evento supererebbe la capienza:

- il form mostra un **avviso** (colore di avvertimento) "Supera la capienza di N posti" (in modifica la prenotazione stessa non viene
  contata due volte); il conto include, come il riepilogo dell'evento, le prenotazioni salvate sul telefono e ancora
  in attesa di invio (non quelle rifiutate);
- si può **salvare comunque** (sedie aggiunte, liste d'attesa, ecc.);
- la scheda evento e il riepilogo mostrano la barra e le cifre in colore di avvertimento, la scritta "oltre capienza" e i posti liberi negativi (`−6`).

Il server **non** rifiuta mai una prenotazione per la capienza. Senza rete l'avviso usa i dati in cache più la coda del
telefono, che potrebbero non includere prenotazioni appena fatte da altri.

## Posti prenotati

Campo di **testo libero** sulla prenotazione, es. `K1-4`, `fila 3 centrali`. L'app non controlla sovrapposizioni
e non ha una piantina (vedi [Decisioni e roadmap](14-decisioni-e-roadmap.md)).

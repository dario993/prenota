# 2. Manuale operatore

> Stato: accesso, navigazione, Prossimi eventi e Pagina evento fatti; il resto da implementare

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

In fondo vedi in tempo reale **totale persone** e **importo** (teatro + ristorante). Se l'evento supera la capienza
compare un **avviso rosso**: puoi comunque salvare.

Un gruppo che va in due ristoranti diversi, o in parte a pranzo e in parte a cena, si inserisce come **due prenotazioni**.

## Modificare o eliminare

Tocca una prenotazione per aprirla, cambia i campi e salva. **Elimina** chiede conferma ed è definitivo.
Modifica ed eliminazione richiedono la rete.

## Elenco ristoranti

Dalla pagina evento → **Ristoranti**: un elenco per Giamaica e uno per Casale, divisi in pranzo e cena, con nome,
telefono, coperti e note. **Condividi** apre il menu del telefono (WhatsApp, email…); su desktop il testo viene copiato
negli appunti. **Stampa** apre la stampa del browser. Vedi [Ristoranti e pacchetti](06-ristoranti-e-pacchetti.md).

## Senza rete

- Puoi **solo aggiungere** prenotazioni: vengono salvate sul telefono e compaiono con l'etichetta
  **"in attesa di invio"**; un contatore nel menu indica quante sono.
- Quando la rete torna vengono inviate da sole, anche se nel frattempo hai chiuso l'app.
- Modifica ed eliminazione sono disattivate finché non torna la rete.
- Se la sessione è scaduta ti viene chiesto di rifare il login; le prenotazioni in attesa partono subito dopo.

Dettagli tecnici: [Offline](10-offline.md).

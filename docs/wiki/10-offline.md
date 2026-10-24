# 10. Offline

> Stato: da implementare

Regola: **senza rete si possono solo aggiungere prenotazioni**. Modifica ed eliminazione richiedono la rete.

## Lettura senza rete

TanStack Query salva la cache in localStorage (persister): eventi e prenotazioni già visti restano consultabili.

## Coda delle nuove prenotazioni

1. Il form crea la prenotazione con un **id UUID generato sul telefono** (`crypto.randomUUID()`).
2. L'invio è una mutation TanStack Query con `mutationKey: ["nuova-prenotazione"]` e `mutationFn` registrata con
   `setMutationDefaults` (necessario perché possa ripartire dopo che l'app è stata chiusa).
3. Senza rete la mutation resta **in pausa**; il persister la salva in localStorage insieme alla cache.
4. La prenotazione compare subito nell'elenco dell'evento con l'etichetta **"in attesa di invio"**; un contatore nel
   menu mostra quante sono in attesa.
5. Al ritorno della rete, o alla riapertura dell'app, `resumePausedMutations()` invia le prenotazioni in coda.
6. `POST /api/prenotazioni` fa `insert ... on conflict (id) do nothing`: se lo stesso invio arriva due volte non nascono
   doppioni.

## Errori durante l'invio

- **Sessione scaduta (401)**: la prenotazione resta in coda, l'app chiede di rifare il login, poi la invia.
- **Dati non validi (400)**: improbabile (stessa validazione zod sul telefono), ma la prenotazione resta visibile
  con un errore per poterla copiare a mano; non viene mai scartata in silenzio.

## Riaprire l'app senza rete: service worker

`public/sw.js`, scritto a mano, senza librerie:

- **pagine e asset**: prima la rete; se manca, la copia già salvata in cache;
- le route `/api/*` non vengono messe in cache dal service worker (ci pensa TanStack Query).

Funziona solo in HTTPS (o su `localhost` in sviluppo).

## Modifica / eliminazione

I pulsanti sono disattivati quando `navigator.onLine` è falso, con la scritta "serve la rete".

## Come provarlo

Vedi la checklist in [Sviluppo e test](12-sviluppo-e-test.md#offline).

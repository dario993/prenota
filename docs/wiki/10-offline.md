# 10. Offline

> Stato: fatto

Regola: **senza rete si possono solo aggiungere prenotazioni**. Modifica ed eliminazione richiedono la rete.
Nulla deve andare perso in silenzio e nulla deve arrivare due volte.

## Lettura senza rete

TanStack Query salva la cache in localStorage (persister, chiave `prenota-cache`): eventi e prenotazioni già visti
restano consultabili. Il ripristino non scade mai (`maxAge: Infinity`): un telefono rimasto spento per giorni non
perde le prenotazioni in coda. Cambiare il `buster` in `src/app/providers.tsx` cancella tutta la cache, **coda
compresa**: non va cambiato con prenotazioni in attesa.

## Coda delle nuove prenotazioni

Tutto in `src/lib/query.ts`:

| Nome | Cosa fa |
|---|---|
| `CHIAVE_NUOVA` | `["nuova-prenotazione"]`, chiave della mutation di invio |
| `registraMutazioni(qc)` | `setMutationDefaults`: funzione di invio, tentativi, toast e aggiornamento dell'elenco. Sta qui e non nel form perché dopo un riavvio dell'app vale solo ciò che è registrato sul client |
| `riprendiCoda(qc)` | alla riapertura (`onSuccess` del provider) fa ripartire tutte le mutation in coda |
| `inviaPrenotazione(d)` | `POST /api/prenotazioni`; lancia `ErroreRete` se la richiesta non parte, `ErroreSessione` su 401 |
| `useInAttesa(eventoId?)` | prenotazioni in coda (`stato: "pending"`) o rifiutate (`stato: "error"`, con `errore`), con `mutationId` |
| `useOnline()` | `true`/`false` secondo l'`onlineManager` di TanStack |

1. Il form crea la prenotazione con un **id UUID generato sul telefono** (`crypto.randomUUID()`).
2. L'invio è la mutation `CHIAVE_NUOVA`. Senza rete (`networkMode` predefinito `"online"`) resta **in pausa**, e il form
   torna subito alla pagina evento senza aspettare (una mutation in pausa non chiama né `onSuccess` né `onError`).
   Lo stesso succede se il primo tentativo fallisce con la rete accesa: la prenotazione resta in coda e riprova da sola.
3. Il persister salva in localStorage le mutation **pending** (in pausa o a metà invio) e quelle **in errore**, non
   solo quelle in pausa come farebbe TanStack: un invio interrotto chiudendo l'app riparte alla riapertura.
   Il salvataggio è immediato (`throttleTime: 0`): senza rete Next ricarica la pagina dalla cache e la scrittura
   deve essere già avvenuta.
4. `onlineManager.setOnline(navigator.onLine)` all'avvio: TanStack altrimenti crede di essere online finché non arriva
   un evento `offline`, e un'app aperta senza rete brucerebbe i tentativi.
5. La pagina evento unisce `useInAttesa(id)` alle prenotazioni del server (escludendo gli id già arrivati), con le
   **tariffe attuali** dell'opera: etichetta gialla **"in attesa di invio"**, non apribili, contate nel riepilogo.
   In cima un avviso "Salvate sul telefono, verranno inviate quando torna la rete". Il menu mostra il numero totale
   in attesa sull'icona Eventi (rosso se ce n'è almeno una rifiutata).
6. Al ritorno della rete TanStack chiama `resumePausedMutations()`; alla riapertura dell'app `riprendiCoda`.
   A invio riuscito: toast "Prenotazione inviata: …" e rilettura di evento, elenco eventi e provenienze; la
   prenotazione resta "in attesa" finché l'elenco aggiornato non la contiene, così non sparisce per un attimo.
7. `POST /api/prenotazioni` fa `insert ... on conflict (id) do nothing`: se lo stesso invio arriva due volte (doppio
   tocco, due schede aperte, invio ripetuto dopo un riavvio) nel database c'è una sola riga.

Le mutation della coda hanno `gcTime: Infinity`: una prenotazione rifiutata non viene tolta dalla memoria dopo 5 minuti.

## Errori durante l'invio

| Caso | Tentativi | Cosa vede l'operatore |
|---|---|---|
| Rete che "c'è ma non va" (`ErroreRete`) | senza fine, ogni 30 s | resta "in attesa di invio" |
| Sessione scaduta (401, `ErroreSessione`) | senza fine, ogni 30 s | toast "Accedi di nuovo per inviare le prenotazioni in attesa" con pulsante **Accedi** che apre `/login` in una **nuova scheda** (la scheda con la coda resta aperta e riprova); dopo il login parte da sola |
| Altri errori (400 dati non validi, 404 evento cancellato, 500) | 3, poi stop | toast "Prenotazione di … non inviata: motivo"; in elenco etichetta rossa **"non inviata"** con il motivo e pulsante **Scarta** (con conferma) |

Una prenotazione rifiutata **non sparisce mai da sola**, nemmeno chiudendo l'app: resta finché l'operatore non la
scarta (`mutationCache.remove`). Siccome il suo evento potrebbe non esistere più, le rifiutate compaiono anche in
home nel riquadro **Prenotazioni non inviate**. Non contano nel riepilogo (sul server non ci sono).

## Riaprire l'app senza rete: service worker

`public/sw.js`, scritto a mano, senza librerie; registrato da `src/components/RegistraSW.tsx` (in `layout.tsx`) solo in
produzione (`npm run build && npm start`): in sviluppo servirebbe file vecchi.

- `install` → `skipWaiting`; `activate` → elimina le cache con nome diverso da `prenota-v1` e `clients.claim`.
- Solo richieste **GET** della stessa origine. Esclusi `/api/*` (ci pensa TanStack Query) e le richieste RSC della
  navigazione interna di Next (intestazione `RSC`, chiavi sempre diverse).
- **Rete prima**: se risponde 200 la copia va in cache; se la rete manca si usa la copia salvata, e per una pagina mai
  vista la home (`/`). Redirect (es. verso il login) e errori non vengono salvati, quindi login e logout con la rete
  funzionano sempre dal server.
- Senza rete la navigazione interna di Next fallisce e Next ripiega su una navigazione normale, che il service worker
  serve dalla cache.
- La pagina evento, quando c'è rete, scarica in sottofondo `/eventi/{id}/prenotazioni/nuova` perché finisca in cache:
  così **Nuova prenotazione** si apre anche senza rete per ogni evento già visto.
- Senza rete, toccare una prenotazione esistente non apre la pagina di modifica (toast "Serve la rete per modificare
  una prenotazione"); nella pagina di modifica già aperta i pulsanti sono disattivati con la scritta "Serve la rete".

`public/manifest.webmanifest`: nome "Prenota", `display: "standalone"`, colore tema blu `#2563eb`, sfondo bianco,
icone `icona-512.png` e `icona.svg`. `proxy.ts` lascia passare senza sessione `sw.js`, il manifest e le icone.

Funziona solo in HTTPS (o su `localhost`).

Limiti noti:

- Le pagine HTML salvate restano in cache dopo il logout: senza rete chi apre l'app vede l'ultima copia (i dati
  vengono comunque dalla cache locale di TanStack, che il logout non svuota).
- I file `/_next/static` delle versioni precedenti restano nella cache `prenota-v1`; per ripulire basta cambiare
  il nome della cache in `sw.js`.
- Se sullo stesso telefono si cambia utente con prenotazioni in coda, vengono inviate con l'utente che ha fatto login.

## Come provarlo

Vedi la checklist in [Sviluppo e test](12-sviluppo-e-test.md#offline).

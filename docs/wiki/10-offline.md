# 10. Offline

> Stato: fatto

Regola: **senza rete si possono solo aggiungere prenotazioni**. Modifica ed eliminazione richiedono la rete.
Nulla deve andare perso in silenzio e nulla deve arrivare due volte.

## Lettura senza rete

TanStack Query salva la cache in localStorage (persister, chiave `prenota-cache`): eventi e prenotazioni già visti
restano consultabili. Se una pagina non ha nulla in cache e manca la rete, la query resta in pausa
(`fetchStatus === "paused"`) e la pagina mostra "Serve la rete per caricare i dati la prima volta" (`SERVE_RETE` in
`src/lib/query.ts`) invece di "Caricamento…". Il ripristino non scade mai (`maxAge: Infinity`): un telefono rimasto spento per giorni non
perde le prenotazioni in coda. Cambiare il `buster` in `src/app/providers.tsx` cancella tutta la cache, **coda
compresa**: non va cambiato con prenotazioni in attesa.

## Coda delle nuove prenotazioni

Tutto in `src/lib/query.ts`:

| Nome | Cosa fa |
|---|---|
| `CHIAVE_NUOVA` | `["nuova-prenotazione"]`, chiave della mutation di invio |
| `registraMutazioni(qc)` | `setMutationDefaults`: funzione di invio, tentativi, toast e aggiornamento dell'elenco. Sta qui e non nel form perché dopo un riavvio dell'app vale solo ciò che è registrato sul client |
| `riprendiCoda(qc)` | fa ripartire tutte le mutation in coda; la chiama il menu (`Nav`) a ripristino finito, quindi solo con una sessione valida (mai sulla pagina di login) |
| `svuotaDatiLocali(qc)` | al logout: svuota la cache di TanStack, la cache `prenota-v1` del service worker e `localStorage` |
| `inviaPrenotazione(d)` | `POST /api/prenotazioni`; lancia `ErroreRete` se la richiesta non parte o il server risponde 5xx, `ErroreSessione` su 401 |
| `useInAttesa(eventoId?)` | prenotazioni in coda (`stato: "pending"`) o rifiutate (`stato: "error"`, con `errore`), con `mutationId` |
| `useOnline()` | `true`/`false` secondo l'`onlineManager` di TanStack |

1. Il form crea la prenotazione con un **id UUID generato sul telefono** (`crypto.randomUUID()`).
2. L'invio è la mutation `CHIAVE_NUOVA`. Senza rete (`networkMode` predefinito `"online"`) resta **in pausa**, e il form
   torna subito alla pagina evento senza aspettare (una mutation in pausa non chiama né `onSuccess` né `onError`).
   Se il primo tentativo fallisce con la rete accesa il form torna all'evento lo stesso: per un errore temporaneo con
   il toast "Invio non riuscito, riprovo automaticamente", per un rifiuto (4xx) con il toast del motivo. Il toast
   "Salvata sul telefono, verrà inviata quando torna la rete" compare solo quando la rete manca davvero.
3. Il persister salva in localStorage le mutation **pending** (in pausa o a metà invio) e quelle **in errore**, non
   solo quelle in pausa come farebbe TanStack: un invio interrotto chiudendo l'app riparte alla riapertura.
   Il salvataggio è immediato (`throttleTime: 0`): senza rete Next ricarica la pagina dalla cache e la scrittura
   deve essere già avvenuta. Un `serialize` personalizzato salva l'errore come `{ message }` (un `Error` in JSON
   diventerebbe `{}`): il motivo del rifiuto resta visibile anche dopo un riavvio.
4. `onlineManager.setOnline(navigator.onLine)` all'avvio: TanStack altrimenti crede di essere online finché non arriva
   un evento `offline`, e un'app aperta senza rete brucerebbe i tentativi.
5. La pagina evento unisce `useInAttesa(id)` alle prenotazioni del server (escludendo gli id già arrivati), con le
   **tariffe attuali** dell'opera: etichetta gialla **"in attesa di invio"**, non apribili, contate nel riepilogo.
   In cima un avviso "Salvate sul telefono, verranno inviate quando torna la rete". Il menu mostra il numero totale
   in attesa sull'icona Eventi (rosso se ce n'è almeno una rifiutata).
6. Al ritorno della rete TanStack chiama `resumePausedMutations()`; alla riapertura dell'app (o dopo il login) il
   menu chiama `riprendiCoda`.
   A invio riuscito: toast "Prenotazione inviata: …" e rilettura di evento, elenco eventi e provenienze; la
   prenotazione resta "in attesa" finché l'elenco aggiornato non la contiene, così non sparisce per un attimo;
   poi la mutation riuscita viene tolta dalla cache delle mutation.
7. `POST /api/prenotazioni` fa `insert ... on conflict (id) do nothing`: se lo stesso invio arriva due volte (doppio
   tocco, due schede aperte, invio ripetuto dopo un riavvio) nel database c'è una sola riga.

Le mutation della coda hanno `gcTime: Infinity`: una prenotazione rifiutata non viene tolta dalla memoria dopo 5 minuti.

## Errori durante l'invio

| Caso | Tentativi | Cosa vede l'operatore |
|---|---|---|
| Rete che "c'è ma non va" o server in errore 5xx (`ErroreRete`) | senza fine, ogni 30 s | resta "in attesa di invio" |
| Sessione scaduta (401, `ErroreSessione`) | senza fine, ogni 30 s | toast "Accedi di nuovo per inviare le prenotazioni in attesa" con pulsante **Accedi** che porta a `/login` **nella stessa scheda** (la coda è su localStorage); dopo il login il menu riprende la coda e la invia |
| Rifiuti 4xx (400 dati non validi, 404 evento cancellato) | nessuno: riprovare non cambia l'esito | toast "Prenotazione di … non inviata: motivo"; in elenco etichetta rossa **"non inviata"** con il motivo e pulsante **Scarta** (con conferma) |

Il login nella stessa scheda (e non in una nuova) evita due schede che riscrivono la stessa coda in localStorage:
l'ultima che scrive vincerebbe.

Una prenotazione rifiutata **non sparisce mai da sola**, nemmeno chiudendo l'app: resta finché l'operatore non la
scarta (`mutationCache.remove`). Siccome il suo evento potrebbe non esistere più, le rifiutate compaiono anche in
home nel riquadro **Prenotazioni non inviate** (nome, biglietti — o solo il numero di persone se il tariffario non è più sul telefono —, telefono, posti, note, motivo). Non contano nel
riepilogo (sul server non ci sono).

## Logout

Il pulsante **Esci** controlla prima la coda: se ci sono prenotazioni in attesa o rifiutate **non esce** e mostra
"Ci sono N prenotazioni non ancora inviate: torna online e attendi l'invio prima di uscire" (altrimenti partirebbero
con l'utente successivo, o andrebbero perse). Con la coda vuota `svuotaDatiLocali` cancella cache dei dati, pagine
salvate dal service worker e `localStorage`, poi il logout sul server. Dopo un logout regolare non resta nulla del
vecchio utente, e la pagina di login non fa ripartire nessuna coda.

## Riaprire l'app senza rete: service worker

`public/sw.js`, scritto a mano, senza librerie; registrato da `src/components/RegistraSW.tsx` (in `layout.tsx`) solo in
produzione (`npm run build && npm start`): in sviluppo servirebbe file vecchi.

- `install` → `skipWaiting`; `activate` → elimina le cache con nome diverso da `prenota-v1` e `clients.claim`.
- Solo richieste **GET** della stessa origine. Esclusi `/api/*` (ci pensa TanStack Query) e le richieste RSC della
  navigazione interna di Next (intestazione `RSC`, chiavi sempre diverse).
- **Rete prima**: se risponde 200 la copia va in cache; se la rete manca si usa la copia salvata, e per una pagina mai
  vista la home (`/`). Redirect (es. verso il login) e errori non vengono salvati, quindi login e logout con la rete
  funzionano sempre dal server.
- **Rete lenta** (c'è ma non risponde): per le pagine (navigazioni) dopo **4 s** (`ATTESA_RETE` in `sw.js`) si mostra
  la copia salvata (o la home), se esiste; se non c'è nulla in cache si continua ad aspettare la rete. La risposta
  della rete, se arriva dopo, viene comunque salvata in cache per la volta successiva. I file statici non hanno attesa
  massima.
- Senza rete la navigazione interna di Next fallisce e Next ripiega su una navigazione normale, che il service worker
  serve dalla cache.
- La pagina evento, quando c'è rete, scarica in sottofondo sé stessa (`/eventi/{id}`) e
  `/eventi/{id}/prenotazioni/nuova` perché finiscano in cache: aperte con la navigazione interna di Next (tocco sulla
  scheda in home) non passerebbero mai come pagine intere. Così, per ogni evento già visto, senza rete si torna
  all'evento e si apre **Nuova prenotazione** anche più volte di seguito.
- Senza rete, toccare una prenotazione esistente non apre la pagina di modifica (toast "Serve la rete per modificare
  una prenotazione"); nella pagina di modifica già aperta i pulsanti sono disattivati con la scritta "Serve la rete".

`public/manifest.webmanifest`: nome "Prenota", `display: "standalone"`, colore tema blu `#2563eb`, sfondo bianco,
icone `icona-512.png` e `icona.svg`. `proxy.ts` lascia passare senza sessione `sw.js`, il manifest e le icone.

Funziona solo in HTTPS (o su `localhost`).

Limiti noti:

- I file `/_next/static` delle versioni precedenti restano nella cache `prenota-v1`; per ripulire basta cambiare
  il nome della cache in `sw.js`.
- Se la sessione scade e sullo stesso telefono accede un **altro** utente, la coda viene inviata con quell'utente
  (il logout regolare invece è bloccato finché la coda non è vuota).
- Senza rete un evento mai aperto con la rete non si apre: si vede la home.

## Come provarlo

Vedi la checklist in [Sviluppo e test](12-sviluppo-e-test.md#offline).

## Dopo l'arrivo delle tariffe per opera

- Il dettaglio evento salvato sul telefono contiene il tariffario dell'opera (anche le tariffe nascoste): il modulo
  funziona senza rete come prima. Una prenotazione in coda porta solo `tariffa_id` e quantità; i prezzi li fissa il
  server all'arrivo, e se una tariffa nel frattempo è stata eliminata la prenotazione viene rifiutata («Tariffa non
  valida») e resta in rosso da scartare a mano.
- La chiave della cache del dettaglio evento è `["evento", "tariffe", id]` (`chiaveEvento` in `src/lib/query.ts`):
  le copie salvate nel formato vecchio non vengono più lette e scadono da sole. Prenotazioni rimaste in coda nel
  formato vecchio arrivano senza tariffe: il server le rifiuta e restano da scartare.
- La pagina **Modifica** aspetta la rilettura dal server prima di aprire il modulo, così non si salva partendo da una
  copia vecchia.


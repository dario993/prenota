# 3. Manuale admin

> Stato: fatto

L'admin ha tutto ciò che ha l'operatore più la sezione **Admin** (barra in basso / menu laterale).
Ordine consigliato per un nuovo spettacolo: **locale → opera → evento**.

## Locali

Nome e **capienza** (numero intero > 0, es. 105). Un locale può ospitare più eventi.
Un locale con eventi collegati non si può eliminare (messaggio: «Impossibile eliminare: ci sono eventi collegati»).

Da **Admin → Locali**: la pagina mostra solo l'elenco; **Nuovo locale** in alto e **Modifica** su ogni riga aprono il modulo in una pagina a parte (**Annulla** o il tasto indietro tornano all'elenco, dopo il salvataggio si torna all'elenco). Opere, eventi e utenti funzionano allo stesso modo. L'esito (salvato / errore) compare in un messaggio a comparsa; in caso di errore i campi restano compilati.

## Opere e tariffario

Ogni opera ha il **suo tariffario**. Da **Admin → Opere**, **Nuova opera** o **Modifica** aprono una pagina con:

- **Titolo**.
- **Tariffe**: una riga per tariffa con **nome**, **prezzo** e la spunta **Nascosta**; **Aggiungi tariffa** ne
  aggiunge una, **Elimina** la toglie. L'ordine delle righe è l'ordine dei contatori quando si prenota.
  Una nuova opera parte con Adulti, Ridotti gruppi, Bambini (da compilare) e Omaggi (0,00).
- **Pacchetto**: quota teatro e quota ristorante (all'inizio 22,00 e 27,00) e la spunta **Nascosto**.
  Il pacchetto costa la somma delle due quote (49 €) e resta speciale: porta ristorante e pasto.

Si salva tutto con un solo **Salva**; in caso di errore non cambia nulla e i campi restano compilati.

- Una tariffa **nascosta** non compare tra i contatori di una nuova prenotazione; le prenotazioni che la usano
  restano valide, contano nel riepilogo e la mostrano anche in modifica. Serve per le tariffe che in un certo
  periodo non si vogliono vedere (es. «Associato»).
- Una tariffa **già usata** da almeno una prenotazione **non si può eliminare** («Impossibile eliminare «Adulti»:
  usata da prenotazioni. Puoi nasconderla»).
- Nomi unici nell'opera (senza badare a maiuscole); «Pacchetti» è riservato. Deve restare visibile almeno una
  tariffa o il pacchetto.
- Gli importi si scrivono con la virgola o il punto (`22,50`, `22.5`, `22`); testo o valori negativi vengono
  rifiutati con «Importo non valido» seguito dal nome della tariffa (es. «Importo non valido: Bambini»).
- Cambiare il tariffario **non modifica** le prenotazioni già salvate (vedi [Tariffe e incassi](04-tariffe-e-incassi.md)).

L'elenco delle opere mostra le tariffe con il prezzo (le nascoste in grigio con «(nascosta)») e il pacchetto.
Un'opera con eventi collegati non si può eliminare.

## Eventi

Da **Admin → Eventi**: scegli **opera**, **locale**, **data e ora** (ora italiana, qualunque sia il fuso del server). Un evento ha una sola opera.
L'elenco è ordinato per data e comprende anche gli eventi passati; il titolo apre la pagina dell'evento (riepilogo e
prenotazioni), **Modifica** apre il modulo con i dati dell'evento.
Un evento con prenotazioni non si può eliminare («Impossibile eliminare: ci sono prenotazioni»): prima vanno eliminate le prenotazioni.

## Utenti

Da **Admin → Utenti**:

- Crea un utente con nome, email, password iniziale (almeno 8 caratteri, obbligatoria) e ruolo (**admin** o **operatore**). L'email è unica («Email già in uso») e viene salvata in minuscolo.
- **Modifica** cambia nome, email e ruolo; la password si cambia solo se compilata, altrimenti resta invariata (così si reimposta quella dimenticata).
- **Disattiva** toglie l'accesso subito, anche a chi è già collegato (le sue prenotazioni restano); **Attiva** lo ripristina.
- Non puoi disattivare né declassare te stesso, così c'è sempre almeno un admin.

## API key

Da **Admin → API key** (su desktop **API key** nel menu) si crea una chiave per gestire l'app da remoto (es. da Claude): si dà un nome, si preme **Crea chiave** e
la chiave compare **una sola volta**, da copiare subito. L'elenco mostra chi l'ha creata e quando è stata usata l'ultima volta;
**Revoca** la disattiva all'istante. La chiave ha i pieni poteri di un admin (vedi pagina 9): revocarla quando non serve più.

## Il primo admin

Alla prima apertura, con il database vuoto, l'app chiede di creare il primo amministratore (nome, email, password e conferma). Non servono comandi da terminale. `npm run crea-admin` resta per il recupero di un accesso perso (vedi [Sviluppo e test](12-sviluppo-e-test.md)).

# 3. Manuale admin

> Stato: fatto

L'admin ha tutto ciò che ha l'operatore più la sezione **Admin** (barra in basso / menu laterale).
Ordine consigliato per un nuovo spettacolo: **locale → opera → evento**.

## Locali

Nome e **capienza** (numero intero > 0, es. 105). Un locale può ospitare più eventi.
Un locale con eventi collegati non si può eliminare (messaggio: «Impossibile eliminare: ci sono eventi collegati»).

Da **Admin → Locali**: il modulo in alto crea un nuovo locale; **Modifica** nell'elenco ricarica il modulo con i dati del locale. L'esito (salvato / errore) compare in un messaggio a comparsa; in caso di errore i campi restano compilati.

## Opere e tariffario

Per ogni opera: **titolo** e tariffario (in euro):

| Campo | Esempio | Note |
|---|---|---|
| Adulto | 15,00 € | |
| Ridotto gruppi | 12,00 € | prezzo fisso, non dipende dalla grandezza del gruppo |
| Bambino | 8,00 € | |
| Pacchetto – quota teatro | 22,00 € | valore iniziale |
| Pacchetto – quota ristorante | 27,00 € | valore iniziale |

Il prezzo del pacchetto mostrato è la somma delle due quote (49 €). Cambiare il tariffario **non modifica** le
prenotazioni già salvate (vedi [Tariffe e incassi](04-tariffe-e-incassi.md)).
Un'opera con eventi collegati non si può eliminare.

Gli importi si scrivono con la virgola o il punto (`22,50`, `22.5`, `22`); testo o valori negativi vengono rifiutati con «Importo non valido» seguito dal campo sbagliato (es. «Importo non valido: Bambino»). Nel modulo di una nuova opera le quote del pacchetto sono già compilate (22,00 e 27,00). L'elenco mostra le tariffe e il pacchetto totale; le stesse pagine si usano da **Admin → Opere**.

## Eventi

Da **Admin → Eventi**: scegli **opera**, **locale**, **data e ora** (ora italiana, qualunque sia il fuso del server). Un evento ha una sola opera.
L'elenco è ordinato per data; **Modifica** ricarica il modulo con i dati dell'evento.
Un evento con prenotazioni non si può eliminare («Impossibile eliminare: ci sono prenotazioni»): prima vanno eliminate le prenotazioni.

## Utenti

Da **Admin → Utenti**:

- Crea un utente con nome, email, password iniziale (almeno 8 caratteri, obbligatoria) e ruolo (**admin** o **operatore**). L'email è unica («Email già in uso») e viene salvata in minuscolo.
- **Modifica** cambia nome, email e ruolo; la password si cambia solo se compilata, altrimenti resta invariata (così si reimposta quella dimenticata).
- **Disattiva** toglie l'accesso subito, anche a chi è già collegato (le sue prenotazioni restano); **Attiva** lo ripristina.
- Non puoi disattivare né declassare te stesso, così c'è sempre almeno un admin.

## Il primo admin

Alla prima apertura, con il database vuoto, l'app chiede di creare il primo amministratore (nome, email, password e conferma). Non servono comandi da terminale. `npm run crea-admin` resta per il recupero di un accesso perso (vedi [Sviluppo e test](12-sviluppo-e-test.md)).

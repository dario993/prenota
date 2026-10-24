# Stati e messaggi

Come si presentano caricamento, vuoti, errori, offline e messaggi temporanei. I testi sono quelli da usare.

## Messaggi temporanei

- Compaiono in basso, sopra la barra fissa, larghi al massimo `form-max`; `radius-md`, `shadow-overlay`, `z-toast`, testo `body`. Non bloccano nulla e non spostano il contenuto.
- **Esito positivo**: fondo `success-soft`, testo `ink`, parola chiave in `success`. "Prenotazione inviata: Rossi Mario", "Copiato". Durata 4 secondi.
- **Neutro / informativo**: fondo `toast-bg`, testo `toast-ink`. "Invio non riuscito, riprovo automaticamente", "Serve la rete per modificare una prenotazione".
- **Errore di un'azione**: fondo `danger-soft`, testo `ink`, con pulsante di chiusura; resta finché non viene chiuso. "Impossibile eliminare: ci sono eventi collegati".
- `role="status"` per esiti e informazioni, `role="alert"` per gli errori.

## Errori di campo

- Sotto il campo, testo `caption` in `danger`, bordo del campo `danger`. Il valore resta.
- Testi: "Inserisci il nome", "Inserisci almeno una persona", "Scegli il ristorante", "Scegli pranzo o cena", "Email non valida", "Almeno 8 caratteri", "Le password non coincidono", "Importo non valido: Bambino", "Email già in uso".
- Al salvataggio con errori il focus va al primo campo sbagliato.

## Caricamento e vuoti

- Caricamento: righe segnaposto su `surface-sunken` della forma dei contenuti (schede, righe), senza animazione con `prefers-reduced-motion`.
- Stato vuoto: testo `body` `ink-muted` centrato nello spazio dell'elenco, con l'azione utile se esiste.
  - "Nessun evento in programma"
  - "Nessuna prenotazione" + **Nuova prenotazione**
  - "Nessun risultato per «…»"
  - "Nessun pacchetto ristorante per questo evento"
- Non trovato: "Evento non trovato", "Prenotazione non trovata" in `heading` + link "Torna agli eventi".

## Offline

- **Avviso globale** (con prenotazioni in attesa): fascia in cima alla pagina, fondo `warning-soft`, testo `ink`, icona nuvola barrata, `z-banner`: "Salvate sul telefono, verranno inviate quando torna la rete".
- **Mai caricato**: "Serve la rete per caricare i dati la prima volta" al posto del contenuto, `body` `ink-muted`.
- **Ultimo elenco caricato** senza rete: resta visibile e normale; nessuna velatura.
- **Azioni che richiedono la rete** (Salva/Elimina in modifica): disattivate, con "Serve la rete" in `caption` sotto il pulsante.
- **Contatore** sulla voce Eventi ed **etichetta "in attesa di invio"** sulle prenotazioni: vedi Pattern.

## Prenotazioni non inviate

- Riquadro in cima alla home (e riga nella pagina evento): fondo `danger-soft`, bordo `danger` da 1px, `radius-lg`, padding `space-4`.
- Titolo `heading` in `danger`: "Prenotazioni non inviate". Per ognuna: evento, motivo in `caption`, poi i dati (nome, quantità in `code`, telefono, posti, note) selezionabili per poterli copiare.
- Pulsante **Scarta** (distruttivo) con conferma "Scartare la prenotazione di Rossi Mario? I dati andranno persi." Non sparisce da solo.

## Sessione e uscita

- **Sessione scaduta con prenotazioni in attesa**: avviso su `warning-soft` "Accedi di nuovo per inviare le prenotazioni in attesa" con pulsante principale **Accedi**.
- **Esci bloccato**: finestra (`z-dialog`, `shadow-overlay`, `radius-lg`) "Ci sono 3 prenotazioni non ancora inviate: torna online e attendi l'invio prima di uscire." con un solo pulsante **Ho capito**.

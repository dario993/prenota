# Pattern dell'interfaccia

Regole d'uso dei pattern ricorrenti di Prenota, con i token da usare. Non sono componenti già pronti: descrivono cosa deve fare chi li costruisce.

## Navigazione principale

- Voci: **Eventi** (home) e, solo per l'admin, **Admin**; azione **Esci** separata dalle voci.
- Telefono: barra in basso, fondo `surface`, `shadow-bar`, altezza `nav-h` + area sicura. Ogni voce: icona sopra, testo `label` sotto, area almeno `tap-min`.
- Desktop: colonna laterale larga `nav-w`, fondo `surface`, bordo destro `line`.
- Voce attiva: testo e icona `accent`; inattive `ink-muted`.
- **Contatore** sulla voce Eventi (prenotazioni in attesa di invio): pillola `radius-pill`, testo `label`, fondo `accent` con `on-accent`. Se almeno una è stata rifiutata: fondo `danger` con `on-danger`. Etichetta accessibile: "3 prenotazioni in attesa di invio".

## Scheda evento (home)

- Fondo `surface`, bordo `line`, `radius-lg`, padding `space-4`; tutta la scheda è toccabile.
- Riga 1: titolo dell'opera in `heading`. Riga 2: data e ora · locale in `caption` `ink-muted`.
- **Indicatore di riempimento**: testo `87 / 105` in `figure-sm` + barra alta 6px, binario `surface-sunken`, riempimento `accent`, `radius-sm`.
  - Oltre la capienza: barra piena in `warning`, testo in `warning` e la parola "oltre capienza" (`label`). Mai solo il colore.
- Eventi passati: sezione chiusa di default sotto l'elenco; le schede passate hanno testo `ink-muted` e l'indicatore senza colore.

## Riepilogo dell'evento

- Pannello `surface-sunken`, `radius-lg`, padding `space-4`. Su telefono sopra l'elenco, su desktop colonna affiancata.
- In evidenza due cifre `figure`: **Persone** e **Posti liberi**. Posti liberi negativi: cifra in `warning` con segno − e la dicitura "oltre capienza".
- Sotto, righe `body` etichetta/valore allineato a destra (tabular-nums): adulti, ridotti, bambini, pacchetti, omaggi; coperti Giamaica pranzo/cena, Casale pranzo/cena; incasso teatro, incasso pacchetti (totale e per ristorante). Gli importi portano la nota "previsto" in `caption`.

## Elenco prenotazioni

- Campo di ricerca in cima: fondo `surface-sunken`, `radius-md`, altezza `control-h`, placeholder "Cerca per nome o telefono".
- **Telefono**: una scheda per prenotazione — nome `body-strong`, telefono `caption` `ink-muted`, sigle quantità in `code`, totale persone in `figure-sm` a destra.
- **Desktop**: tabella su `surface`, intestazioni `label` su `surface-sunken`, righe separate da `line`, padding verticale `space-3`; colonne numeriche allineate a destra; telefono come link `tel:` in `accent`.
- **Etichette di stato** (`label`, `radius-sm`, padding `space-1` `space-2`):
  - "in attesa di invio": fondo `accent-soft`, testo `accent`.
  - "non inviata": fondo `danger-soft`, testo `danger`, seguita dal motivo in `caption`.

## Modulo prenotazione

- Una sola colonna, larga al massimo `form-max`, campi distanziati `space-4`.
- Campo di testo: altezza `control-h`, bordo `line-control` da 1px, `radius-md`, fondo `surface`, valore `body`, etichetta `label` sopra.
- **Stepper quantità**: riga con etichetta (es. "Adulti") e prezzo unitario in `caption` `ink-muted` a sinistra; a destra `−` · campo numerico · `+`. Pulsanti quadrati `control-h`, bordo `line-control`; campo centrale in `figure-sm` centrato, `inputmode="numeric"`, il valore si seleziona tutto al tocco. − disattivato a 0.
- **Scelta a pulsanti** (Giamaica / Casale, Pranzo / Cena, Ruolo admin / operatore): gruppo di pulsanti affiancati a tutta larghezza, `control-h`, bordo `line-control`; quello scelto ha fondo `accent-soft`, bordo `accent` da 2px e testo `ink`. Semantica di gruppo radio.
- La sezione ristorante compare solo con Pacchetti > 0, subito sotto gli stepper.
- **Riepilogo in tempo reale**: barra fissa in basso su telefono (sopra la navigazione), fondo `surface`, `shadow-bar`. Totale persone, importo teatro, importo ristorante, totale in `figure-sm`; a destra **Salva** pieno `accent`.
  - Se si supera la capienza compare sopra i totali una riga su `warning-soft` con testo `warning`: "Supera la capienza di N posti". Salva resta attivo.
- **Annulla**: pulsante secondario (fondo `surface`, bordo `line-control`, testo `ink`).
- **Elimina** (solo in modifica): pulsante testo `danger`, lontano da Salva (in fondo al modulo, separato da `space-8`). La conferma usa un pulsante pieno `danger` con `on-danger`.

## Pulsanti

| Tipo | Fondo | Testo | Bordo | Uso |
|---|---|---|---|---|
| Principale | `accent` | `on-accent` | — | Una sola azione per schermata: Nuova prenotazione, Salva, Accedi, Crea e accedi |
| Secondario | `surface` | `ink` | `line-control` | Annulla, Condividi, Stampa, Modifica |
| Distruttivo | trasparente | `danger` | — | Elimina, Scarta, Disattiva (apre la conferma) |
| Conferma distruttiva | `danger` | `on-danger` | — | Dentro la finestra di conferma |

Tutti alti `control-h`, `radius-md`, testo `body-strong`.

## Pagine admin

- Stesso schema per Locali, Opere, Eventi, Utenti: modulo in alto su `surface` (`radius-lg`, padding `space-4`), elenco sotto.
- Riga dell'elenco: dati a sinistra, **Modifica** (secondario) ed **Elimina** / **Disattiva** (distruttivo) a destra; su telefono le azioni vanno sotto i dati.
- In modifica il modulo mostra "Modifica: <nome>" in `heading` e un pulsante **Annulla modifica**.
- Opere: il prezzo del pacchetto (somma delle due quote) appare sotto i due campi in `figure-sm`; avviso in `caption` `ink-muted`: "Cambiare il tariffario non modifica le prenotazioni già salvate."
- Eventi passati nell'elenco admin: testo `ink-muted` e la parola "passato".
- Utenti disattivati: etichetta "disattivato" (`label`, fondo `surface-sunken`, testo `ink-muted`). Sulla propria riga Disattiva e il cambio di ruolo non compaiono.

## Elenco ristoranti e stampa

- Una sezione per combinazione con coperti; intestazione `heading` "Casale – Cena", sotto data e opera in `caption`, totale coperti in `figure-sm`.
- Righe: nome `body-strong`, coperti, telefono, note in `ink-muted`.
- Per sezione: **Condividi** (secondario); in cima alla pagina **Stampa**.
- **Stampa**: solo testo nero su bianco, IBM Plex Sans o serif di sistema, nessuna navigazione, pulsante, ombra o fondo colorato; ogni sezione evita di spezzarsi tra due pagine (`break-inside: avoid`).

# Pattern dell'interfaccia

Regole d'uso dei pattern ricorrenti di Prenota, con i token da usare. Non sono componenti già pronti: descrivono cosa deve fare chi li costruisce.

## Cornice e foglio

- Desktop: la **cornice** (`bg`) contiene il menu laterale largo 228px; il contenuto sta su un **foglio** `surface`
  staccato 8px dai bordi della finestra, angoli 16px, bordo `line` da 1px, nessuna ombra.
- Telefono: niente foglio, il contenuto è su `surface` a tutto schermo; barra in basso sulla cornice (`bg`, `shadow-bar`).
- **Marchio**: un sipario aperto (mantovana e due teli bianchi) su un quadrato `accent` con angoli 7px
  (`src/components/Marchio.tsx`, `public/icona.svg`), seguito da "Prenota" in testa al menu e nel login.

## Navigazione principale

- Voci: **Eventi** (home) e, solo per l'admin, **Admin** su telefono o, su desktop, il gruppo "Amministrazione"
  (Locali, Opere, Eventi, Utenti); **Tema** ed **Esci** in fondo al menu.
- Telefono: barra in basso, altezza `nav-h` + area sicura. Ogni voce: icona sopra, testo `label` sotto, area almeno `tap-min`; voce attiva in `accent`.
- Desktop: voci alte 36px, icone 20px a tratto 1.75; voce attiva come pillola `active` con testo `ink`, inattive `ink-muted`.
- **Contatore** sulla voce Eventi (prenotazioni in attesa di invio): pillola `radius-pill`, testo `label`, fondo `accent` con `on-accent`. Se almeno una è stata rifiutata: fondo `danger` con `on-danger`. Etichetta accessibile: "3 prenotazioni in attesa di invio".

## Elementi di pagina

- Titolo di pagina `title` (22px) su ogni larghezza; sotto, una frase in `body` `ink-muted` sul dato che conta.
- **Data come biglietto** (`DataBiglietto`): blocco largo 64px con giorno grande (26px), giorno della settimana e mese,
  ora; fondo `surface-sunken` negli elenchi, fondo `accent` con testo bianco in testa alla pagina evento.
- Riquadri: bordo `line`, `radius-lg`, padding 20px, nessuna ombra e nessun fondo diverso dal foglio; titolo `body` semibold
  e a destra, in grigio, l'unità o il dato secondario.

## Elenco eventi (home)

- Titolo **Eventi** e la frase «Il prossimo è domenica 1 novembre alle 16:30: 187 persone su 296, restano 109 posti.»
- Schede a sottolineatura **In programma** (con il numero) e **Passati** (caricati solo quando si apre la scheda).
- Ogni evento è una riga: data come biglietto · titolo (17px semibold) e locale · numero di prenotazioni ·
  `persone / capienza` con la barra · posti liberi grandi a destra. Righe separate da `line`, al passaggio fondo
  `surface-sunken` leggero. Su telefono la barra va in seconda riga.
- **Indicatore di riempimento**: barra alta 6px tonda, binario `surface-sunken`, riempimento `accent`; oltre la capienza
  `warning` con la parola "oltre capienza" e i posti negativi (`−15`). Mai solo il colore. Eventi passati: barra `ink-muted`.
- Desktop: a destra il riquadro del prossimo evento (persone, barra di riempimento, persone per tariffa, pacchetti, posti liberi) con il link Apri.

## Riepilogo dell'evento

- In testa: link "‹ Eventi", data come biglietto pieno, titolo, giorno · ora · locale in `ink`, azioni Ristoranti e
  Stampa (solo desktop) e Nuova prenotazione; su telefono **Nuova** sta nella barra fissa in alto accanto al titolo.
- Tre riquadri (desktop largo: affiancati; tablet: Sala sopra, gli altri due affiancati; telefono: uno sotto l'altro):
  - **Sala**: a destra i posti liberi (in `warning` "oltre capienza"), persone in 34px `accent`, la barra di riempimento, poi
    prenotazioni attive, senza stato, in attesa di invio (se ci sono), annullate.
  - **Biglietti**: una riga per tariffa usata con il prezzo in grigio, i pacchetti, **Incasso teatro previsto**.
  - **Ristoranti**: coperti per ristorante e pasto, incasso per ristorante rientrato, **Incasso pacchetti previsto**,
    nota "Importi previsti, non incassati."
- Righe etichetta / cifra in `label`, separate da `line`, cifre tabellari a destra.

## Elenco prenotazioni

- Intestazione **Prenotazioni N** come scheda sottolineata (2px `ink`) su una riga `line`.
- Sotto: campo di ricerca largo 300px con bordo `line-control`, icona a sinistra, accanto Riordina; a destra
  «187 persone in 14 prenotazioni» (senza annullate).
- **Tacca dello stato**: a sinistra di ogni riga una tacca larga 4px, arrotondata, staccata 12–14px dai bordi della
  riga così le righe vicine non si toccano; colori originali (giallo prenotato, verde stampato, arancio modificato,
  rosso annullato), mai da cambiare; senza stato niente tacca. Si stampa.
- **Scelta dello stato**: pallino del colore dello stato + parola in un menu compatto (bordo solo al passaggio del mouse
  su desktop, sempre su telefono).
- **Telefono**: una riga per prenotazione — numero, nome semibold (barrato se annullata), sotto in `caption` telefono,
  biglietti, posti, note; persone a destra in 17px; sotto la scelta dello stato.
- **Desktop**: tabella senza fondo nell'intestazione (`caption` `ink-muted`), righe separate da `line`, al passaggio fondo
  `surface-sunken` leggero; telefono sottolineato in grigio come link `tel:`; posti nel font del testo; persone a destra.
- **Etichette di stato dell'invio** (`label`, `radius-sm`, padding `space-1` `space-2`):
  - "in attesa di invio": fondo `accent-soft`, testo `accent`.
  - "non inviata": fondo `danger-soft`, testo `danger`, seguita dal motivo in `caption`.

## Modulo prenotazione

- Testa: «‹ Titolo · giorno», titolo `title`, frase sotto (posti che restano, o lo stato in modifica). Su telefono
  `BarraTelefono` con titolo e giorno dell'evento e **Annulla**.
- Desktop largo (≥ 1280px): due colonne 7/5. A sinistra i riquadri **Cliente** (nome e telefono affiancati),
  **Biglietti**, **Posti e note** (posti e provenienza affiancati, note sotto) e, in modifica, **Cronologia** ed
  **Elimina prenotazione**; a destra il riepilogo, fermo mentre si scorre. Sotto 1280px una colonna, riepilogo in fondo.
- Campo di testo: 48px su telefono, 44px su desktop, bordo `line-control` da 1px, `radius-md`, fondo `surface`,
  valore `body`, etichetta `label` sopra.
- **Riga biglietto** (`Contatore`): nome 15px medio e prezzo 13px grigio a sinistra; `−` · campo numerico · `+`
  (48px su telefono, 40px su desktop; il numero 18px semibold, `inputmode="numeric"`, tutto selezionato al tocco);
  a destra l'importo della riga («–» se zero). Righe separate da `line`. − disattivato a 0.
- **Scelta a segmenti** (Giamaica / Casale, Pranzo / Cena, Ruolo): gruppo su `surface-sunken` con padding 4px; la
  scelta attiva è un segmento `surface` con bordo `line` e testo `ink`, le altre `ink-muted`. Semantica radio.
- La sezione ristorante compare solo con Pacchetti > 0, dentro il riquadro Biglietti.
- **Riepilogo come biglietto**: data come biglietto pieno, titolo, giorno e locale; linea tratteggiata; nome del
  cliente (18px); righe quantità × prezzo; Teatro e Ristorante rientrati; **Totale** in 30px con le persone; poi
  **Capienza**: barra di riempimento (già prenotati + questa) e la riga «Già prenotati N · questa prenotazione N · su N».
- **Salva** (pieno `accent`) e **Annulla** sotto il riepilogo; su telefono barra fissa in basso con persone, totale
  e **Salva**.
- **Elimina** (solo in modifica): pulsante testo `danger` in fondo alla colonna sinistra, lontano da Salva.

## Pagine admin e Ristoranti

- `TestaPagina`: «‹ indietro» (nei moduli), titolo, frase sotto, azioni a destra (Nuovo … con +).
- Elenchi: righe sul foglio separate da `line`, azioni a destra su desktop (sotto su telefono).
- Moduli: riquadri (`scheda`) larghi al massimo 640px; i fieldset hanno il titolo dentro il riquadro (`legendaPannello`).
- Ristoranti: un riquadro per ristorante e pasto, due per riga su desktop, coperti in 34px `accent`.
- Su telefono ogni pagina ha la `BarraTelefono` con il marchio e il titolo.

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

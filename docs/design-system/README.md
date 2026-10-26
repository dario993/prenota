Prenota è lo strumento interno con cui lo staff del teatro raccoglie le prenotazioni, quasi sempre dal telefono, in piedi, con una mano, mentre parla con il cliente. Il sistema è un gestionale con un volto: cornice grigio-blu, foglio bianco, un solo blu per i dati e l'azione, il marchio del sipario, nessuna decorazione. Ogni scelta serve a leggere un numero al volo e a toccare il pulsante giusto al primo colpo.

## Principi

- **Prima il pollice.** Su telefono l'azione principale (Nuova prenotazione, Salva) sta in basso, raggiungibile con il pollice, alta almeno `tap-min` (44px); campi e pulsanti alti `control-h`.
- **I numeri si leggono senza sforzo.** Persone, posti e importi usano gli stili `figure` / `figure-sm` con cifre tabellari (`font-variant-numeric: tabular-nums`), allineati a destra nelle tabelle.
- **Avvisa, non blocca.** Il superamento della capienza è sempre visibile in `warning` ma non disattiva mai Salva.
- **Lo stato non è solo colore.** Ogni stato (in attesa, non inviata, oltre capienza, errore) porta una parola; il colore la rinforza.
- **Un solo accento.** `accent` compare solo dove si agisce o si è scelto qualcosa. Se in una schermata ci sono due pulsanti pieni `accent`, uno è di troppo.

## Contenuti e tono

- Italiano semplice, frasi brevi, tono da collega: imperativo per le azioni ("Salva", "Condividi", "Accedi"), mai "Clicca qui".
- Dai del tu solo quando serve un'istruzione ("Torna online e attendi l'invio"); altrimenti forma impersonale ("Serve la rete").
- Maiuscola solo a inizio frase e nei nomi propri: "Nuova prenotazione", non "Nuova Prenotazione". I nomi dei clienti si mostrano come sono stati scritti.
- Niente emoji, niente punti esclamativi.
- Esiti: soggetto + oggetto concreto. "Prenotazione inviata: Rossi Mario", "Copiato".
- Errori: dire cosa manca o cosa fare, in una riga. "Inserisci il nome", "Scegli ristorante e pasto", "Importo non valido: Bambino", "Email o password errati".
- Conferme distruttive: domanda con il nome. "Eliminare la prenotazione di Rossi Mario?" — pulsanti "Elimina" e "Annulla".

**Formati**

| Dato | Formato | Esempio |
|---|---|---|
| Importo | virgola decimale, due cifre, spazio, € dopo | `49,00 €` |
| Data e ora | giorno breve, giorno, mese esteso, anno, ora 24h (ora italiana) | `sab 10 ottobre 2026, 21:00` |
| Riempimento | persone / capienza | `87 / 105` |
| Posti liberi negativi | segno meno vero (−), in `warning` | `−6 posti` |
| Quantità compatte | sigle A R B P O, ristorante e pasto per esteso | `A2 R1 B1 P2 Casale cena O1` |
| Telefono | come scritto, cliccabile (`tel:`) | `333 1234567` |

## Colore

- Pagina su `bg`; schede, moduli e tabelle su `surface` con bordo `line` da 1px; pannelli secondari (Riepilogo, ricerca, intestazioni di tabella) su `surface-sunken`.
- Testo principale `ink`; tutto il resto (data, locale, telefono, sigle, etichette) `ink-muted`.
- `accent` è il solo colore d'azione: pulsante principale pieno con testo `on-accent`, link, voce di navigazione attiva, riempimento dell'indicatore posti. Le scelte attive (Giamaica/Casale, Pranzo/Cena) usano fondo `accent-soft` e bordo `accent`.
- Bordi dei campi, degli stepper e dei pulsanti secondari: `line-control`, mai `line` (che non raggiunge 3:1).
- Stati: `warning` / `warning-soft` per la capienza superata e l'avviso offline; `danger` / `danger-soft` per errori, rifiuti del server e azioni distruttive; `success` / `success-soft` per gli esiti positivi; "in attesa di invio" in `accent-soft` con testo `accent`. `success` è un verde-petrolio e `danger` un rosso: si distinguono anche senza vedere il rosso, e portano sempre una parola.
- Tema scuro: stessi nomi, valori dal tema "Scuro". Sopra `accent` e `danger` scuri il testo è scuro (`on-accent`, `on-danger`), non bianco.
- Tutti i testi indicati nelle note d'uso raggiungono almeno 4.5:1 sui loro fondi in entrambi i temi; `line-control` e `focus` almeno 3:1.

## Tipografia

- Una sola famiglia, IBM Plex Sans (Google Fonts, pesi 400, 500, 600), con `sans` come pila di riserva; IBM Plex Mono (500) solo per lo stile `code`.
- Titolo di pagina: `title` su telefono, `display` da `bp-desktop` in su. Sezioni: `heading`.
- Testo e valori dei campi: `body`, mai sotto i 16px. Nomi delle prenotazioni e testo dei pulsanti: `body-strong`.
- Etichette dei campi, voci di navigazione, intestazioni di tabella, etichette di stato: `label`. Metadati, prezzi unitari, errori sotto il campo: `caption`.
- Cifre del Riepilogo: `figure`; totali del modulo e valore degli stepper: `figure-sm`; sigle quantità e posti (`K1-4, L5`): `code`.

## Spazi e layout

- Scala: `space-1` 4 · `space-2` 8 · `space-3` 12 · `space-4` 16 · `space-6` 24 · `space-8` 32 · `space-12` 48. Non usare valori fuori scala.
- **Telefono (< `bp-desktop`)**: margini laterali `space-4`, una colonna, navigazione in basso alta `nav-h` più `env(safe-area-inset-bottom)`. Le barre fisse (navigazione, riepilogo del modulo) hanno `shadow-bar` e fondo `surface`; il contenuto ha `space-12` di respiro in fondo per non finirci sotto.
- **Desktop (≥ `bp-desktop`)**: navigazione laterale larga `nav-w`, contenuto fino a `content-max` con margini `space-6`; nella pagina evento Riepilogo e elenco affiancati, prenotazioni in tabella. I moduli restano larghi al massimo `form-max`.
- Tra campi del modulo `space-4`, tra etichetta e campo `space-2`, tra sezioni `space-6`.

## Forme, bordi, ombre

- Raggi: `radius-md` per campi, pulsanti, stepper e messaggi; `radius-lg` per schede e pannelli; `radius-sm` per etichette di stato; `radius-pill` solo per il contatore della navigazione.
- Le schede si separano con il bordo `line`, non con l'ombra. Le ombre sono due: `shadow-bar` per le barre fisse in basso, `shadow-overlay` per messaggi temporanei e finestre di conferma.
- Livelli: `z-bar` < `z-banner` < `z-dialog` < `z-toast`.

## Stati dei controlli

- Focus da tastiera: anello `focus` pieno da 2px con 2px di distacco (`outline: 2px solid var(--focus); outline-offset: 2px`), su ogni elemento interattivo, mai rimosso.
- Premuto: pulsante principale passa a `accent-hover`; secondari a fondo `surface-sunken`.
- Disattivato: opacità 0.5 e cursore normale; se il motivo non è ovvio, una riga `caption` lo spiega ("Serve la rete").
- Invio in corso: il pulsante resta largo uguale, si disattiva e la scritta diventa "Invio…"; nessuna rotellina a tutta pagina.
- Errore di campo: bordo `danger` e messaggio `caption` in `danger` sotto il campo; il valore scritto non si perde.

## Movimento

- Solo transizioni brevi (120–160ms) su colore e opacità; i messaggi temporanei entrano dal basso in 160ms e restano 4 secondi (gli errori finché non vengono chiusi o superati).
- Con `prefers-reduced-motion: reduce` nessuna animazione.

## Iconografia

- Nessuna icona propria del teatro è stata fornita. Usa un set lineare open source a tratto 2px su griglia 24px (es. Lucide), sempre nello stesso set: calendario, persone, telefono, ristorante, condividi, stampa, nuvola barrata per l'offline, cestino per Elimina.
- Le icone affiancano una parola; un pulsante solo icona ha sempre `aria-label` e area `tap-min`. Colore dell'icona = colore del testo vicino.
- Nessun logo: il nome "Prenota" è composto in IBM Plex Sans `heading`.

## Accessibilità

- Etichetta visibile su ogni campo; tastiera numerica (`inputmode="numeric"`) per le quantità, telefonica (`type="tel"`) per il telefono.
- Elementi toccabili almeno `tap-min`; tra due elementi toccabili adiacenti almeno `space-2`.
- Gli avvisi (capienza, offline, messaggi temporanei) sono annunciati con `role="status"`; gli errori bloccanti con `role="alert"`.
- Le azioni distruttive (Elimina, Scarta, Disattiva) sono sempre separate dalle azioni positive e chiedono conferma.

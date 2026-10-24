# 11. Interfaccia e stile

> Stato: fatto

## Direzione

Minimal su **bianco** con un unico **accento blu**. Molto spazio, tipografia chiara, niente decorazioni superflue.

## Palette (Tailwind v4, `@theme` in `globals.css`)

| Token | Uso |
|---|---|
| bianco | sfondo pagine |
| grigi chiari | bordi, sfondi delle card, separatori |
| grigio scuro | testo |
| **blu** (accento) | pulsanti principali, link, voce di menu attiva, barra capienza |
| rosso | avviso oltre capienza, errori, elimina |
| ambra | "in attesa di invio" |

Font di sistema (nessun web font da scaricare). Icone: lucide-react.

## Layout

| Larghezza | Navigazione | Elenco prenotazioni | Riepilogo evento |
|---|---|---|---|
| Telefono (< `lg`, 1024 px) | barra fissa in basso | schede impilate | sopra l'elenco |
| Desktop (≥ `lg`) | menu laterale fisso a sinistra | tabella | colonna affiancata |

La navigazione è **un solo componente**: cambia solo il CSS (classi responsive), nessuna logica duplicata.

## Componenti principali

- **Contatore** − / + per le quantità (bersagli grandi, almeno 44 px, adatti al pollice).
- **Barra capienza**: blu, rossa oltre capienza.
- **Pulsante +** flottante (telefono) / pulsante in alto (desktop) per la nuova prenotazione.
- **Toast** (sonner) per conferme ed errori.

## Usabilità mobile

- Form in una sola schermata, campi grandi, tastiera giusta (`type="tel"` per il telefono, `inputmode="numeric"`).
- Rispetto delle aree sicure di iPhone (`env(safe-area-inset-bottom)`) per la barra in basso.

## Accessibilità

Etichette su tutti i campi, contrasto sufficiente, focus visibile, pulsanti icona con `aria-label`.

## Stampa

Stile di stampa per l'elenco ristoranti: niente menu né pulsanti, testo nero su bianco.

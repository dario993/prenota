# 11. Interfaccia e stile

> Stato: fatto

Fonte: **[design system](../design-system/README.md)** (`docs/design-system/`: principi e tono in `README.md`, pattern in
`pattern.md`, stati e testi in `stati-e-messaggi.md`, valori in `tokens.css` / `tokens.json`). Questa pagina dice come
è applicato nel codice.

## Direzione

Gestionale neutro: grigi puliti, un solo blu per l'azione, nessuna decorazione. Si usa dal telefono, in piedi, con una
mano: i numeri si leggono al volo, l'azione principale sta in basso. La capienza superata avvisa e non blocca; ogni
stato porta una parola, non solo un colore. Tema chiaro e scuro: segue il sistema finché non si sceglie a mano.

## Token nel codice

- `src/app/globals.css` contiene i valori di `tokens.css` (chiaro, scuro esplicito con `data-theme="dark"`, scuro di
  sistema) e li espone a Tailwind v4 con `@theme inline`: `bg-surface`, `bg-surface-sunken`, `border-line`,
  `border-line-control`, `text-ink`, `text-ink-muted`, `bg-accent`, `text-on-accent`, `bg-accent-soft`, `text-danger`,
  `bg-warning-soft`, `bg-success-soft`… e le ombre `shadow-bar` / `shadow-overlay`.
- Tipografia come utility: `text-display`, `text-title`, `text-heading`, `text-body`, `text-label`, `text-caption`,
  `text-figure`, `text-figure-sm` (con `tabular-nums` per le cifre); stile `code` = `font-mono text-label`.
- Font: IBM Plex Sans (400/500/600) e IBM Plex Mono (500) con `next/font/google`: scaricati al build e serviti
  dall'app, quindi funzionano anche offline.
- Breakpoint desktop `lg` = 960px (`bp-desktop`); raggi `rounded-sm` 4, `rounded-md` 8, `rounded-lg` 12; la scala
  spazi di Tailwind coincide con `space-1…12`.
- Focus da tastiera globale (`:focus-visible`, anello `focus` 2px con 2px di distacco); con
  `prefers-reduced-motion` nessuna animazione.

## Tema chiaro / scuro

Pulsante **Tema scuro / Tema chiaro** nel menu laterale su desktop e nella pagina Admin su telefono, per non occupare la barra in basso (`src/components/TemaToggle.tsx`): con un tocco imposta `data-theme` su
`<html>` e lo ricorda sul dispositivo (`localStorage` `tema`). Uno script in `<head>` (`src/app/layout.tsx`) lo
riapplica prima del disegno della pagina, così non si vede il tema sbagliato. Senza scelta salvata vale il tema di
sistema. La variante Tailwind `dark:` (`@custom-variant` in `globals.css`) segue la stessa regola; icona e testo del
pulsante cambiano solo via CSS.

## Classi condivise

`src/components/stili.ts`: `btnPrimario`, `btnSecondario`, `btnDistruttivo`, `btnConfermaDistruttiva`, `etichetta`,
`campo`, `erroreCampo`, `scheda`, `scelta` (pulsanti radio: Giamaica/Casale, Pranzo/Cena, Ruolo) e le classi delle
pagine admin. Pulsanti e campi alti 48px (`control-h`); durante l'invio il pulsante si disattiva e scrive "Invio…".

## Layout

| Larghezza | Navigazione | Elenco prenotazioni | Riepilogo evento | Modulo prenotazione |
|---|---|---|---|---|
| Telefono (< 960px) | barra in basso 64px + area sicura, `shadow-bar` | schede | sopra l'elenco | totali e **Salva** in una barra fissa sopra la navigazione |
| Desktop (≥ 960px) | colonna laterale 240px | tabella | sopra l'elenco, blocchi affiancati; in ogni blocco una colonna per voce (etichetta sopra, cifra sotto) | totali e Salva in fondo al modulo |

Contenuto largo al massimo 1200px, moduli al massimo 640px. Su telefono **Nuova prenotazione** è un pulsante tondo fisso in
basso a destra, sopra la navigazione, con il solo simbolo +. Le pagine admin usano un solo elenco: azioni sotto i dati su telefono, a destra
su desktop.

## Componenti

- **Contatore**: etichetta e prezzo unitario a sinistra; pulsanti − / + quadrati e campo numerico (`figure-sm`,
  0–10000, vuoto = 0, tutto selezionato al tocco).
- **Barra capienza**: 6px, `accent`; oltre la capienza `warning` con la parola "oltre capienza"; spenta per gli eventi passati.
- **Etichette di stato**: "in attesa di invio" (`accent-soft`), "non inviata" (`danger-soft`) con motivo e **Scarta**.
- **Stato** (`src/components/Stato.tsx`): caricamento, senza rete, "Evento non trovato" / "Prenotazione non trovata"
  con il link "Torna agli eventi".
- **Messaggi temporanei** (sonner): in basso sopra la navigazione; esiti su `success-soft`, informazioni su
  `toast-bg`, errori su `danger-soft`, tutti con pulsante di chiusura.
- Icone lucide-react (tratto 2px), sempre accanto a una parola.

## Stampa

Elenco ristoranti: nero su bianco, senza navigazione, pulsanti né fondi; ogni sezione non si spezza tra due pagine.

## Differenze note dal design system

- Le conferme (Elimina, Scarta, Disattiva) e l'avviso "Esci bloccato" usano ancora `confirm()` del browser e un
  messaggio temporaneo, non una finestra dell'app con i pulsanti "Elimina" / "Annulla" o "Ho capito".
- I messaggi di errore si chiudono da soli dopo 4 secondi (hanno il pulsante di chiusura) invece di restare fino alla chiusura.
- Nel modulo opera il prezzo del pacchetto non si aggiorna mentre scrivi: si vede quello salvato.

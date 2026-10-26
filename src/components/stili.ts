// Classi del design system usate in più schermate (docs/design-system/pattern.md).
const pulsante =
  "inline-flex h-12 items-center justify-center gap-2 rounded-md px-4 text-body font-semibold lg:h-9 lg:gap-2 lg:px-3.5 lg:text-label lg:font-medium transition-colors duration-150 disabled:cursor-default disabled:opacity-50";

export const btnPrimario = `${pulsante} bg-accent text-on-accent hover:bg-accent-hover active:bg-accent-hover`;
export const btnSecondario = `${pulsante} border border-line-control bg-surface text-ink hover:bg-surface-sunken active:bg-surface-sunken`;
export const btnDistruttivo = `${pulsante} text-danger hover:bg-danger-soft`;
export const btnConfermaDistruttiva = `${pulsante} bg-danger text-on-danger`;

export const etichetta = "flex flex-col gap-2 text-label text-ink";
export const campo =
  "h-12 w-full rounded-md border border-line-control bg-surface px-3 text-body font-normal text-ink placeholder:text-ink-muted aria-invalid:border-danger lg:h-11";
export const erroreCampo = "text-caption font-normal text-danger";

// pannello: bordo sottile, nessun fondo diverso dal foglio, nessuna ombra; titolo del pannello in `titoloPannello`
export const scheda = "rounded-lg border border-line bg-surface p-5";
export const titoloPannello = "text-body font-semibold";
// legend di un fieldset-pannello: dentro il bordo come un titolo (float), il contenuto riparte sotto
export const legendaPannello = "float-left mb-4 w-full p-0 text-body font-semibold [&+*]:clear-both";
// scelta a segmenti (radio nascosto dentro la label): Giamaica/Casale, Pranzo/Cena, Ruolo. Il gruppo usa `segmenti`.
export const segmenti = "flex gap-1 rounded-lg bg-surface-sunken p-1";
export const scelta =
  "flex h-11 flex-1 cursor-pointer items-center justify-center rounded-md border border-transparent text-label font-medium text-ink-muted transition-colors duration-150 hover:text-ink has-checked:border-line has-checked:bg-surface has-checked:text-ink has-focus-visible:outline-2 has-focus-visible:outline-offset-1 has-focus-visible:outline-focus lg:h-9";
// «‹ Pagina precedente» in testa
export const linkIndietro = "-mt-1 mb-2 inline-flex min-h-11 items-center gap-1 text-label font-normal text-ink-muted hover:text-ink lg:min-h-0 print:hidden";

// pagine admin: righe sul foglio separate da `line` (come l'elenco eventi); azioni sotto i dati su telefono, a destra su desktop
export const elencoAdmin = "border-t border-line";
export const rigaAdmin = "flex flex-col gap-3 border-b border-line py-4 lg:flex-row lg:items-center lg:justify-between";
export const azioniAdmin = "flex shrink-0 flex-wrap gap-2";
export const paginaAdmin = "mx-auto w-full max-w-[1200px] space-y-6 px-4 py-6 lg:px-6";

// contrassegni: verde, giallo, arancio, rosso (colori originali, non si cambiano); senza stato niente colore
export const pallinoContrassegno = {
  stampato: "bg-green-600", prenotato: "bg-yellow-400", modificato: "bg-orange-500", annullato: "bg-red-600",
} as const;

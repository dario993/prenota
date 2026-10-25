// Classi del design system usate in più schermate (docs/design-system/pattern.md).
const pulsante =
  "inline-flex h-12 items-center justify-center gap-2 rounded-md px-4 text-body font-semibold transition-colors duration-150 disabled:cursor-default disabled:opacity-50";

export const btnPrimario = `${pulsante} bg-accent text-on-accent hover:bg-accent-hover active:bg-accent-hover`;
export const btnSecondario = `${pulsante} border border-line-control bg-surface text-ink hover:bg-surface-sunken active:bg-surface-sunken`;
export const btnDistruttivo = `${pulsante} text-danger hover:bg-danger-soft`;
export const btnConfermaDistruttiva = `${pulsante} bg-danger text-on-danger`;

export const etichetta = "flex flex-col gap-2 text-label text-ink";
export const campo =
  "h-12 w-full rounded-md border border-line-control bg-surface px-3 text-body font-normal text-ink aria-invalid:border-danger";
export const erroreCampo = "text-caption font-normal text-danger";

export const scheda = "rounded-lg border border-line bg-surface p-4";
// scelta a pulsanti (radio nascosto dentro la label): Giamaica/Casale, Pranzo/Cena, Ruolo
export const scelta =
  "flex h-12 flex-1 cursor-pointer items-center justify-center rounded-md border border-line-control bg-surface text-body font-semibold text-ink has-checked:border-accent has-checked:bg-accent-soft has-checked:ring-1 has-checked:ring-accent has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus";

// pagine admin: elenco su surface, una riga per voce; azioni sotto i dati su telefono, a destra su desktop
export const elencoAdmin = "divide-y divide-line rounded-lg border border-line bg-surface";
export const rigaAdmin = "flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between";
export const azioniAdmin = "flex flex-wrap gap-2";
export const paginaAdmin = "mx-auto w-full max-w-[1200px] space-y-6 px-4 py-6 lg:px-6";

// contrassegni: verde, giallo, arancio, rosso; senza stato resta il grigio della linea
export const barraContrassegno = {
  stampato: "border-l-green-600", prenotato: "border-l-yellow-400", modificato: "border-l-orange-500", annullato: "border-l-red-600",
} as const;
export const pallinoContrassegno = {
  stampato: "bg-green-600", prenotato: "bg-yellow-400", modificato: "bg-orange-500", annullato: "bg-red-600",
} as const;

// Indicatore di riempimento: barra da 6px; oltre la capienza in warning (la parola la aggiunge chi la usa).
export function BarraCapienza({ persone, capienza, spenta = false }: { persone: number; capienza: number; spenta?: boolean }) {
  const oltre = persone > capienza;
  const pct = capienza > 0 ? Math.min(100, (persone / capienza) * 100) : 100;
  const colore = spenta ? "bg-ink-muted" : oltre ? "bg-warning" : "bg-accent";
  return (
    <div role="progressbar" aria-valuemin={0} aria-valuemax={capienza} aria-valuenow={persone} aria-label="Capienza" className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
      <div className={`h-full ${colore}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

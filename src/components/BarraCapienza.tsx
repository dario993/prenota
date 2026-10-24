export function BarraCapienza({ persone, capienza }: { persone: number; capienza: number }) {
  const oltre = persone > capienza;
  const pct = capienza > 0 ? Math.min(100, (persone / capienza) * 100) : 100;
  return (
    <div role="progressbar" aria-valuemin={0} aria-valuemax={capienza} aria-valuenow={persone} aria-label="Capienza" className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
      <div className={oltre ? "h-full bg-red-600" : "h-full bg-accento"} style={{ width: `${pct}%` }} />
    </div>
  );
}

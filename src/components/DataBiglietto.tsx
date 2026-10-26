import { partiData } from "@/lib/calcoli";

// La data come un biglietto: giorno grande, giorno della settimana e mese, ora. `piena`: fondo nel colore principale.
export function DataBiglietto({ dataOra, piena = false }: { dataOra: string; piena?: boolean }) {
  const d = partiData(new Date(dataOra));
  return (
    <span className={`grid w-16 shrink-0 rounded-md py-1.5 text-center leading-none ${piena ? "bg-accent text-on-accent print:bg-transparent print:text-ink" : "bg-surface-sunken"}`}>
      <span className="text-[26px] font-semibold tracking-tight tabular-nums">{d.giorno}</span>
      <span className={`mt-1.5 text-[13px] ${piena ? "opacity-85" : "text-ink-muted"}`}>{d.settimana} {d.mese}</span>
      <span className="mt-1 text-[13px] font-medium tabular-nums">{d.ora}</span>
    </span>
  );
}

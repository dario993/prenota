import { BarraCapienza } from "@/components/BarraCapienza";
import {
  riepilogoEvento, formattaEuro, NOMI_RISTORANTI, NOMI_PASTI, RISTORANTI, PASTI, type Prenotazione,
} from "@/lib/calcoli";

export function Riepilogo({ prenotazioni, capienza }: { prenotazioni: Prenotazione[]; capienza: number }) {
  const r = riepilogoEvento(prenotazioni, capienza);
  const tipi = [["Adulti", r.perTipo.adulti], ["Ridotti", r.perTipo.ridotti], ["Bambini", r.perTipo.bambini],
    ["Pacchetti", r.perTipo.pacchetti], ["Omaggi", r.perTipo.omaggi]] as const;
  return (
    <section aria-label="Riepilogo" className="rounded-lg border border-gray-200 bg-white p-4 text-sm">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-2xl font-semibold" data-testid="persone">{r.persone}/{r.capienza}</span>
        <span className={r.postiLiberi < 0 ? "font-semibold text-red-600" : "text-gray-600"} data-testid="liberi">
          Posti liberi: {r.postiLiberi}
        </span>
      </div>
      <BarraCapienza persone={r.persone} capienza={r.capienza} />
      <dl className="mt-3 grid grid-cols-5 gap-1 text-center">
        {tipi.map(([n, v]) => (
          <div key={n}><dt className="text-[11px] text-gray-500">{n}</dt><dd className="font-semibold">{v}</dd></div>
        ))}
      </dl>
      {RISTORANTI.some((k) => r.ristoranti[k].PRANZO + r.ristoranti[k].CENA > 0) && (
        <div className="mt-3 border-t border-gray-100 pt-3">
          <h2 className="mb-1 font-semibold">Coperti</h2>
          {RISTORANTI.flatMap((k) => PASTI.filter((p) => r.ristoranti[k][p] > 0).map((p) => (
            <div key={k + p} className="flex justify-between"><span>{NOMI_RISTORANTI[k]} {NOMI_PASTI[p].toLowerCase()}</span><span>{r.ristoranti[k][p]}</span></div>
          )))}
        </div>
      )}
      <div className="mt-3 border-t border-gray-100 pt-3">
        <div className="flex justify-between"><span>Incasso teatro</span><b data-testid="teatro">{formattaEuro(r.incassoTeatro)}</b></div>
        <div className="flex justify-between"><span>Incasso ristorante</span><b data-testid="ristorante">{formattaEuro(r.incassoRistorante)}</b></div>
        {RISTORANTI.filter((k) => r.ristoranti[k].incasso > 0).map((k) => (
          <div key={k} className="flex justify-between pl-3 text-gray-600"><span>{NOMI_RISTORANTI[k]}</span><span>{formattaEuro(r.ristoranti[k].incasso)}</span></div>
        ))}
      </div>
    </section>
  );
}

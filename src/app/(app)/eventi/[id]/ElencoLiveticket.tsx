import { descriviBiglietti, formattaEuro, incassoTeatro, persone, type Tariffa, type PrezziPacchetto } from "@/lib/calcoli";
import type { Doppione } from "@/lib/doppioni";
import { EtichettaDoppioni } from "./EtichettaDoppioni";
import { vociLiveticket, type OrdineLiveticket } from "@/lib/liveticket";

const tel = (t: string) => `tel:${t.replace(/[^\d+]/g, "")}`;

// Sola lettura: un ordine = una riga (le voci per i calcoli sono una per ristorante/pasto, qui si riuniscono).
export function ElencoLiveticket({ ordini, doppioni, tariffe, prezzi }: { ordini: OrdineLiveticket[]; doppioni: Map<string, Doppione[]>; tariffe: Tariffa[]; prezzi: PrezziPacchetto }) {
  if (ordini.length === 0) return <p className="py-8 text-center text-ink-muted">Nessun biglietto LiveTicket per questo evento</p>;
  const righe = ordini.map((o) => {
    const voci = vociLiveticket(o, prezzi);
    return {
      o, persone: voci.reduce((s, v) => s + persone(v), 0), incasso: voci.reduce((s, v) => s + incassoTeatro(v), 0),
      biglietti: voci.map((v) => descriviBiglietti(v, tariffe)).filter(Boolean).join(" · "), posti: voci[0].posti,
    };
  });
  const totale = righe.reduce((s, r) => s + r.persone, 0);
  const anomalie = (o: OrdineLiveticket) => o.anomalie.length > 0 && (
    <ul className="mt-2 rounded-md bg-warning-soft p-2 text-caption text-ink">{o.anomalie.map((a) => <li key={a}>{a}</li>)}</ul>
  );
  return (
    <section aria-label="Ordini LiveTicket">
      <p className="mb-2 text-label font-normal text-ink-muted tabular-nums lg:text-right">
        {totale} persone in {ordini.length} {ordini.length === 1 ? "ordine" : "ordini"}
      </p>
      <ul className="lg:hidden">
        {righe.map(({ o, persone: n, incasso, biglietti, posti }) => (
          <li key={o.codice} className="border-b border-line bg-surface py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-0.5">
                <div className="font-semibold">{o.cognome_nome}</div>
                <div className="space-y-0.5 text-caption">
                  {o.telefono && <div><a href={tel(o.telefono)} className="tabular-nums underline decoration-line-control underline-offset-4">{o.telefono}</a></div>}
                  <div>{biglietti}</div>
                  {posti && <div><span className="text-ink-muted">Posti </span>{posti}</div>}
                  <div className="text-ink-muted tabular-nums">Incasso teatro {formattaEuro(incasso)} · {o.codice}</div>
                </div>
              </div>
              <div className="text-[17px] font-semibold tabular-nums">{n}</div>
            </div>
            <EtichettaDoppioni doppioni={doppioni.get(o.codice)} />
            {anomalie(o)}
          </li>
        ))}
      </ul>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full text-[15px] leading-[22px]">
          <thead className="text-left text-[13px] text-ink-muted">
            <tr>{["Nome", "Telefono", "Biglietti", "Posti", "Incasso teatro", "Codice", "Persone"].map((c) => (
              <th key={c} scope="col" className={`px-3 py-2 font-normal ${c === "Persone" || c === "Incasso teatro" ? "text-right" : ""}`}>{c}</th>))}
            </tr>
          </thead>
          <tbody>
            {righe.map(({ o, persone: n, incasso, biglietti, posti }) => (
              <tr key={o.codice} className="border-t border-line bg-surface align-top">
                <td className="px-3 py-3 font-semibold">{o.cognome_nome}<EtichettaDoppioni doppioni={doppioni.get(o.codice)} />{anomalie(o)}</td>
                <td className="whitespace-nowrap px-3 py-3">{o.telefono && <a href={tel(o.telefono)} className="tabular-nums underline decoration-line-control underline-offset-4 hover:decoration-current">{o.telefono}</a>}</td>
                <td className="px-3 py-3 tabular-nums">{biglietti}</td>
                <td className="whitespace-nowrap px-3 py-3 tabular-nums">{posti}</td>
                <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums">{formattaEuro(incasso)}</td>
                <td className="whitespace-nowrap px-3 py-3 tabular-nums text-ink-muted">{o.codice}</td>
                <td className="px-3 py-3 text-right text-[17px] font-semibold tabular-nums">{n}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

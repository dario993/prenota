import Link from "next/link";
import { BarraTelefono } from "@/components/BarraTelefono";
import { TestaPagina } from "@/components/TestaPagina";
import { richiediAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { formattaEuro, incassoTeatro, partiData } from "@/lib/calcoli";
import { personeOrdine, vociLiveticket, type OrdineLiveticket } from "@/lib/liveticket";
import { btnSecondario, paginaAdmin } from "@/components/stili";
import { BottoneRiabbina } from "./BottoneRiabbina";

type Riga = Omit<OrdineLiveticket, "data_ora" | "ricevuto_il"> & {
  data_ora: Date | null; ricevuto_il: Date; prezzo_pacchetto_teatro: number | null; prezzo_pacchetto_ristorante: number | null;
};

// incasso teatro dell'ordine (senza commissione), lo stesso della tab LiveTicket dell'evento
const incasso = (o: Riga) =>
  vociLiveticket(o as unknown as OrdineLiveticket,
    { prezzo_pacchetto_teatro: o.prezzo_pacchetto_teatro ?? 0, prezzo_pacchetto_ristorante: o.prezzo_pacchetto_ristorante ?? 0 })
    .reduce((s, v) => s + incassoTeatro(v), 0);

const quando = (d: Date) => { const p = partiData(d); return `${p.lunga} ${p.ora}`; };

export default async function AdminLiveticket({ searchParams }: { searchParams: Promise<{ filtro?: string }> }) {
  await richiediAdmin();
  const { filtro } = await searchParams;
  const ordini = await sql<Riga[]>`
    select l.codice, l.cognome_nome, l.telefono, l.spettacolo, l.data_ora, l.evento_id, l.biglietti_dichiarati, l.biglietti,
      l.importo_pagato, l.anomalie, l.ricevuto_il, op.prezzo_pacchetto_teatro, op.prezzo_pacchetto_ristorante
    from liveticket_ordini l
    left join eventi e on e.id = l.evento_id
    left join opere op on op.id = e.opera_id
    order by l.data_ora desc nulls last, l.ricevuto_il desc`;
  const visibili = ordini.filter((o) =>
    filtro === "anomalie" ? o.anomalie.length > 0 : filtro === "senza-evento" ? o.evento_id === null : true);
  const filtri = [[undefined, "Tutti"], ["anomalie", "Con anomalie"], ["senza-evento", "Senza evento"]] as const;
  return (
    <main className={paginaAdmin}>
      <BarraTelefono titolo="LiveTicket" />
      <TestaPagina titolo="LiveTicket" sottotitolo="Ordini online letti da n8n." indietro={{ href: "/admin", testo: "Admin" }}>
        <BottoneRiabbina />
      </TestaPagina>
      <div className="flex flex-wrap gap-2">
        {filtri.map(([f, testo]) => (
          <Link key={testo} href={f ? `/admin/liveticket?filtro=${f}` : "/admin/liveticket"} aria-current={filtro === f || (!filtro && !f) ? "true" : undefined}
            className={`${btnSecondario} aria-[current=true]:bg-surface-sunken aria-[current=true]:font-semibold`}>{testo}</Link>
        ))}
      </div>
      {visibili.length === 0 ? <p className="py-6 text-center text-ink-muted">Nessun ordine</p> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-caption tabular-nums">
            <thead className="text-ink-muted">
              <tr>{["Codice", "Nome", "Data e ora", "Evento", "Persone", "Pacchetti", "Importo", "Anomalie", "Ricevuto il"].map((c) => (
                <th key={c} className="border-b border-line px-2 py-2 font-medium">{c}</th>))}</tr>
            </thead>
            <tbody>
              {visibili.map((o) => (
                <tr key={o.codice} className="border-b border-line align-top">
                  <td className="px-2 py-2">{o.codice}</td>
                  <td className="px-2 py-2 font-semibold">{o.cognome_nome}</td>
                  <td className="px-2 py-2">{o.data_ora ? quando(o.data_ora) : "—"}</td>
                  <td className="px-2 py-2">
                    {o.evento_id ? <Link href={`/eventi/${o.evento_id}?tab=liveticket`} className="underline">Apri evento</Link> : <span className="text-danger">Senza evento</span>}
                  </td>
                  <td className="px-2 py-2">{personeOrdine(o)}</td>
                  <td className="px-2 py-2">{o.biglietti.filter((b) => b.ristorante).length}</td>
                  <td className="px-2 py-2">
                    {formattaEuro(incasso(o))}
                    {o.importo_pagato !== null && <div className="text-ink-muted">pagato su LiveTicket {formattaEuro(o.importo_pagato)}</div>}
                  </td>
                  <td className="px-2 py-2 text-danger">{o.anomalie.map((a, i) => <div key={i}>{a}</div>)}</td>
                  <td className="px-2 py-2">{quando(o.ricevuto_il)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

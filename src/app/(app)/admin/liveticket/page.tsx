import Link from "next/link";
import { BarraTelefono } from "@/components/BarraTelefono";
import { TestaPagina } from "@/components/TestaPagina";
import { richiediAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { formattaEuro, partiData } from "@/lib/calcoli";
import { btnSecondario, paginaAdmin } from "@/components/stili";
import { BottoneRiabbina } from "./BottoneRiabbina";

type Riga = {
  codice: string; cognome_nome: string; data_ora: Date | null; evento_id: string | null; biglietti: { ristorante: string | null }[];
  importo_pagato: number | null; anomalie: string[]; ricevuto_il: Date;
};

const quando = (d: Date) => { const p = partiData(d); return `${p.lunga} ${p.ora}`; };

export default async function AdminLiveticket({ searchParams }: { searchParams: Promise<{ filtro?: string }> }) {
  await richiediAdmin();
  const { filtro } = await searchParams;
  const ordini = await sql<Riga[]>`
    select codice, cognome_nome, data_ora, evento_id, biglietti, importo_pagato, anomalie, ricevuto_il
    from liveticket_ordini order by data_ora desc nulls last, ricevuto_il desc`;
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
                  <td className="px-2 py-2">{o.biglietti.length}</td>
                  <td className="px-2 py-2">{o.biglietti.filter((b) => b.ristorante).length}</td>
                  <td className="px-2 py-2">{o.importo_pagato === null ? "—" : formattaEuro(o.importo_pagato)}</td>
                  <td className="px-2 py-2 text-danger">{o.anomalie.map((a) => <div key={a}>{a}</div>)}</td>
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

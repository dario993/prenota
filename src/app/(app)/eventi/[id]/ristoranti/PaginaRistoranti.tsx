"use client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Printer, Share2 } from "lucide-react";
import { getJson, SERVE_RETE, chiaveEvento } from "@/lib/query";
import {
  elencoRistorante, formattaDataOra, partiData, prezziPacchettoDi, testoElencoRistorante, NOMI_PASTI, NOMI_RISTORANTI, PASTI, RISTORANTI,
  type DettaglioEvento, type Pasto, type Ristorante,
} from "@/lib/calcoli";
import { vociLiveticket } from "@/lib/liveticket";
import { Stato } from "@/components/Stato";
import { btnSecondario } from "@/components/stili";
import { BarraTelefono } from "@/components/BarraTelefono";
import { TestaPagina } from "@/components/TestaPagina";

export function PaginaRistoranti({ id }: { id: string }) {
  const { data, isPending, error, fetchStatus } = useQuery({
    queryKey: chiaveEvento(id),
    queryFn: () => getJson<DettaglioEvento>(`/api/eventi/${id}`),
  });
  if (!data) {
    if (fetchStatus === "paused") return <Stato testo={SERVE_RETE} />;
    if (isPending) return <Stato testo="Caricamento…" />;
    return <Stato testo={error?.message ?? "Errore imprevisto, riprova"} nonTrovato />;
  }
  const { evento } = data;
  const lt = (data.liveticket ?? []).flatMap((o) => vociLiveticket(o, prezziPacchettoDi(evento))); // cache offline senza il campo
  const prenotazioni = [...data.prenotazioni, ...lt];
  const dataOra = new Date(evento.data_ora);
  const sezioni = RISTORANTI.flatMap((r) => PASTI.map((p) => ({ r, p, lista: elencoRistorante(prenotazioni, r, p) })))
    .filter((s) => s.lista.length > 0);

  async function condividi(r: Ristorante, p: Pasto) {
    const text = testoElencoRistorante({ ristorante: r, pasto: p, dataOra, titolo: evento.titolo, prenotazioni });
    const title = `${NOMI_RISTORANTI[r]} – ${NOMI_PASTI[p]} – ${evento.titolo}`;
    try {
      if (typeof navigator.share === "function") await navigator.share({ title, text });
      else {
        await navigator.clipboard.writeText(text);
        toast.success("Copiato");
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      toast.error("Impossibile condividere l'elenco");
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-6 lg:px-6 print:max-w-none print:p-0 print:text-black">
      <BarraTelefono titolo={`Ristoranti · ${evento.titolo}`} />
      <div className="print:max-w-none">
        <div className="mb-6">
          <TestaPagina titolo="Ristoranti" indietro={{ href: `/eventi/${id}`, testo: `${evento.titolo} · ${partiData(dataOra).lunga}` }}
            sottotitolo={`${evento.titolo} · ${formattaDataOra(dataOra)} · ${evento.locale}`}>
            {sezioni.length > 0 && (
              <button type="button" className={btnSecondario} onClick={() => window.print()}>
                <Printer size={16} aria-hidden />Stampa
              </button>
            )}
          </TestaPagina>
        </div>
        {sezioni.length === 0 && <p className="py-8 text-center text-ink-muted">Nessun pacchetto ristorante per questo evento</p>}
        <div className="grid items-start gap-6 lg:grid-cols-2 print:block print:space-y-4">
          {sezioni.map(({ r, p, lista }) => (
            <section key={r + p}
              className="rounded-lg border border-line bg-surface p-5 print:break-inside-avoid print:border-black print:bg-transparent">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-body font-semibold">{NOMI_RISTORANTI[r]} – {NOMI_PASTI[p]}</h2>
                  <p className="text-caption text-ink-muted print:text-black">{formattaDataOra(dataOra)} · {evento.titolo}</p>
                  <p className="mt-2 flex items-baseline gap-2"><span className="text-[34px] font-medium leading-[38px] tracking-tight text-accent tabular-nums print:text-black">{lista.reduce((s, x) => s + x.pacchetti, 0)}</span><span className="text-ink-muted">coperti</span></p>
                </div>
                <button type="button" className={`${btnSecondario} print:hidden`} aria-label={`Condividi ${NOMI_RISTORANTI[r]} ${NOMI_PASTI[p]}`} onClick={() => condividi(r, p)}>
                  <Share2 size={16} aria-hidden />Condividi
                </button>
              </div>
              <ul className="divide-y divide-line border-t border-line print:divide-black">
                {lista.map((x) => (
                  <li key={x.id} className="flex justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="font-semibold">{x.cognome_nome}{x.liveticket && <span className="ml-2 text-caption font-normal text-ink-muted print:text-black">LiveTicket</span>}</p>
                      {x.telefono && <p className="text-caption text-ink-muted print:text-black">{x.telefono}</p>}
                      {x.note && <p className="text-caption text-ink-muted print:text-black">{x.note}</p>}
                    </div>
                    <span className="font-semibold tabular-nums">{x.pacchetti}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}

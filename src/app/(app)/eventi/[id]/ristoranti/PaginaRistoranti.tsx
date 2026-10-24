"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, Printer, Share2 } from "lucide-react";
import { getJson, SERVE_RETE, chiaveEvento } from "@/lib/query";
import {
  elencoRistorante, formattaDataOra, testoElencoRistorante, NOMI_PASTI, NOMI_RISTORANTI, PASTI, RISTORANTI,
  type DettaglioEvento, type Pasto, type Ristorante,
} from "@/lib/calcoli";
import { Stato } from "@/components/Stato";
import { btnSecondario } from "@/components/stili";

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
  const { evento, prenotazioni } = data;
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
      <div className="max-w-160 print:max-w-none">
        <Link href={`/eventi/${id}`} className="inline-flex min-h-11 items-center gap-1 text-accent hover:underline print:hidden">
          <ChevronLeft size={20} aria-hidden />{evento.titolo}
        </Link>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-title lg:text-display">Ristoranti</h1>
            <p className="mt-1 text-caption text-ink-muted print:text-black">{evento.titolo} · {formattaDataOra(dataOra)}</p>
          </div>
          {sezioni.length > 0 && (
            <button type="button" className={`${btnSecondario} print:hidden`} onClick={() => window.print()}>
              <Printer size={20} aria-hidden />Stampa
            </button>
          )}
        </div>
        {sezioni.length === 0 && <p className="py-8 text-center text-ink-muted">Nessun pacchetto ristorante per questo evento</p>}
        <div className="space-y-4">
          {sezioni.map(({ r, p, lista }) => (
            <section key={r + p}
              className="rounded-lg border border-line bg-surface p-4 print:break-inside-avoid print:border-black print:bg-transparent">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-heading">{NOMI_RISTORANTI[r]} – {NOMI_PASTI[p]}</h2>
                  <p className="text-caption text-ink-muted print:text-black">{formattaDataOra(dataOra)} · {evento.titolo}</p>
                  <p className="mt-1 text-figure-sm tabular-nums">{lista.reduce((s, x) => s + x.pacchetti, 0)} coperti</p>
                </div>
                <button type="button" className={`${btnSecondario} print:hidden`} aria-label={`Condividi ${NOMI_RISTORANTI[r]} ${NOMI_PASTI[p]}`} onClick={() => condividi(r, p)}>
                  <Share2 size={20} aria-hidden />Condividi
                </button>
              </div>
              <ul className="divide-y divide-line print:divide-black">
                {lista.map((x) => (
                  <li key={x.id} className="flex justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="font-semibold">{x.cognome_nome}</p>
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

"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getJson } from "@/lib/query";
import {
  elencoRistorante, formattaDataOra, testoElencoRistorante, NOMI_PASTI, NOMI_RISTORANTI, PASTI, RISTORANTI,
  type DettaglioEvento, type Pasto, type Ristorante,
} from "@/lib/calcoli";

const btn = "rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 print:hidden";

export function PaginaRistoranti({ id }: { id: string }) {
  const { data, isPending, error } = useQuery({
    queryKey: ["evento", id],
    queryFn: () => getJson<DettaglioEvento>(`/api/eventi/${id}`),
  });
  if (!data) {
    return (
      <main className="mx-auto max-w-3xl p-4 lg:p-8">
        <p className="text-gray-500">{isPending ? "Caricamento…" : (error?.message ?? "Errore imprevisto, riprova")}</p>
      </main>
    );
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
        toast.success("Elenco copiato");
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      toast.error("Impossibile condividere l'elenco");
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-4 lg:p-8 print:max-w-none print:p-0 print:text-black">
      <Link href={`/eventi/${id}`} className="text-sm text-accento hover:underline print:hidden">← {evento.titolo}</Link>
      <div className="mb-4 mt-2 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold lg:text-2xl">Ristoranti</h1>
          <p className="text-sm text-gray-600 print:text-black">{evento.titolo} · {formattaDataOra(dataOra)}</p>
        </div>
        {sezioni.length > 0 && <button type="button" className={btn} onClick={() => window.print()}>Stampa</button>}
      </div>
      {sezioni.length === 0 && <p className="text-gray-500">Nessun pacchetto ristorante per questo evento</p>}
      <div className="space-y-4">
        {sezioni.map(({ r, p, lista }) => (
          <section key={r + p} className="rounded-lg border border-gray-200 p-4 print:break-inside-avoid print:border-black">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="font-semibold">
                {NOMI_RISTORANTI[r]} – {NOMI_PASTI[p]} · {lista.reduce((s, x) => s + x.pacchetti, 0)} coperti
              </h2>
              <button type="button" className={btn} onClick={() => condividi(r, p)}>Condividi</button>
            </div>
            <ul className="divide-y divide-gray-100 print:divide-gray-400">
              {lista.map((x) => (
                <li key={x.id} className="flex justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="font-medium">{x.cognome_nome}</p>
                    {x.telefono && <p className="text-sm text-gray-600 print:text-black">{x.telefono}</p>}
                    {x.note && <p className="text-sm text-gray-600 print:text-black">{x.note}</p>}
                  </div>
                  <span className="font-semibold">{x.pacchetti}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}

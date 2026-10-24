"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { getJson, useInAttesa, useOnline } from "@/lib/query";
import { formattaDataOra, prezziDi, type DettaglioEvento } from "@/lib/calcoli";
import { Riepilogo } from "./Riepilogo";
import { ElencoPrenotazioni } from "./ElencoPrenotazioni";

export function PaginaEvento({ id }: { id: string }) {
  const { data, isPending, error } = useQuery({
    queryKey: ["evento", id],
    queryFn: () => getJson<DettaglioEvento>(`/api/eventi/${id}`),
  });
  const inAttesa = useInAttesa(id);
  const online = useOnline();
  const nuova = `/eventi/${id}/prenotazioni/nuova`;
  // mette in cache (service worker) questa pagina e "nuova prenotazione": aperte con la navigazione interna di
  // Next non passano come pagine intere, ma senza rete Next ripiega su una navigazione normale servita dalla cache
  useEffect(() => {
    if (navigator.onLine) for (const u of [`/eventi/${id}`, nuova]) fetch(u).catch(() => {});
  }, [id, nuova]);
  if (!data) {
    return (
      <main className="mx-auto max-w-7xl p-4 lg:p-8">
        <p className="text-gray-500">{isPending ? "Caricamento…" : (error?.message ?? "Errore imprevisto, riprova")}</p>
      </main>
    );
  }
  const { evento } = data;
  // in coda sul telefono: prezzi attuali dell'opera (il server li fissa all'invio); escluse quelle già arrivate
  const arrivate = new Set(data.prenotazioni.map((p) => p.id));
  const coda = inAttesa.filter((p) => !arrivate.has(p.id)).map((p) => ({ ...p, ...prezziDi(evento), in_attesa: true }));
  const prenotazioni = [...data.prenotazioni, ...coda];
  // le non inviate (errore) restano in elenco ma non contano nel riepilogo: sul server non ci sono
  const valide = prenotazioni.filter((p) => !("stato" in p) || p.stato === "pending");
  return (
    <main className="mx-auto max-w-7xl p-4 lg:p-8">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold lg:text-2xl">{evento.titolo}</h1>
          <p className="text-sm text-gray-600">{formattaDataOra(new Date(evento.data_ora))} · {evento.locale}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/eventi/${id}/ristoranti`} className="text-accento hover:underline">Ristoranti</Link>
          <Link href={nuova} className="hidden rounded-lg bg-accento px-4 py-2 font-medium text-white lg:block">+ Nuova prenotazione</Link>
        </div>
      </div>
      {coda.some((p) => p.stato === "pending") && (
        <p role="status" className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          {online ? "Invio delle prenotazioni in attesa…" : "Salvate sul telefono, verranno inviate quando torna la rete."}
        </p>
      )}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-start">
        <div className="xl:order-2 xl:sticky xl:top-4"><Riepilogo prenotazioni={valide} capienza={evento.capienza} /></div>
        <div className="min-w-0 xl:order-1"><ElencoPrenotazioni eventoId={id} prenotazioni={prenotazioni} /></div>
      </div>
      <Link href={nuova} aria-label="Nuova prenotazione"
        className="fixed bottom-20 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-accento text-3xl text-white shadow-lg lg:hidden"><span aria-hidden="true">+</span></Link>
    </main>
  );
}

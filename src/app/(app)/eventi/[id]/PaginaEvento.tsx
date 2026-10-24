"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getJson } from "@/lib/query";
import { formattaDataOra, type DettaglioEvento } from "@/lib/calcoli";
import { Riepilogo } from "./Riepilogo";
import { ElencoPrenotazioni } from "./ElencoPrenotazioni";

export function PaginaEvento({ id }: { id: string }) {
  const { data, isPending, error } = useQuery({
    queryKey: ["evento", id],
    queryFn: () => getJson<DettaglioEvento>(`/api/eventi/${id}`),
  });
  if (!data) {
    return (
      <main className="mx-auto max-w-7xl p-4 lg:p-8">
        <p className="text-gray-500">{isPending ? "Caricamento…" : (error?.message ?? "Errore imprevisto, riprova")}</p>
      </main>
    );
  }
  const { evento, prenotazioni } = data;
  const nuova = `/eventi/${id}/prenotazioni/nuova`;
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
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-start">
        <div className="xl:order-2 xl:sticky xl:top-4"><Riepilogo prenotazioni={prenotazioni} capienza={evento.capienza} /></div>
        <div className="min-w-0 xl:order-1"><ElencoPrenotazioni eventoId={id} prenotazioni={prenotazioni} /></div>
      </div>
      <Link href={nuova} aria-label="Nuova prenotazione"
        className="fixed bottom-20 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-accento text-3xl text-white shadow-lg lg:hidden"><span aria-hidden="true">+</span></Link>
    </main>
  );
}

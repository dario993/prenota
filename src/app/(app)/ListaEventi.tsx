"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getJson } from "@/lib/query";
import { formattaDataOra, type EventoLista } from "@/lib/calcoli";
import { BarraCapienza } from "@/components/BarraCapienza";

export function ListaEventi() {
  const { data, isPending, isError } = useQuery({ queryKey: ["eventi"], queryFn: () => getJson<EventoLista[]>("/api/eventi") });
  if (!data) {
    return <p className="text-gray-500">{isPending ? "Caricamento…" : isError ? "Impossibile caricare gli eventi" : ""}</p>;
  }
  if (data.length === 0) return <p className="text-gray-500">Nessun evento in programma</p>;
  return (
    <ul className="grid gap-3 lg:grid-cols-2 lg:gap-4">
      {data.map((e) => (
        <li key={e.id}>
          <Link href={`/eventi/${e.id}`} className="block rounded-lg border border-gray-200 bg-white p-4 hover:border-accento">
            <div className="text-lg font-semibold">{e.titolo}</div>
            <div className="text-sm text-gray-600">{formattaDataOra(new Date(e.data_ora))}</div>
            <div className="mb-3 text-sm text-gray-600">{e.locale}</div>
            <BarraCapienza persone={e.persone} capienza={e.capienza} />
            <div className="mt-1 text-right text-sm text-gray-600">{e.persone}/{e.capienza}</div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

"use client";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getJson, SERVE_RETE } from "@/lib/query";
import { formattaDataOra, type EventoLista } from "@/lib/calcoli";
import { BarraCapienza } from "@/components/BarraCapienza";

export function ListaEventi({ passati = false }: { passati?: boolean }) {
  const { data, isPending, isError, fetchStatus } = useQuery({
    queryKey: passati ? ["eventi", "passati"] : ["eventi"],
    queryFn: () => getJson<EventoLista[]>(passati ? "/api/eventi?passati=1" : "/api/eventi"),
  });
  if (!data) {
    const testo = fetchStatus === "paused" ? SERVE_RETE : isPending ? "Caricamento…" : isError ? "Impossibile caricare gli eventi" : "";
    return <p className="text-gray-500">{testo}</p>;
  }
  if (data.length === 0) return <p className="text-gray-500">{passati ? "Nessun evento passato" : "Nessun evento in programma"}</p>;
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

// Chiusa all'inizio: gli eventi passati si caricano solo quando la si apre.
export function EventiPassati() {
  const [aperta, setAperta] = useState(false);
  return (
    <details className="mt-8" onToggle={(e) => setAperta(e.currentTarget.open)}>
      <summary className="mb-4 cursor-pointer py-2 text-lg font-semibold">Eventi passati</summary>
      {aperta && <ListaEventi passati />}
    </details>
  );
}

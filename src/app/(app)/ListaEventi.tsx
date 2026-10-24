"use client";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { getJson, SERVE_RETE } from "@/lib/query";
import { formattaDataOra, type EventoLista } from "@/lib/calcoli";
import { BarraCapienza } from "@/components/BarraCapienza";

const griglia = "grid gap-3 lg:grid-cols-2 lg:gap-4";

export function ListaEventi({ passati = false }: { passati?: boolean }) {
  const { data, isPending, isError, fetchStatus } = useQuery({
    queryKey: passati ? ["eventi", "passati"] : ["eventi"],
    queryFn: () => getJson<EventoLista[]>(passati ? "/api/eventi?passati=1" : "/api/eventi"),
  });
  if (!data) {
    if (isPending && fetchStatus !== "paused")
      return (
        <ul className={griglia} aria-label="Caricamento…">
          {[0, 1, 2].map((i) => <li key={i} className="h-32 animate-pulse rounded-lg bg-surface-sunken" />)}
        </ul>
      );
    const testo = fetchStatus === "paused" ? SERVE_RETE : isError ? "Impossibile caricare gli eventi" : "";
    return <p className="py-6 text-center text-ink-muted">{testo}</p>;
  }
  if (data.length === 0)
    return <p className="py-6 text-center text-ink-muted">{passati ? "Nessun evento passato" : "Nessun evento in programma"}</p>;
  return (
    <ul className={griglia}>
      {data.map((e) => {
        const oltre = !passati && e.persone > e.capienza;
        return (
          <li key={e.id}>
            <Link href={`/eventi/${e.id}`}
              className="block rounded-lg border border-line bg-surface p-4 transition-colors duration-150 hover:border-line-control">
              <div className={`text-heading ${passati ? "text-ink-muted" : ""}`}>{e.titolo}</div>
              <div className="mt-1 text-caption text-ink-muted">{formattaDataOra(new Date(e.data_ora))} · {e.locale}</div>
              <div className="mb-2 mt-4 flex items-baseline justify-between gap-2">
                <span className={`text-figure-sm tabular-nums ${oltre ? "text-warning" : passati ? "text-ink-muted" : ""}`}>
                  {e.persone} / {e.capienza}
                </span>
                {oltre && <span className="text-label text-warning">oltre capienza</span>}
              </div>
              <BarraCapienza persone={e.persone} capienza={e.capienza} spenta={passati} />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

// Chiusa all'inizio: gli eventi passati si caricano solo quando la si apre.
export function EventiPassati() {
  const [aperta, setAperta] = useState(false);
  return (
    <details className="group mt-8" onToggle={(e) => setAperta(e.currentTarget.open)}>
      <summary className="mb-4 flex min-h-11 cursor-pointer list-none items-center gap-2 text-heading [&::-webkit-details-marker]:hidden">
        <ChevronDown size={20} aria-hidden className="transition-transform duration-150 group-open:rotate-180" />
        Eventi passati
      </summary>
      {aperta && <ListaEventi passati />}
    </details>
  );
}

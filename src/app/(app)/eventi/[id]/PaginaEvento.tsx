"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { CloudOff, Plus, UtensilsCrossed } from "lucide-react";
import { getJson, SERVE_RETE, useInAttesa, useOnline, chiaveEvento } from "@/lib/query";
import { formattaDataOra, prezziPacchettoDi, righeConPrezzi, type DettaglioEvento } from "@/lib/calcoli";
import { Stato } from "@/components/Stato";
import { btnPrimario, btnSecondario } from "@/components/stili";
import { Riepilogo } from "./Riepilogo";
import { ElencoPrenotazioni } from "./ElencoPrenotazioni";

export function PaginaEvento({ id }: { id: string }) {
  const { data, isPending, error, fetchStatus } = useQuery({
    queryKey: chiaveEvento(id),
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
    if (fetchStatus === "paused") return <Stato testo={SERVE_RETE} />;
    if (isPending) return <Stato testo="Caricamento…" />;
    return <Stato testo={error?.message ?? "Errore imprevisto, riprova"} nonTrovato />;
  }
  const { evento } = data;
  // in coda sul telefono: prezzi attuali dell'opera (il server li fissa all'invio); escluse quelle già arrivate
  const arrivate = new Set(data.prenotazioni.map((p) => p.id));
  const coda = inAttesa.filter((p) => !arrivate.has(p.id)).map((p) => ({ ...p, righe: righeConPrezzi(p.righe, evento.tariffe), ...prezziPacchettoDi(evento), in_attesa: true }));
  const prenotazioni = [...data.prenotazioni, ...coda];
  // le non inviate (errore) restano in elenco ma non contano nel riepilogo: sul server non ci sono; le annullate neppure
  const valide = prenotazioni.filter((p) => ("stato" in p ? p.stato === "pending" : p.contrassegno !== "annullato"));
  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-6 lg:px-6 print:max-w-none print:p-0">
      {coda.some((p) => p.stato === "pending") && (
        <p role="status" className="sticky top-0 z-20 mb-4 flex print:hidden items-center gap-3 rounded-md bg-warning-soft p-3 text-ink">
          <CloudOff size={20} aria-hidden className="shrink-0 text-warning" />
          {online ? "Invio delle prenotazioni in attesa…" : "Salvate sul telefono, verranno inviate quando torna la rete"}
        </p>
      )}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-title lg:text-display">{evento.titolo}</h1>
          <p className="mt-1 text-caption text-ink-muted print:text-ink">{formattaDataOra(new Date(evento.data_ora))} · {evento.locale}</p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <Link href={`/eventi/${id}/ristoranti`} className={btnSecondario}>
            <UtensilsCrossed size={20} aria-hidden />Ristoranti
          </Link>
          <Link href={nuova} className={`${btnPrimario} hidden lg:inline-flex`}>
            <Plus size={20} aria-hidden />Nuova prenotazione
          </Link>
        </div>
      </div>
      <div className="space-y-6">
        <div className="print:hidden"><Riepilogo prenotazioni={valide} capienza={evento.capienza} tariffe={evento.tariffe} /></div>
        <ElencoPrenotazioni eventoId={id} prenotazioni={prenotazioni} tariffe={evento.tariffe} />
      </div>
      {/* telefono: azione principale in basso, sopra la navigazione, raggiungibile col pollice */}
      <Link href={nuova} aria-label="Nuova prenotazione"
        className="fixed bottom-[calc(64px+env(safe-area-inset-bottom)+16px)] right-4 z-10 inline-flex size-14 items-center justify-center rounded-full bg-accent text-on-accent shadow-overlay transition-colors duration-150 hover:bg-accent-hover active:bg-accent-hover lg:hidden print:hidden">
        <Plus size={28} aria-hidden />
      </Link>
    </main>
  );
}

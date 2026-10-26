"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ChevronLeft, CloudOff, Plus, Printer, UtensilsCrossed } from "lucide-react";
import { getJson, SERVE_RETE, useInAttesa, useOnline, chiaveEvento } from "@/lib/query";
import { partiData, persone, prezziPacchettoDi, righeConPrezzi, type DettaglioEvento } from "@/lib/calcoli";
import { vociLiveticket } from "@/lib/liveticket";
import { possibiliDoppioni } from "@/lib/doppioni";
import { Stato } from "@/components/Stato";
import { DataBiglietto } from "@/components/DataBiglietto";
import { BarraTelefono } from "@/components/BarraTelefono";
import { btnPrimario, btnSecondario } from "@/components/stili";
import { Riepilogo } from "./Riepilogo";
import { ElencoPrenotazioni } from "./ElencoPrenotazioni";
import { ElencoLiveticket } from "./ElencoLiveticket";

type Tab = "prenotazioni" | "liveticket";

export function PaginaEvento({ id, solaLettura, tabIniziale }: { id: string; solaLettura: boolean; tabIniziale: Tab }) {
  const [tab, setTab] = useState<Tab>(tabIniziale);
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
  const ordini = data.liveticket ?? []; // la cache offline di prima di LiveTicket non ha il campo
  const lt = ordini.flatMap((o) => vociLiveticket(o, prezziPacchettoDi(evento)));
  const doppioni = possibiliDoppioni([...valide, ...lt]); // le in coda sul telefono partecipano, le annullate no
  const scegli = (t: Tab) => {
    setTab(t);
    history.replaceState(null, "", t === "liveticket" ? "?tab=liveticket" : location.pathname); // link condivisibile
  };
  const schede = [["prenotazioni", `Prenotazioni (${prenotazioni.length})`], ["liveticket", `LiveTicket (${lt.reduce((s, v) => s + persone(v), 0)} persone)`]] as const;
  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-6 lg:px-6 print:max-w-none print:p-0">
      {/* telefono: in alto marchio, titolo e «Nuova» (come nella proposta grafica) */}
      <BarraTelefono titolo={evento.titolo}>
        {!solaLettura && <Link href={nuova} className={`${btnPrimario} !h-10 !px-3 !text-label`}><Plus size={16} aria-hidden />Nuova</Link>}
      </BarraTelefono>
      {coda.some((p) => p.stato === "pending") && (
        <p role="status" className="sticky top-14 z-20 mb-4 lg:top-0 flex print:hidden items-center gap-3 rounded-md bg-warning-soft p-3 text-ink">
          <CloudOff size={20} aria-hidden className="shrink-0 text-warning" />
          {online ? "Invio delle prenotazioni in attesa…" : "Salvate sul telefono, verranno inviate quando torna la rete"}
        </p>
      )}
      <Link href="/" className="-mt-1 mb-3 inline-flex min-h-11 items-center gap-1 text-label font-normal text-ink-muted hover:text-ink lg:min-h-0 print:hidden">
        <ChevronLeft size={16} aria-hidden />Eventi
      </Link>
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <DataBiglietto dataOra={evento.data_ora} piena />
        <div className="min-w-0 flex-[1_1_220px]">
          <h1 className="text-title">{evento.titolo}</h1>
          <p className="mt-0.5 text-[15px] leading-[22px] first-letter:uppercase">{partiData(new Date(evento.data_ora)).lunga}, {partiData(new Date(evento.data_ora)).ora} · {evento.locale}</p>
        </div>
        {/* come nella proposta: Ristoranti, Stampa e Nuova prenotazione in testa; su telefono solo Ristoranti (Nuova è in alto) */}
        <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto print:hidden">
          <Link href={`/eventi/${id}/ristoranti`} className={`${btnSecondario} flex-1 sm:flex-none`}>
            <UtensilsCrossed size={16} aria-hidden />Ristoranti
          </Link>
          {prenotazioni.length > 0 && (
            <button type="button" className={`${btnSecondario} max-lg:hidden`} onClick={() => window.print()}>
              <Printer size={16} aria-hidden />Stampa
            </button>
          )}
          {!solaLettura && (
            <Link href={nuova} className={`${btnPrimario} max-lg:hidden`}>
              <Plus size={16} aria-hidden />Nuova prenotazione
            </Link>
          )}
        </div>
      </div>
      <div className="space-y-10">
        <div className="print:hidden"><Riepilogo prenotazioni={valide} tutte={prenotazioni} liveticket={lt} doppioni={doppioni.size} capienza={evento.capienza} tariffe={evento.tariffe} prezzi={prezziPacchettoDi(evento)} /></div>
        <div>
          <div role="tablist" aria-label="Elenco" className="-mb-px flex gap-6 border-b border-line print:hidden">
            {schede.map(([t, testo]) => (
              <button key={t} type="button" role="tab" id={`tab-${t}`} aria-selected={tab === t} onClick={() => scegli(t)}
                className={`-mb-px min-h-11 border-b-2 py-2.5 text-label ${tab === t ? "border-ink font-semibold" : "border-transparent font-normal text-ink-muted hover:text-ink"}`}>{testo}</button>
            ))}
          </div>
          <div role="tabpanel" id={`pannello-${tab}`} aria-labelledby={`tab-${tab}`} className="pt-5">
            {tab === "prenotazioni"
              ? <ElencoPrenotazioni eventoId={id} prenotazioni={prenotazioni} doppioni={doppioni} tariffe={evento.tariffe} solaLettura={solaLettura} />
              : <ElencoLiveticket ordini={ordini} doppioni={doppioni} tariffe={evento.tariffe} prezzi={prezziPacchettoDi(evento)} />}
          </div>
        </div>
      </div>
    </main>
  );
}

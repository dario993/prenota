"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRightLeft, ChevronRight, X } from "lucide-react";
import { btnPrimario, btnSecondario } from "@/components/stili";
import { DataBiglietto } from "@/components/DataBiglietto";
import { chiaveEvento, getJson } from "@/lib/query";
import { dateSpostamento, partiData, type EventoLista } from "@/lib/calcoli";
import { spostaPrenotazione } from "./azioni";

const quando = (dataOra: string) => { const d = partiData(new Date(dataOra)); return `${d.lunga}, ${d.ora}`; };

// Pulsante e popup (<dialog> nativo): le altre date future della stessa opera; scelta una data si conferma nel popup.
export function SpostaPrenotazione({ evento, prenotazione, disabled }: {
  evento: { id: string; opera_id: string };
  prenotazione: { id: string; cognome_nome: string; persone: number };
  disabled: boolean;
}) {
  const router = useRouter();
  const qc = useQueryClient();
  const dialogo = useRef<HTMLDialogElement>(null);
  const [scelta, setScelta] = useState<EventoLista | null>(null);
  const [invio, setInvio] = useState(false);
  const { data, error } = useQuery({ queryKey: ["eventi"], queryFn: () => getJson<EventoLista[]>("/api/eventi") });
  const date = data && dateSpostamento(data, evento);

  const apri = () => { setScelta(null); dialogo.current?.showModal(); };
  async function sposta(e: EventoLista) {
    setInvio(true);
    const r = await spostaPrenotazione(prenotazione.id, e.id).catch(() => ({ errore: "Rete non disponibile" }));
    setInvio(false);
    if ("errore" in r) { toast.error(r.errore); return; }
    dialogo.current?.close();
    toast.success(`Prenotazione spostata a ${quando(e.data_ora)}`);
    for (const k of [chiaveEvento(evento.id), chiaveEvento(e.id), ["eventi"]]) qc.invalidateQueries({ queryKey: k });
    router.push(`/eventi/${e.id}`);
  }

  return (
    <>
      <button type="button" onClick={apri} disabled={disabled} className={btnSecondario}>
        <ArrowRightLeft size={16} aria-hidden />Sposta prenotazione
      </button>
      {/* tocco sul fondo (fuori dal riquadro) = chiudi */}
      <dialog ref={dialogo} aria-labelledby="t-sposta" onClick={(ev) => ev.target === dialogo.current && !invio && dialogo.current?.close()}
        className="m-auto w-[min(calc(100%-32px),440px)] rounded-lg border border-line bg-surface p-0 text-ink backdrop:bg-black/50">
        <div className="flex items-start justify-between gap-3 border-b border-line p-5">
          <div className="min-w-0">
            <h2 id="t-sposta" className="text-body font-semibold">Sposta prenotazione</h2>
            <p className="text-label font-normal text-ink-muted">
              {prenotazione.cognome_nome} · {prenotazione.persone} {prenotazione.persone === 1 ? "persona" : "persone"}
            </p>
          </div>
          <button type="button" onClick={() => dialogo.current?.close()} disabled={invio} aria-label="Chiudi"
            className="-m-2 grid size-11 shrink-0 place-items-center rounded-md text-ink-muted hover:text-ink">
            <X size={20} aria-hidden />
          </button>
        </div>
        {scelta ? (
          <div className="space-y-5 p-5">
            <p>
              Spostare la prenotazione di <strong>{prenotazione.cognome_nome}</strong> a{" "}
              <strong>{quando(scelta.data_ora)}</strong>?
            </p>
            <div className="flex flex-wrap justify-end gap-3">
              <button type="button" onClick={() => setScelta(null)} disabled={invio} className={btnSecondario}>Annulla</button>
              <button type="button" onClick={() => sposta(scelta)} disabled={invio} className={btnPrimario}>
                {invio ? "Invio…" : "Sposta"}
              </button>
            </div>
          </div>
        ) : !date ? (
          <p className="p-5 text-label text-ink-muted">{error ? error.message : "Caricamento…"}</p>
        ) : date.length === 0 ? (
          <p className="p-5 text-label text-ink-muted">Nessun&apos;altra data per questa opera.</p>
        ) : (
          <ul className="max-h-[60vh] divide-y divide-line overflow-y-auto">
            {date.map((e) => {
              const liberi = e.capienza - e.persone;
              return (
                <li key={e.id}>
                  <button type="button" onClick={() => setScelta(e)}
                    className="flex w-full items-center gap-3.5 px-5 py-3 text-left hover:bg-surface-sunken">
                    <DataBiglietto dataOra={e.data_ora} />
                    <span className="min-w-0 flex-1 text-label font-normal tabular-nums">
                      <span className="block font-medium">{e.persone} / {e.capienza} occupati</span>
                      {/* oltre capienza: avvisa, non blocca */}
                      <span className={liberi < 0 ? "font-medium text-warning" : "text-ink-muted"}>
                        {liberi < 0 ? `${-liberi} oltre capienza` : `${liberi} ${liberi === 1 ? "posto libero" : "posti liberi"}`}
                      </span>
                    </span>
                    <ChevronRight size={18} aria-hidden className="shrink-0 text-ink-muted" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </dialog>
    </>
  );
}

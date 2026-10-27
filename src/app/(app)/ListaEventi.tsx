"use client";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getJson, SERVE_RETE, chiaveEvento } from "@/lib/query";
import { partiData, riepilogoEvento, type DettaglioEvento, type EventoLista } from "@/lib/calcoli";
import { BarraCapienza } from "@/components/BarraCapienza";
import { DataBiglietto } from "@/components/DataBiglietto";
import { NonInviate } from "@/components/InAttesa";

const useEventi = (passati: boolean) => useQuery({
  queryKey: passati ? ["eventi", "passati"] : ["eventi"],
  queryFn: () => getJson<EventoLista[]>(passati ? "/api/eventi?passati=1" : "/api/eventi"),
});

const scheda = (attiva: boolean) =>
  `-mb-px border-b-2 py-2.5 text-label ${attiva ? "border-ink font-semibold text-ink" : "border-transparent font-normal text-ink-muted hover:text-ink"}`;

// Home: titolo con il prossimo evento, schede In programma / Passati, elenco e (desktop) il riquadro del prossimo evento.
export function Eventi() {
  const [passati, setPassati] = useState(false);
  const prossimi = useEventi(false);
  const prossimo = prossimi.data?.[0];
  return (
    <>
      <h1 className="text-title">Eventi</h1>
      {prossimo && <Prossimo e={prossimo} />}
      <NonInviate />
      <div role="tablist" aria-label="Eventi" className="mt-5 flex gap-6 border-b border-line">
        <button type="button" role="tab" aria-selected={!passati} onClick={() => setPassati(false)} className={scheda(!passati)}>
          In programma{prossimi.data && <span className="ml-1.5 font-normal text-ink-muted tabular-nums">{prossimi.data.length}</span>}
        </button>
        <button type="button" role="tab" aria-selected={passati} onClick={() => setPassati(true)} className={scheda(passati)}>
          Passati
        </button>
      </div>
      <div className="mt-4 grid items-start gap-6 lg:grid-cols-3">
        <div role="tabpanel" className="lg:col-span-2">
          {/* gli eventi passati si caricano solo quando si apre la scheda */}
          {passati ? <ListaEventi passati /> : <ListaEventi />}
        </div>
        {prossimo && <SalaProssimo e={prossimo} />}
      </div>
    </>
  );
}

function Prossimo({ e }: { e: EventoLista }) {
  const d = partiData(new Date(e.data_ora));
  const liberi = e.capienza - e.persone;
  return (
    <p className="mt-1 text-[15px] leading-[22px] text-ink-muted">
      Il prossimo è <span className="font-medium text-ink">{d.lunga} alle {d.ora}</span>: {e.persone} persone su {e.capienza},{" "}
      {liberi >= 0 ? `restano ${liberi} posti.` : <span className="font-medium text-warning">{-liberi} oltre la capienza.</span>}
    </p>
  );
}

// Riquadro a destra (solo desktop): il prossimo evento con capienza e persone per tariffa. Il dettaglio resta in cache.
function SalaProssimo({ e }: { e: EventoLista }) {
  const { data } = useQuery({ queryKey: chiaveEvento(e.id), queryFn: () => getJson<DettaglioEvento>(`/api/eventi/${e.id}`) });
  const d = partiData(new Date(e.data_ora));
  const r = data && riepilogoEvento(data.prenotazioni.filter((p) => p.contrassegno !== "annullato"), e.capienza, data.evento.tariffe);
  return (
    <section aria-labelledby="sala-prossimo" className="hidden rounded-lg border border-line p-5 lg:block">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 id="sala-prossimo" className="text-body font-semibold first-letter:uppercase">{d.lunga}</h2>
        <Link href={`/eventi/${e.id}`} className="text-label text-accent hover:underline">Apri</Link>
      </div>
      <div className="mb-1 flex items-baseline gap-2">
        <span className="text-[34px] font-medium leading-[38px] tracking-tight text-accent tabular-nums">{e.persone}</span>
        <span className="text-ink-muted tabular-nums">persone su {e.capienza}</span>
      </div>
      <BarraCapienza persone={e.persone} capienza={e.capienza} />
      {r && (
        <dl className="mt-4 text-label">
          {r.perTariffa.map((t) => (
            <div key={t.tariffa_id} className="flex justify-between gap-3 border-t border-line py-1.5">
              <dt className="font-normal">{t.nome}</dt><dd className="tabular-nums">{t.quantita}</dd>
            </div>
          ))}
          {r.pacchetti > 0 && (
            <div className="flex justify-between gap-3 border-t border-line py-1.5">
              <dt className="font-normal">Pacchetti ristorante</dt><dd className="tabular-nums">{r.pacchetti}</dd>
            </div>
          )}
          <div className="flex justify-between gap-3 border-t border-line py-1.5 font-semibold">
            <dt>Posti liberi</dt><dd className="tabular-nums">{r.postiLiberi}</dd>
          </div>
        </dl>
      )}
    </section>
  );
}

export function ListaEventi({ passati = false }: { passati?: boolean }) {
  const { data, isPending, isError, fetchStatus } = useEventi(passati);
  if (!data) {
    if (isPending && fetchStatus !== "paused")
      return (
        <ul aria-label="Caricamento…">
          {[0, 1, 2].map((i) => <li key={i} className="my-2 h-[76px] animate-pulse rounded-md bg-surface-sunken" />)}
        </ul>
      );
    const testo = fetchStatus === "paused" ? SERVE_RETE : isError ? "Impossibile caricare gli eventi" : "";
    return <p className="py-6 text-center text-ink-muted">{testo}</p>;
  }
  if (data.length === 0)
    return <p className="py-6 text-center text-ink-muted">{passati ? "Nessun evento passato" : "Nessun evento in programma"}</p>;
  return (
    <ul>
      {data.map((e) => {
        const oltre = !passati && e.persone > e.capienza;
        return (
          <li key={e.id} className="border-b border-line">
            <Link href={`/eventi/${e.id}`}
              className={`-mx-2 my-px grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 rounded-md px-2 py-3 transition-colors duration-150 hover:bg-surface-sunken/60 sm:grid-cols-[64px_minmax(0,1fr)_200px_88px] sm:gap-x-5 ${passati ? "opacity-80" : ""}`}>
              <DataBiglietto dataOra={e.data_ora} />
              <span className="min-w-0">
                <span className="block text-[17px] font-semibold leading-snug">{e.titolo}</span>
                <span className="block text-caption text-ink-muted">
                  {e.locale} · {e.prenotazioni} {e.prenotazioni === 1 ? "prenotazione" : "prenotazioni"}
                </span>
              </span>
              <span className="col-span-2 col-start-2 row-start-2 sm:col-span-1 sm:col-start-3 sm:row-start-1">
                <span className="mb-1.5 flex justify-between gap-2 text-label">
                  <span className="tabular-nums"><span className="font-semibold">{e.persone}</span> <span className="font-normal text-ink-muted">/ {e.capienza}</span></span>
                  {oltre && <span className="text-warning">oltre capienza</span>}
                </span>
                <BarraCapienza persone={e.persone} capienza={e.capienza} spenta={passati} />
              </span>
              <span className="col-start-3 row-start-1 text-right leading-tight tabular-nums sm:col-start-4">
                <span className={`block text-[20px] font-medium sm:text-[22px] ${oltre ? "text-warning" : ""}`}>
                  {e.persone}
                </span>
                <span className="text-caption text-ink-muted">{passati ? "persone" : e.persone === 1 ? "occupato" : "occupati"}</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

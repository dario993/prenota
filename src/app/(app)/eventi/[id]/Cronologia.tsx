"use client";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { getJson } from "@/lib/query";
import { confrontaVersioni, formattaDataOra, NOMI_CONTRASSEGNI, type Tariffa, type VoceStorico } from "@/lib/calcoli";
import { pallinoContrassegno } from "@/components/stili";

const AZIONI: Record<VoceStorico["azione"], string> = { creata: "Creata", modificata: "Modificata", stato: "Stato cambiato" };

// Chi, quando e cosa, dalla più recente; aprendo una voce si vede la prenotazione com'era dopo quell'azione,
// con il valore precedente dei campi cambiati. Sempre ricaricata all'apertura (la cambiano anche gli altri utenti).
export function Cronologia({ pid, tariffe }: { pid: string; tariffe: Tariffa[] }) {
  const { data, error } = useQuery({
    queryKey: ["cronologia", pid],
    queryFn: () => getJson<VoceStorico[]>(`/api/prenotazioni/${pid}/cronologia`),
    staleTime: 0,
  });
  return (
    <section aria-labelledby="t-cronologia" className="min-w-0 rounded-lg border border-line bg-surface p-5">
      <h2 id="t-cronologia" className="mb-3 text-body font-semibold">Cronologia</h2>
      {!data ? <p className="text-caption text-ink-muted">{error ? error.message : "Caricamento…"}</p> : (
        <ol className="divide-y divide-line border-y border-line">
          {data.map((v, i) => {
            const campi = v.dati && confrontaVersioni(v.dati, data[i + 1]?.dati ?? null, tariffe);
            const cambiati = campi?.filter((c) => c.era !== undefined).map((c) => c.campo) ?? [];
            return (
              <li key={i}>
                <details className="group">
                  <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3 [&::-webkit-details-marker]:hidden">
                    <div className="min-w-0">
                      <div className="font-semibold">{AZIONI[v.azione]}</div>
                      <div className="text-caption text-ink-muted">{formattaDataOra(new Date(v.il))} · {v.utente ?? "—"}</div>
                      {cambiati.length > 0 && <div className="text-caption text-ink-muted">Cambiato: {cambiati.join(", ")}</div>}
                    </div>
                    <div className="flex items-center gap-2 text-label">
                      {v.contrassegno ? (
                        <><span aria-hidden className={`size-3 rounded-full ${pallinoContrassegno[v.contrassegno]}`} />{NOMI_CONTRASSEGNI[v.contrassegno]}</>
                      ) : <span className="text-ink-muted">Nessuno stato</span>}
                      <ChevronDown size={18} aria-hidden className="text-ink-muted transition-transform group-open:rotate-180" />
                    </div>
                  </summary>
                  {campi ? (
                    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 pb-4 text-label">
                      {campi.filter((c) => c.valore || c.era).map((c) => (
                        <div key={c.campo} className={`contents ${c.era !== undefined ? "font-semibold" : ""}`}>
                          <dt className="text-ink-muted">{c.campo}</dt>
                          <dd className="min-w-0 break-words">
                            {c.valore || "—"}
                            {c.era !== undefined && <span className="ml-2 font-normal text-ink-muted">(prima: <s>{c.era || "—"}</s>)</span>}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : <p className="pb-4 text-caption text-ink-muted">Dati non registrati: voce precedente all’attivazione della cronologia.</p>}
                </details>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

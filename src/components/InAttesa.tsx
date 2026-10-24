"use client";
import { useQueryClient } from "@tanstack/react-query";
import { chiaveEvento, useInAttesa, type InAttesa } from "@/lib/query";
import { descriviBiglietti, persone, type DettaglioEvento } from "@/lib/calcoli";

const etichettaStato = "whitespace-nowrap rounded-sm px-2 py-1 text-label";

// Etichetta di una prenotazione non ancora sul server; se l'invio è fallito, motivo e pulsante Scarta.
export function StatoInAttesa({ p }: { p: Pick<InAttesa, "stato" | "errore" | "mutationId" | "cognome_nome"> }) {
  const qc = useQueryClient();
  if (p.stato === "pending")
    return <span className={`${etichettaStato} bg-accent-soft text-accent`}>in attesa di invio</span>;
  const scarta = () => {
    if (!confirm(`Scartare la prenotazione di ${p.cognome_nome}? I dati andranno persi.`)) return;
    const cache = qc.getMutationCache();
    const m = cache.getAll().find((x) => x.mutationId === p.mutationId);
    if (m) cache.remove(m);
  };
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className={`${etichettaStato} bg-danger-soft text-danger`}>non inviata</span>
      <span className="text-caption text-ink-muted">{p.errore}</span>
      <button type="button" onClick={scarta}
        className="inline-flex min-h-11 items-center rounded-md px-3 text-body font-semibold text-danger hover:bg-danger-soft">Scarta</button>
    </span>
  );
}

// In home: le prenotazioni non inviate restano visibili anche se il loro evento non esiste più.
export function NonInviate() {
  const qc = useQueryClient();
  const errori = useInAttesa().filter((p) => p.stato === "error");
  // nomi delle tariffe dall'evento in cache; se l'evento non c'è più, solo il numero di persone
  const biglietti = (p: InAttesa) => {
    const tariffe = qc.getQueryData<DettaglioEvento>(chiaveEvento(p.evento_id))?.evento.tariffe;
    return tariffe ? descriviBiglietti(p, tariffe) : `${persone(p)} persone`;
  };
  if (!errori.length) return null;
  return (
    <section aria-label="Prenotazioni non inviate" className="mb-6 rounded-lg border border-danger bg-danger-soft p-4">
      <h2 className="mb-3 text-heading text-danger">Prenotazioni non inviate</h2>
      <ul className="grid gap-2">
        {errori.map((p) => (
          <li key={p.mutationId} className="rounded-md bg-surface p-3">
            <div className="font-semibold">{p.cognome_nome}</div>
            <div className="text-label">{biglietti(p)}</div>
            <div className="text-caption text-ink-muted">
              {[p.telefono, p.posti, p.note].filter(Boolean).join(" · ")}
            </div>
            <StatoInAttesa p={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}

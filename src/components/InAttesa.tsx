"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useInAttesa, type InAttesa } from "@/lib/query";
import { sigla } from "@/lib/calcoli";

// Etichetta di una prenotazione non ancora sul server; se l'invio è fallito, messaggio e pulsante Scarta.
export function StatoInAttesa({ p }: { p: Pick<InAttesa, "stato" | "errore" | "mutationId" | "cognome_nome"> }) {
  const qc = useQueryClient();
  if (p.stato === "pending")
    return <span className="whitespace-nowrap rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">in attesa di invio</span>;
  const scarta = () => {
    if (!confirm(`Scartare la prenotazione di ${p.cognome_nome}? Non verrà più inviata.`)) return;
    const cache = qc.getMutationCache();
    const m = cache.getAll().find((x) => x.mutationId === p.mutationId);
    if (m) cache.remove(m);
  };
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className="whitespace-nowrap rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-800">non inviata</span>
      <span className="text-xs text-red-700">{p.errore}</span>
      <button type="button" onClick={scarta} className="text-xs font-medium text-red-700 underline">Scarta</button>
    </span>
  );
}

// In home: le prenotazioni non inviate restano visibili anche se il loro evento non esiste più.
export function NonInviate() {
  const errori = useInAttesa().filter((p) => p.stato === "error");
  if (!errori.length) return null;
  return (
    <section aria-label="Prenotazioni non inviate" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
      <h2 className="mb-2 font-semibold text-red-800">Prenotazioni non inviate</h2>
      <ul className="grid gap-2">
        {errori.map((p) => (
          <li key={p.mutationId} className="rounded-lg bg-white p-3 text-sm">
            <div className="font-semibold">{p.cognome_nome}</div>
            <div>{sigla(p)}</div>
            <div className="text-gray-600">
              {[p.telefono, p.posti, p.note].filter(Boolean).join(" · ")}
            </div>
            <StatoInAttesa p={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}

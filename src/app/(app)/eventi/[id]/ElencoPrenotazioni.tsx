"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";
import { StatoInAttesa } from "@/components/InAttesa";
import { btnPrimario } from "@/components/stili";
import { useOnline, type InAttesa } from "@/lib/query";
import {
  ordinaPerNome, persone, sigla, NOMI_RISTORANTI, NOMI_PASTI,
  type Prenotazione,
} from "@/lib/calcoli";

const ristorante = (p: Prenotazione) =>
  p.pacchetti && p.ristorante && p.pasto ? `${NOMI_RISTORANTI[p.ristorante]} ${NOMI_PASTI[p.pasto].toLowerCase()}` : "";
const tel = (t: string) => `tel:${t.replace(/[^\d+]/g, "")}`;

// Le prenotazioni in coda sul telefono (in_attesa) hanno anche stato/errore e non si aprono.
type Voce = Prenotazione & Partial<Pick<InAttesa, "stato" | "errore" | "mutationId">>;

const COLONNE = [["Nome"], ["Telefono"], ["Adulti", 1], ["Ridotti", 1], ["Bambini", 1], ["Pacchetti", 1], ["Omaggi", 1],
  ["Ristorante"], ["Posti"], ["Note"], ["Totale", 1]] as const;

export function ElencoPrenotazioni({ eventoId, prenotazioni }: { eventoId: string; prenotazioni: Voce[] }) {
  const router = useRouter();
  const online = useOnline();
  const [cerca, setCerca] = useState("");
  const q = cerca.trim().toLowerCase();
  const lista = ordinaPerNome(prenotazioni).filter((p) => p.cognome_nome.toLowerCase().includes(q) || p.telefono.includes(q));
  const href = (p: Prenotazione) => `/eventi/${eventoId}/prenotazioni/${p.id}`;
  // senza rete la modifica non è possibile: non si apre nemmeno la pagina
  const apri = (e: React.MouseEvent) => {
    if (online) return true;
    e.preventDefault();
    toast.info("Serve la rete per modificare una prenotazione");
    return false;
  };
  const statoDi = (p: Voce) => p.stato && p.mutationId !== undefined &&
    <StatoInAttesa p={{ stato: p.stato, errore: p.errore, mutationId: p.mutationId, cognome_nome: p.cognome_nome }} />;
  const contenutoScheda = (p: Voce) => (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 space-y-1">
        <div className="font-semibold">{p.cognome_nome}</div>
        {p.telefono && <div className="text-caption text-ink-muted">{p.telefono}</div>}
        <div className="font-mono text-label">{sigla(p)}</div>
        {p.posti && <div className="font-mono text-label text-ink-muted">{p.posti}</div>}
        {p.note && <div className="text-caption text-ink-muted">{p.note}</div>}
        {statoDi(p)}
      </div>
      <div className="text-figure-sm tabular-nums">{persone(p)}</div>
    </div>
  );
  return (
    <section aria-label="Prenotazioni">
      <div className="relative mb-4">
        <Search size={20} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input type="search" value={cerca} onChange={(e) => setCerca(e.target.value)} placeholder="Cerca per nome o telefono" aria-label="Cerca per nome o telefono"
          className="h-12 w-full rounded-md bg-surface-sunken pl-10 pr-3 text-body text-ink placeholder:text-ink-muted" />
      </div>
      {lista.length === 0 && (
        <div className="py-8 text-center text-ink-muted">
          {prenotazioni.length ? <p>Nessun risultato per «{cerca.trim()}»</p> : (
            <>
              <p>Nessuna prenotazione</p>
              <Link href={`/eventi/${eventoId}/prenotazioni/nuova`} className={`${btnPrimario} mt-4`}><Plus size={20} aria-hidden />Nuova prenotazione</Link>
            </>
          )}
        </div>
      )}
      <ul className="grid gap-2 lg:hidden">
        {lista.map((p) => (
          <li key={p.id}>
            {p.in_attesa ? (
              <div className="rounded-lg border border-line bg-surface p-4">{contenutoScheda(p)}</div>
            ) : (
              <Link href={href(p)} onClick={apri} className="block rounded-lg border border-line bg-surface p-4 transition-colors duration-150 hover:border-line-control">
                {contenutoScheda(p)}
              </Link>
            )}
          </li>
        ))}
      </ul>
      {lista.length > 0 && (
        <div className="hidden overflow-x-auto rounded-lg border border-line bg-surface lg:block"><table className="w-full text-body">
          <thead className="bg-surface-sunken text-left text-label text-ink-muted">
            <tr>{COLONNE.map(([c, numero]) => (
              <th key={c} scope="col" className={`px-3 py-3 font-medium ${numero ? "text-right" : ""}`}>{c}</th>))}</tr>
          </thead>
          <tbody>
            {lista.map((p) => (
              <tr key={p.id} onClick={(e) => {
                if (p.in_attesa || (e.target as HTMLElement).closest("a, button") || !apri(e)) return;
                router.push(href(p));
              }} className={`border-t border-line align-top ${p.in_attesa ? "" : "cursor-pointer hover:bg-surface-sunken"}`}>
                <td className="px-3 py-3 font-semibold">
                  {p.in_attesa ? <div className="space-y-1">{p.cognome_nome}<div>{statoDi(p)}</div></div>
                    : <Link href={href(p)} onClick={apri} className="hover:text-accent">{p.cognome_nome}</Link>}
                </td>
                <td className="whitespace-nowrap px-3 py-3">{p.telefono && <a href={tel(p.telefono)} className="text-accent hover:underline">{p.telefono}</a>}</td>
                {([p.adulti, p.ridotti, p.bambini, p.pacchetti, p.omaggi] as number[]).map((n, i) => (
                  <td key={i} className="px-3 py-3 text-right tabular-nums">{n}</td>
                ))}
                <td className="px-3 py-3">{ristorante(p)}</td>
                <td className="px-3 py-3 font-mono text-label">{p.posti}</td>
                <td className="max-w-48 break-words px-3 py-3 text-ink-muted">{p.note}</td>
                <td className="px-3 py-3 text-right font-semibold tabular-nums">{persone(p)}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
    </section>
  );
}

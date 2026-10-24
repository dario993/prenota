"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { StatoInAttesa } from "@/components/InAttesa";
import { useOnline, type InAttesa } from "@/lib/query";
import {
  ordinaPerNome, persone, sigla, NOMI_RISTORANTI, NOMI_PASTI,
  type Prenotazione,
} from "@/lib/calcoli";

const ristorante = (p: Prenotazione) =>
  p.pacchetti && p.ristorante && p.pasto ? `${NOMI_RISTORANTI[p.ristorante]} ${NOMI_PASTI[p.pasto].toLowerCase()}` : "";

// Le prenotazioni in coda sul telefono (in_attesa) hanno anche stato/errore e non si aprono.
type Voce = Prenotazione & Partial<Pick<InAttesa, "stato" | "errore" | "mutationId">>;

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
    toast.error("Serve la rete per modificare una prenotazione");
    return false;
  };
  const statoDi = (p: Voce) => p.stato && p.mutationId !== undefined &&
    <StatoInAttesa p={{ stato: p.stato, errore: p.errore, mutationId: p.mutationId, cognome_nome: p.cognome_nome }} />;
  return (
    <section aria-label="Prenotazioni">
      <input type="search" value={cerca} onChange={(e) => setCerca(e.target.value)} placeholder="Cerca per nome o telefono" aria-label="Cerca per nome o telefono"
        className="mb-3 w-full rounded-lg border border-gray-300 bg-white px-3 py-2" />
      {lista.length === 0 && <p className="text-gray-500">{prenotazioni.length ? "Nessun risultato" : "Nessuna prenotazione"}</p>}
      <ul className="grid gap-2 lg:hidden">
        {lista.map((p) => (
          <li key={p.id}>
            {p.in_attesa ? (
              <div className="rounded-lg border border-dashed border-amber-300 bg-white p-3">
                <div className="font-semibold">{p.cognome_nome}</div>
                <div className="text-sm">{sigla(p)}</div>
                {p.telefono && <div className="text-sm text-gray-600">Tel: {p.telefono}</div>}
                {p.posti && <div className="text-sm text-gray-600">Posti: {p.posti}</div>}
                {p.note && <div className="text-sm text-gray-600">{p.note}</div>}
                {statoDi(p)}
              </div>
            ) : (
              <Link href={href(p)} onClick={apri} className="block rounded-lg border border-gray-200 bg-white p-3 hover:border-accento">
                <div className="font-semibold">{p.cognome_nome}</div>
                <div className="text-sm">{sigla(p)}</div>
                {p.telefono && <div className="text-sm text-gray-600">Tel: {p.telefono}</div>}
                {p.posti && <div className="text-sm text-gray-600">Posti: {p.posti}</div>}
                {p.note && <div className="text-sm text-gray-600">{p.note}</div>}
              </Link>
            )}
          </li>
        ))}
      </ul>
      {lista.length > 0 && (
        <div className="hidden overflow-x-auto rounded-lg border border-gray-200 bg-white lg:block"><table className="w-full text-sm">
          <thead className="text-left text-gray-500">
            <tr>{["Nome", "Telefono", "Adulti", "Ridotti", "Bambini", "Pacchetti", "Omaggi", "Ristorante", "Posti", "Note", "Totale"].map((c) => (
              <th key={c} scope="col" className="p-2 font-medium">{c}</th>))}</tr>
          </thead>
          <tbody>
            {lista.map((p) => (
              <tr key={p.id} onClick={(e) => {
                if (p.in_attesa || (e.target as HTMLElement).closest("a, button") || !apri(e)) return;
                router.push(href(p));
              }} className={p.in_attesa ? "border-t border-gray-100 bg-amber-50/50" : "cursor-pointer border-t border-gray-100 hover:bg-gray-50"}>
                <td className="p-2 font-semibold">
                  {p.in_attesa ? <>{p.cognome_nome} {statoDi(p)}</> : <Link href={href(p)} onClick={apri} className="hover:text-accento">{p.cognome_nome}</Link>}
                </td>
                <td className="p-2 whitespace-nowrap">{p.telefono && <a href={`tel:${p.telefono.replace(/[^\d+]/g, "")}`} className="hover:text-accento">{p.telefono}</a>}</td>
                <td className="p-2">{p.adulti}</td><td className="p-2">{p.ridotti}</td><td className="p-2">{p.bambini}</td>
                <td className="p-2">{p.pacchetti}</td><td className="p-2">{p.omaggi}</td>
                <td className="p-2">{ristorante(p)}</td><td className="p-2">{p.posti}</td><td className="max-w-48 p-2 break-words">{p.note}</td>
                <td className="p-2 font-semibold">{persone(p)}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
    </section>
  );
}

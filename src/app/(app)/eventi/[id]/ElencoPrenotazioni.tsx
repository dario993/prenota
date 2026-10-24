"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ordinaPerNome, persone, NOMI_RISTORANTI, NOMI_PASTI,
  type Prenotazione,
} from "@/lib/calcoli";

const sigla = (p: Prenotazione): string => {
  const parti = [p.adulti && `${p.adulti} A`, p.ridotti && `${p.ridotti} R`, p.bambini && `${p.bambini} B`];
  if (p.pacchetti) parti.push(`${p.pacchetti} P ${NOMI_RISTORANTI[p.ristorante!]} ${NOMI_PASTI[p.pasto!].toLowerCase()}`);
  if (p.omaggi) parti.push(`${p.omaggi} O`);
  return parti.filter(Boolean).join(" · ");
};
const ristorante = (p: Prenotazione) =>
  p.pacchetti && p.ristorante && p.pasto ? `${NOMI_RISTORANTI[p.ristorante]} ${NOMI_PASTI[p.pasto].toLowerCase()}` : "";

export function ElencoPrenotazioni({ eventoId, prenotazioni }: { eventoId: string; prenotazioni: Prenotazione[] }) {
  const [cerca, setCerca] = useState("");
  const q = cerca.trim().toLowerCase();
  const lista = ordinaPerNome(prenotazioni).filter((p) => p.cognome_nome.toLowerCase().includes(q));
  const href = (p: Prenotazione) => `/eventi/${eventoId}/prenotazioni/${p.id}`;
  return (
    <section aria-label="Prenotazioni">
      <input type="search" value={cerca} onChange={(e) => setCerca(e.target.value)} placeholder="Cerca per nome" aria-label="Cerca per nome"
        className="mb-3 w-full rounded-lg border border-gray-300 bg-white px-3 py-2" />
      {lista.length === 0 && <p className="text-gray-500">{prenotazioni.length ? "Nessun risultato" : "Nessuna prenotazione"}</p>}
      <ul className="grid gap-2 lg:hidden">
        {lista.map((p) => (
          <li key={p.id}>
            <Link href={href(p)} className="block rounded-lg border border-gray-200 bg-white p-3 hover:border-accento">
              <div className="font-semibold">{p.cognome_nome}</div>
              <div className="text-sm">{sigla(p)}</div>
              {p.posti && <div className="text-sm text-gray-600">Posti: {p.posti}</div>}
              {p.note && <div className="text-sm text-gray-600">{p.note}</div>}
            </Link>
          </li>
        ))}
      </ul>
      {lista.length > 0 && (
        <table className="hidden w-full rounded-lg border border-gray-200 bg-white text-sm lg:table">
          <thead className="text-left text-gray-500">
            <tr>{["Nome", "Adulti", "Ridotti", "Bambini", "Pacchetti", "Omaggi", "Ristorante", "Posti", "Note", "Totale"].map((c) => (
              <th key={c} className="p-2 font-medium">{c}</th>))}</tr>
          </thead>
          <tbody>
            {lista.map((p) => (
              <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="p-2 font-semibold"><Link href={href(p)} className="hover:text-accento">{p.cognome_nome}</Link></td>
                <td className="p-2">{p.adulti}</td><td className="p-2">{p.ridotti}</td><td className="p-2">{p.bambini}</td>
                <td className="p-2">{p.pacchetti}</td><td className="p-2">{p.omaggi}</td>
                <td className="p-2">{ristorante(p)}</td><td className="p-2">{p.posti}</td><td className="p-2">{p.note}</td>
                <td className="p-2 font-semibold">{persone(p)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

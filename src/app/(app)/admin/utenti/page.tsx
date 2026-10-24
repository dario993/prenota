import Link from "next/link";
import { richiediAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { BottoneElimina, classeInput, FormAzione } from "@/components/FormAzione";
import { attivaUtente, salvaUtente } from "./azioni";

type U = { id: string; nome: string; email: string; ruolo: "admin" | "operatore"; attivo: boolean };

export default async function Utenti({ searchParams }: { searchParams: Promise<{ modifica?: string }> }) {
  const me = await richiediAdmin();
  const { modifica } = await searchParams;
  const utenti = await sql<U[]>`select id, nome, email, ruolo, attivo from utenti order by nome`;
  const corrente = utenti.find((u) => u.id === modifica);
  const azioni = (u: U) => (
    <>
      <Link href={`/admin/utenti?modifica=${u.id}`} aria-label={`Modifica ${u.nome}`} className="inline-flex min-h-11 items-center px-3 text-sm text-accento hover:underline">Modifica</Link>
      {u.id !== me.id && <BottoneElimina
        azione={attivaUtente.bind(null, u.id, !u.attivo)}
        conferma={u.attivo ? `Disattivare "${u.nome}"? Perderà subito l'accesso.` : undefined}
        nome={u.nome}
        etichetta={u.attivo ? "Disattiva" : "Attiva"}
        successo={u.attivo ? "Disattivato" : "Attivato"}
        variante={u.attivo ? "pericolo" : "normale"}
      />}
    </>
  );
  return (
    <main className="space-y-6 p-4">
      <h1 className="text-xl font-bold">Utenti</h1>
      <FormAzione
        key={corrente?.id ?? "nuovo"}
        azione={salvaUtente}
        dopo="/admin/utenti"
        annulla={corrente ? "/admin/utenti" : undefined}
        className="space-y-3 rounded border border-gray-200 p-4"
      >
        <h2 className="font-semibold">{corrente ? "Modifica utente" : "Nuovo utente"}</h2>
        {corrente && <input type="hidden" name="id" value={corrente.id} />}
        <label className="block text-sm">Nome
          <input name="nome" defaultValue={corrente?.nome} required maxLength={80} className={classeInput} />
        </label>
        <label className="block text-sm">Email
          <input name="email" type="email" defaultValue={corrente?.email} required autoComplete="off" className={classeInput} />
        </label>
        <label className="block text-sm">Password{corrente && " (vuota = invariata)"}
          <input name="password" type="password" minLength={8} required={!corrente} autoComplete="new-password" className={classeInput} />
        </label>
        <label className="block text-sm">Ruolo
          <select name="ruolo" defaultValue={corrente?.ruolo ?? "operatore"} className={classeInput}>
            <option value="operatore">Operatore</option>
            <option value="admin">Admin</option>
          </select>
        </label>
      </FormAzione>

      <ul className="space-y-2 lg:hidden">
        {utenti.map((u) => (
          <li key={u.id} className="rounded border border-gray-200 p-3">
            <div className="font-medium">{u.nome}{!u.attivo && " (disattivato)"}</div>
            <div className="text-sm text-gray-600">{u.email} · {u.ruolo}</div>
            <div className="-mb-1 flex">{azioni(u)}</div>
          </li>
        ))}
      </ul>
      <table className="hidden w-full text-left text-sm lg:table">
        <thead><tr className="border-b border-gray-200"><th className="py-2">Nome</th><th>Email</th><th>Ruolo</th><th>Stato</th><th /></tr></thead>
        <tbody>
          {utenti.map((u) => (
            <tr key={u.id} className="border-b border-gray-100">
              <td className="py-1">{u.nome}</td><td>{u.email}</td><td>{u.ruolo}</td><td>{u.attivo ? "Attivo" : "Disattivato"}</td>
              <td className="flex justify-end">{azioni(u)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

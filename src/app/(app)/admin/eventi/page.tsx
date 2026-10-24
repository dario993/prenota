import Link from "next/link";
import { richiediAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { formattaDataOra } from "@/lib/calcoli";
import { BottoneElimina, classeInput, FormAzione } from "@/components/FormAzione";
import { eliminaEvento, salvaEvento } from "./azioni";

type Evento = { id: string; opera_id: string; locale_id: string; titolo: string; locale: string; data_ora: Date; locale_input: string };

export default async function Eventi({ searchParams }: { searchParams: Promise<{ modifica?: string }> }) {
  await richiediAdmin();
  const { modifica } = await searchParams;
  const [eventi, opere, locali] = await Promise.all([
    sql<Evento[]>`select e.id, e.opera_id, e.locale_id, o.titolo, l.nome as locale, e.data_ora,
      to_char(e.data_ora at time zone 'Europe/Rome', 'YYYY-MM-DD"T"HH24:MI') as locale_input
      from eventi e join opere o on o.id = e.opera_id join locali l on l.id = e.locale_id
      order by e.data_ora`,
    sql<{ id: string; titolo: string }[]>`select id, titolo from opere order by titolo`,
    sql<{ id: string; nome: string }[]>`select id, nome from locali order by nome`,
  ]);
  const corrente = eventi.find((e) => e.id === modifica);
  const nome = (e: Evento) => `${e.titolo} ${formattaDataOra(e.data_ora)}`;
  const azioni = (e: Evento) => (
    <>
      <Link href={`/admin/eventi?modifica=${e.id}`} aria-label={`Modifica ${nome(e)}`} className="inline-flex min-h-11 items-center px-3 text-sm text-accento hover:underline">Modifica</Link>
      <BottoneElimina azione={eliminaEvento.bind(null, e.id)} conferma={`Eliminare "${nome(e)}"?`} nome={nome(e)} />
    </>
  );
  return (
    <main className="space-y-6 p-4">
      <h1 className="text-xl font-bold">Eventi</h1>
      <FormAzione
        key={corrente?.id ?? "nuovo"}
        azione={salvaEvento}
        dopo="/admin/eventi"
        annulla={corrente ? "/admin/eventi" : undefined}
        className="space-y-3 rounded border border-gray-200 p-4"
      >
        <h2 className="font-semibold">{corrente ? "Modifica evento" : "Nuovo evento"}</h2>
        {corrente && <input type="hidden" name="id" value={corrente.id} />}
        <label className="block text-sm">Opera
          <select name="opera_id" defaultValue={corrente?.opera_id ?? ""} required className={classeInput}>
            <option value="" disabled>Scegli…</option>
            {opere.map((o) => <option key={o.id} value={o.id}>{o.titolo}</option>)}
          </select>
        </label>
        <label className="block text-sm">Locale
          <select name="locale_id" defaultValue={corrente?.locale_id ?? ""} required className={classeInput}>
            <option value="" disabled>Scegli…</option>
            {locali.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
          </select>
        </label>
        <label className="block text-sm">Data e ora
          <input type="datetime-local" name="data_ora" defaultValue={corrente?.locale_input} required className={classeInput} />
        </label>
      </FormAzione>

      <ul className="space-y-2 lg:hidden">
        {eventi.map((e) => (
          <li key={e.id} className="rounded border border-gray-200 p-3">
            <div className="font-medium">{e.titolo}</div>
            <div className="text-sm text-gray-600">{formattaDataOra(e.data_ora)} · {e.locale}</div>
            <div className="-mb-1 flex">{azioni(e)}</div>
          </li>
        ))}
      </ul>
      <table className="hidden w-full text-left text-sm lg:table">
        <thead><tr className="border-b border-gray-200"><th className="py-2">Data e ora</th><th>Opera</th><th>Locale</th><th /></tr></thead>
        <tbody>
          {eventi.map((e) => (
            <tr key={e.id} className="border-b border-gray-100">
              <td className="py-1">{formattaDataOra(e.data_ora)}</td><td>{e.titolo}</td><td>{e.locale}</td>
              <td className="flex justify-end">{azioni(e)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {eventi.length === 0 && <p className="text-sm text-gray-600">Nessun evento.</p>}
    </main>
  );
}

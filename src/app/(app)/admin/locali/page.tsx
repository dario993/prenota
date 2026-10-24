import Link from "next/link";
import { richiediAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { BottoneElimina, classeInput, FormAzione } from "@/components/FormAzione";
import { eliminaLocale, salvaLocale } from "./azioni";

type Locale = { id: string; nome: string; capienza: number };

export default async function Locali({ searchParams }: { searchParams: Promise<{ modifica?: string }> }) {
  await richiediAdmin();
  const { modifica } = await searchParams;
  const locali = await sql<Locale[]>`select id, nome, capienza from locali order by nome`;
  const corrente = locali.find((l) => l.id === modifica);
  const azioni = (l: Locale) => (
    <>
      <Link href={`/admin/locali?modifica=${l.id}`} className="inline-flex min-h-11 items-center px-3 text-sm text-accento hover:underline">Modifica</Link>
      <BottoneElimina azione={eliminaLocale.bind(null, l.id)} conferma={`Eliminare "${l.nome}"?`} />
    </>
  );
  return (
    <main className="space-y-6 p-4">
      <h1 className="text-xl font-bold">Locali</h1>
      <FormAzione
        key={corrente?.id ?? "nuovo"}
        azione={salvaLocale}
        dopo="/admin/locali"
        annulla={corrente ? "/admin/locali" : undefined}
        className="space-y-3 rounded border border-gray-200 p-4"
      >
        <h2 className="font-semibold">{corrente ? "Modifica locale" : "Nuovo locale"}</h2>
        {corrente && <input type="hidden" name="id" value={corrente.id} />}
        <label className="block text-sm">Nome
          <input name="nome" defaultValue={corrente?.nome} required maxLength={80} className={classeInput} />
        </label>
        <label className="block text-sm">Capienza
          <input name="capienza" defaultValue={corrente?.capienza} inputMode="numeric" className={classeInput} />
        </label>
      </FormAzione>

      <ul className="space-y-2 lg:hidden">
        {locali.map((l) => (
          <li key={l.id} className="rounded border border-gray-200 p-3">
            <div className="font-medium">{l.nome}</div>
            <div className="text-sm text-gray-600">Capienza {l.capienza}</div>
            <div className="-mb-1 flex">{azioni(l)}</div>
          </li>
        ))}
      </ul>
      <table className="hidden w-full text-left text-sm lg:table">
        <thead><tr className="border-b border-gray-200"><th className="py-2">Nome</th><th>Capienza</th><th /></tr></thead>
        <tbody>
          {locali.map((l) => (
            <tr key={l.id} className="border-b border-gray-100">
              <td className="py-1">{l.nome}</td><td>{l.capienza}</td>
              <td className="flex justify-end">{azioni(l)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {locali.length === 0 && <p className="text-sm text-gray-600">Nessun locale.</p>}
    </main>
  );
}

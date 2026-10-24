import Link from "next/link";
import { richiediAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { formattaEuro } from "@/lib/calcoli";
import { BottoneElimina, classeInput, FormAzione } from "@/components/FormAzione";
import { eliminaOpera, salvaOpera } from "./azioni";

type Opera = {
  id: string; titolo: string; prezzo_adulto: number; prezzo_ridotto: number; prezzo_bambino: number;
  prezzo_pacchetto_teatro: number; prezzo_pacchetto_ristorante: number;
};

const CAMPI = [
  ["prezzo_adulto", "Adulto"],
  ["prezzo_ridotto", "Ridotto gruppi"],
  ["prezzo_bambino", "Bambino"],
  ["prezzo_pacchetto_teatro", "Pacchetto: quota teatro"],
  ["prezzo_pacchetto_ristorante", "Pacchetto: quota ristorante"],
] as const;
const DEFAULT: Partial<Record<(typeof CAMPI)[number][0], string>> = {
  prezzo_pacchetto_teatro: "22,00", prezzo_pacchetto_ristorante: "27,00",
};
const euro = (c: number) => (c / 100).toFixed(2).replace(".", ",");
const pacchetto = (o: Opera) => formattaEuro(o.prezzo_pacchetto_teatro + o.prezzo_pacchetto_ristorante);

export default async function Opere({ searchParams }: { searchParams: Promise<{ modifica?: string }> }) {
  await richiediAdmin();
  const { modifica } = await searchParams;
  const opere = await sql<Opera[]>`
    select id, titolo, prezzo_adulto, prezzo_ridotto, prezzo_bambino, prezzo_pacchetto_teatro, prezzo_pacchetto_ristorante
    from opere order by titolo`;
  const corrente = opere.find((o) => o.id === modifica);
  const azioni = (o: Opera) => (
    <>
      <Link href={`/admin/opere?modifica=${o.id}`} aria-label={`Modifica ${o.titolo}`} className="inline-flex min-h-11 items-center px-3 text-sm text-accento hover:underline">Modifica</Link>
      <BottoneElimina azione={eliminaOpera.bind(null, o.id)} conferma={`Eliminare "${o.titolo}"?`} nome={o.titolo} />
    </>
  );
  return (
    <main className="mx-auto max-w-4xl space-y-6 p-4">
      <h1 className="text-xl font-bold">Opere</h1>
      <FormAzione
        key={corrente?.id ?? "nuova"}
        azione={salvaOpera}
        dopo="/admin/opere"
        annulla={corrente ? "/admin/opere" : undefined}
        className="space-y-3 rounded border border-gray-200 p-4"
      >
        <h2 className="font-semibold">{corrente ? "Modifica opera" : "Nuova opera"}</h2>
        {corrente && <input type="hidden" name="id" value={corrente.id} />}
        <label className="block text-sm">Titolo
          <input name="titolo" defaultValue={corrente?.titolo} required maxLength={120} className={classeInput} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          {CAMPI.map(([nome, etichetta]) => (
            <label key={nome} className="block text-sm">{etichetta} (€)
              <input name={nome} inputMode="decimal" defaultValue={corrente ? euro(corrente[nome]) : DEFAULT[nome]} className={classeInput} />
            </label>
          ))}
        </div>
      </FormAzione>

      <ul className="space-y-2 lg:hidden">
        {opere.map((o) => (
          <li key={o.id} className="rounded border border-gray-200 p-3">
            <div className="font-medium">{o.titolo}</div>
            <div className="text-sm text-gray-600">
              Adulto {formattaEuro(o.prezzo_adulto)} · Ridotto {formattaEuro(o.prezzo_ridotto)} · Bambino {formattaEuro(o.prezzo_bambino)}
            </div>
            <div className="text-sm text-gray-600">Pacchetto {pacchetto(o)}</div>
            <div className="-mb-1 flex">{azioni(o)}</div>
          </li>
        ))}
      </ul>
      <table className="hidden w-full text-left text-sm lg:table">
        <thead>
          <tr className="border-b border-gray-200"><th className="py-2">Titolo</th><th>Adulto</th><th>Ridotto</th><th>Bambino</th><th>Pacchetto</th><th /></tr>
        </thead>
        <tbody>
          {opere.map((o) => (
            <tr key={o.id} className="border-b border-gray-100">
              <td className="py-1">{o.titolo}</td>
              <td>{formattaEuro(o.prezzo_adulto)}</td><td>{formattaEuro(o.prezzo_ridotto)}</td>
              <td>{formattaEuro(o.prezzo_bambino)}</td><td>{pacchetto(o)}</td>
              <td className="flex justify-end">{azioni(o)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {opere.length === 0 && <p className="text-sm text-gray-600">Nessuna opera.</p>}
    </main>
  );
}

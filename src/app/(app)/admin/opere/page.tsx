import Link from "next/link";
import { richiediAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { formattaEuro } from "@/lib/calcoli";
import { BottoneElimina, FormAzione } from "@/components/FormAzione";
import { azioniAdmin, btnPrimario, btnSecondario, campo, elencoAdmin, etichetta, paginaAdmin, rigaAdmin } from "@/components/stili";
import { eliminaOpera, salvaOpera } from "./azioni";

type Opera = {
  id: string; titolo: string; prezzo_adulto: number; prezzo_ridotto: number; prezzo_bambino: number;
  prezzo_pacchetto_teatro: number; prezzo_pacchetto_ristorante: number;
};

const CAMPI = [
  ["prezzo_adulto", "Adulto"],
  ["prezzo_ridotto", "Ridotto gruppi"],
  ["prezzo_bambino", "Bambino"],
  ["prezzo_pacchetto_teatro", "Pacchetto – quota teatro"],
  ["prezzo_pacchetto_ristorante", "Pacchetto – quota ristorante"],
] as const;
const DEFAULT: Partial<Record<(typeof CAMPI)[number][0], string>> = {
  prezzo_pacchetto_teatro: "22,00", prezzo_pacchetto_ristorante: "27,00",
};
const euro = (c: number) => (c / 100).toFixed(2).replace(".", ",");
const pacchetto = (o: Opera) => formattaEuro(o.prezzo_pacchetto_teatro + o.prezzo_pacchetto_ristorante);

export default async function Opere({ searchParams }: { searchParams: Promise<{ modifica?: string; nuovo?: string }> }) {
  await richiediAdmin();
  const { modifica, nuovo } = await searchParams;
  const opere = await sql<Opera[]>`
    select id, titolo, prezzo_adulto, prezzo_ridotto, prezzo_bambino, prezzo_pacchetto_teatro, prezzo_pacchetto_ristorante
    from opere order by titolo`;
  const corrente = opere.find((o) => o.id === modifica);
  if (corrente || nuovo !== undefined) return (
    <main className={paginaAdmin}>
      <h1 className="text-title lg:text-display">{corrente ? `Modifica: ${corrente.titolo}` : "Nuova opera"}</h1>
      <FormAzione
        azione={salvaOpera}
        dopo="/admin/opere"
        annulla="/admin/opere"
      >
        {corrente && <input type="hidden" name="id" value={corrente.id} />}
        <label className={etichetta}>Titolo
          <input name="titolo" defaultValue={corrente?.titolo} required maxLength={120} className={campo} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          {CAMPI.map(([nome, testo]) => (
            <label key={nome} className={etichetta}>{testo} (€)
              <input name={nome} inputMode="decimal" defaultValue={corrente ? euro(corrente[nome]) : DEFAULT[nome]} className={`${campo} tabular-nums`} />
            </label>
          ))}
        </div>
        {corrente && <p className="text-label">Pacchetto attuale: <span className="text-figure-sm tabular-nums">{pacchetto(corrente)}</span></p>}
        <p className="text-caption text-ink-muted">Il pacchetto costa la somma delle due quote. Cambiare il tariffario non modifica le prenotazioni già salvate.</p>
      </FormAzione>
    </main>
  );
  return (
    <main className={paginaAdmin}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-title lg:text-display">Opere</h1>
        <Link href="/admin/opere?nuovo" className={btnPrimario}>Nuova opera</Link>
      </div>

      {opere.length === 0 ? <p className="py-6 text-center text-ink-muted">Nessuna opera</p> : (
        <ul className={elencoAdmin}>
          {opere.map((o) => (
            <li key={o.id} className={rigaAdmin}>
              <div>
                <div className="font-semibold">{o.titolo}</div>
                <div className="text-caption tabular-nums text-ink-muted">
                  Adulto {formattaEuro(o.prezzo_adulto)} · Ridotto {formattaEuro(o.prezzo_ridotto)} · Bambino {formattaEuro(o.prezzo_bambino)} · Pacchetto {pacchetto(o)}
                </div>
              </div>
              <div className={azioniAdmin}>
                <Link href={`/admin/opere?modifica=${o.id}`} aria-label={`Modifica ${o.titolo}`} className={btnSecondario}>Modifica</Link>
                <BottoneElimina azione={eliminaOpera.bind(null, o.id)} conferma={`Eliminare l'opera ${o.titolo}?`} nome={o.titolo} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

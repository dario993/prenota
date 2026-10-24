import Link from "next/link";
import { richiediAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { BottoneElimina, FormAzione } from "@/components/FormAzione";
import { azioniAdmin, btnPrimario, btnSecondario, campo, elencoAdmin, etichetta, paginaAdmin, rigaAdmin } from "@/components/stili";
import { eliminaLocale, salvaLocale } from "./azioni";

type Locale = { id: string; nome: string; capienza: number };

export default async function Locali({ searchParams }: { searchParams: Promise<{ modifica?: string; nuovo?: string }> }) {
  await richiediAdmin();
  const { modifica, nuovo } = await searchParams;
  const locali = await sql<Locale[]>`select id, nome, capienza from locali order by nome`;
  const corrente = locali.find((l) => l.id === modifica);
  if (corrente || nuovo !== undefined) return (
    <main className={paginaAdmin}>
      <h1 className="text-title lg:text-display">{corrente ? `Modifica: ${corrente.nome}` : "Nuovo locale"}</h1>
      <FormAzione
        azione={salvaLocale}
        dopo="/admin/locali"
        annulla="/admin/locali"
      >
        {corrente && <input type="hidden" name="id" value={corrente.id} />}
        <label className={etichetta}>Nome
          <input name="nome" defaultValue={corrente?.nome} required maxLength={80} className={campo} />
        </label>
        <label className={etichetta}>Capienza
          <input name="capienza" defaultValue={corrente?.capienza} inputMode="numeric" className={campo} />
        </label>
      </FormAzione>
    </main>
  );
  return (
    <main className={paginaAdmin}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-title lg:text-display">Locali</h1>
        <Link href="/admin/locali?nuovo" className={btnPrimario}>Nuovo locale</Link>
      </div>

      {locali.length === 0 ? <p className="py-6 text-center text-ink-muted">Nessun locale</p> : (
        <ul className={elencoAdmin}>
          {locali.map((l) => (
            <li key={l.id} className={rigaAdmin}>
              <div>
                <div className="font-semibold">{l.nome}</div>
                <div className="text-caption text-ink-muted">Capienza <span className="tabular-nums">{l.capienza}</span></div>
              </div>
              <div className={azioniAdmin}>
                <Link href={`/admin/locali?modifica=${l.id}`} aria-label={`Modifica ${l.nome}`} className={btnSecondario}>Modifica</Link>
                <BottoneElimina azione={eliminaLocale.bind(null, l.id)} conferma={`Eliminare il locale ${l.nome}?`} nome={l.nome} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

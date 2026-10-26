import Link from "next/link";
import { BarraTelefono } from "@/components/BarraTelefono";
import { Plus } from "lucide-react";
import { TestaPagina } from "@/components/TestaPagina";
import { richiediAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { formattaDataOra } from "@/lib/calcoli";
import { BottoneElimina, FormAzione } from "@/components/FormAzione";
import { azioniAdmin, btnPrimario, btnSecondario, campo, elencoAdmin, etichetta, paginaAdmin, rigaAdmin } from "@/components/stili";
import { eliminaEvento, salvaEvento } from "./azioni";

type Evento = { id: string; opera_id: string; locale_id: string; titolo: string; locale: string; data_ora: Date; locale_input: string };

export default async function Eventi({ searchParams }: { searchParams: Promise<{ modifica?: string; nuovo?: string }> }) {
  await richiediAdmin();
  const { modifica, nuovo } = await searchParams;
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
  const adesso = new Date();
  if (corrente || nuovo !== undefined) return (
    <main className={paginaAdmin}>
      <BarraTelefono titolo="Eventi" />
      <TestaPagina titolo={corrente ? `Modifica: ${nome(corrente)}` : "Nuovo evento"} indietro={{ href: "/admin/eventi", testo: "Eventi" }} />
      <FormAzione
        azione={salvaEvento}
        dopo="/admin/eventi"
        annulla="/admin/eventi"
      >
        {corrente && <input type="hidden" name="id" value={corrente.id} />}
        <label className={etichetta}>Opera
          <select name="opera_id" defaultValue={corrente?.opera_id ?? ""} required className={campo}>
            <option value="" disabled>Scegli…</option>
            {opere.map((o) => <option key={o.id} value={o.id}>{o.titolo}</option>)}
          </select>
        </label>
        <label className={etichetta}>Locale
          <select name="locale_id" defaultValue={corrente?.locale_id ?? ""} required className={campo}>
            <option value="" disabled>Scegli…</option>
            {locali.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
          </select>
        </label>
        <label className={etichetta}>Data e ora
          <input type="datetime-local" name="data_ora" defaultValue={corrente?.locale_input} required className={campo} />
        </label>
      </FormAzione>
    </main>
  );
  return (
    <main className={paginaAdmin}>
      <BarraTelefono titolo="Eventi" />
      <TestaPagina titolo="Eventi" sottotitolo="Ogni evento è un'opera in un locale, a una data e ora.">
        <Link href="/admin/eventi?nuovo" className={btnPrimario}><Plus size={16} aria-hidden />Nuovo evento</Link>
      </TestaPagina>

      {eventi.length === 0 ? <p className="py-6 text-center text-ink-muted">Nessun evento</p> : (
        <ul className={elencoAdmin}>
          {eventi.map((e) => {
            const passato = e.data_ora < adesso;
            return (
              <li key={e.id} className={rigaAdmin}>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/eventi/${e.id}`} className={`font-semibold hover:underline ${passato ? "text-ink-muted" : "text-accent"}`}>{e.titolo}</Link>
                    {passato && <span className="rounded-sm bg-surface-sunken px-2 py-1 text-label text-ink-muted">passato</span>}
                  </div>
                  <div className="text-caption text-ink-muted">{formattaDataOra(e.data_ora)} · {e.locale}</div>
                </div>
                <div className={azioniAdmin}>
                  <Link href={`/admin/eventi?modifica=${e.id}`} aria-label={`Modifica ${nome(e)}`} className={btnSecondario}>Modifica</Link>
                  <BottoneElimina azione={eliminaEvento.bind(null, e.id)} conferma={`Eliminare l'evento ${nome(e)}?`} nome={nome(e)} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

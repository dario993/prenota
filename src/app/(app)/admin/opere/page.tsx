import Link from "next/link";
import { BarraTelefono } from "@/components/BarraTelefono";
import { Plus } from "lucide-react";
import { TestaPagina } from "@/components/TestaPagina";
import { richiediAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { formattaEuro } from "@/lib/calcoli";
import { BottoneElimina } from "@/components/FormAzione";
import { azioniAdmin, btnPrimario, btnSecondario, elencoAdmin, paginaAdmin, rigaAdmin } from "@/components/stili";
import { FormOpera, type ValoriOpera } from "./FormOpera";
import { eliminaOpera, salvaOpera } from "./azioni";

type Opera = { id: string; titolo: string; prezzo_pacchetto_teatro: number; prezzo_pacchetto_ristorante: number; pacchetto_nascosto: boolean };
type T = { id: string; opera_id: string; nome: string; prezzo: number; nascosta: boolean };

const euro = (c: number) => (c / 100).toFixed(2).replace(".", ",");
const pacchetto = (o: Opera) => formattaEuro(o.prezzo_pacchetto_teatro + o.prezzo_pacchetto_ristorante);
// nuova opera: il tariffario di sempre, da completare
const NUOVA: ValoriOpera = {
  titolo: "",
  tariffe: [
    { nome: "Adulti", prezzo: "", nascosta: false }, { nome: "Ridotti gruppi", prezzo: "", nascosta: false },
    { nome: "Bambini", prezzo: "", nascosta: false }, { nome: "Omaggi", prezzo: "0,00", nascosta: false },
  ],
  prezzo_pacchetto_teatro: "22,00", prezzo_pacchetto_ristorante: "27,00", pacchetto_nascosto: false,
};

export default async function Opere({ searchParams }: { searchParams: Promise<{ modifica?: string; nuovo?: string }> }) {
  await richiediAdmin();
  const { modifica, nuovo } = await searchParams;
  const [opere, tariffe] = await Promise.all([
    sql<Opera[]>`select id, titolo, prezzo_pacchetto_teatro, prezzo_pacchetto_ristorante, pacchetto_nascosto
      from opere order by titolo`,
    sql<T[]>`select id, opera_id, nome, prezzo, nascosta from tariffe order by ordine`,
  ]);
  const di = (o: Opera) => tariffe.filter((t) => t.opera_id === o.id);
  const corrente = opere.find((o) => o.id === modifica);
  if (corrente || nuovo !== undefined) return (
    <main className={paginaAdmin}>
      <BarraTelefono titolo="Opere" />
      <TestaPagina titolo={corrente ? `Modifica: ${corrente.titolo}` : "Nuova opera"} indietro={{ href: "/admin/opere", testo: "Opere" }} />
      <FormOpera
        salva={salvaOpera.bind(null, corrente?.id ?? null)}
        iniziale={corrente ? {
          titolo: corrente.titolo,
          tariffe: di(corrente).map((t) => ({ id: t.id, nome: t.nome, prezzo: euro(t.prezzo), nascosta: t.nascosta })),
          prezzo_pacchetto_teatro: euro(corrente.prezzo_pacchetto_teatro),
          prezzo_pacchetto_ristorante: euro(corrente.prezzo_pacchetto_ristorante),
          pacchetto_nascosto: corrente.pacchetto_nascosto,
        } : NUOVA}
      />
    </main>
  );
  return (
    <main className={paginaAdmin}>
      <BarraTelefono titolo="Opere" />
      <TestaPagina titolo="Opere" sottotitolo="Tariffe e pacchetto di ogni spettacolo.">
        <Link href="/admin/opere?nuovo" className={btnPrimario}><Plus size={16} aria-hidden />Nuova opera</Link>
      </TestaPagina>

      {opere.length === 0 ? <p className="py-6 text-center text-ink-muted">Nessuna opera</p> : (
        <ul className={elencoAdmin}>
          {opere.map((o) => (
            <li key={o.id} className={rigaAdmin}>
              <div>
                <div className="font-semibold">{o.titolo}</div>
                <div className="text-caption tabular-nums text-ink-muted">
                  {[...di(o).map((t) => ({ k: t.id, testo: `${t.nome} ${formattaEuro(t.prezzo)}`, nascosta: t.nascosta })),
                    { k: "pacchetto", testo: `Pacchetto ${pacchetto(o)}`, nascosta: o.pacchetto_nascosto }]
                    .map((v, i) => (
                      <span key={v.k} className={v.nascosta ? "opacity-60" : "text-ink"}>
                        {i > 0 && <span className="text-ink-muted"> · </span>}{v.testo}{v.nascosta && " (nascosta)"}
                      </span>
                    ))}
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

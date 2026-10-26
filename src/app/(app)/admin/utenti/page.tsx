import Link from "next/link";
import { BarraTelefono } from "@/components/BarraTelefono";
import { Plus } from "lucide-react";
import { TestaPagina } from "@/components/TestaPagina";
import { richiediAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { BottoneElimina, FormAzione } from "@/components/FormAzione";
import { azioniAdmin, btnPrimario, btnSecondario, campo, elencoAdmin, etichetta, paginaAdmin, rigaAdmin, scelta, segmenti } from "@/components/stili";
import { attivaUtente, eliminaUtente, salvaUtente } from "./azioni";

type U = { id: string; nome: string; email: string | null; ruolo: "admin" | "operatore" | "visualizzatore" | "api"; attivo: boolean };

const RUOLI = [["operatore", "Operatore"], ["visualizzatore", "Visualizzatore"], ["admin", "Admin"], ["api", "API key"]] as const;
const NOME_RUOLO = Object.fromEntries(RUOLI);

export default async function Utenti({ searchParams }: { searchParams: Promise<{ modifica?: string; nuovo?: string }> }) {
  const me = await richiediAdmin();
  const { modifica, nuovo } = await searchParams;
  const utenti = await sql<U[]>`select id, nome, email, ruolo, attivo from utenti order by nome`;
  const corrente = utenti.find((u) => u.id === modifica);
  const sonoIo = corrente?.id === me.id; // il proprio ruolo non si cambia
  const api = corrente?.ruolo === "api"; // né quello di un utente API key, che non ha password
  if (corrente || nuovo !== undefined) return (
    <main className={paginaAdmin}>
      <BarraTelefono titolo="Utenti" />
      <TestaPagina titolo={corrente ? `Modifica: ${corrente.nome}` : "Nuovo utente"} indietro={{ href: "/admin/utenti", testo: "Utenti" }} />
      <FormAzione
        azione={salvaUtente}
        dopo="/admin/utenti"
        annulla="/admin/utenti"
      >
        {corrente && <input type="hidden" name="id" value={corrente.id} />}
        <label className={etichetta}>Nome
          <input name="nome" defaultValue={corrente?.nome} required maxLength={80} className={campo} />
        </label>
        {!api && <label className={etichetta}>Email
          <input name="email" type="email" defaultValue={corrente?.email ?? ""} autoComplete="off" className={campo} />
          {!corrente && <span className="text-caption font-normal text-ink-muted">Obbligatoria, tranne che per API key.</span>}
        </label>}
        {!api && <label className={etichetta}>Password
          <input name="password" type="password" minLength={8} autoComplete="new-password" className={campo} />
          <span className="text-caption font-normal text-ink-muted">
            {corrente ? "Lascia vuoto per non cambiarla." : "Obbligatoria, almeno 8 caratteri. Per API key lascia vuoto: la chiave viene generata e mostrata una volta."}
          </span>
        </label>}
        {sonoIo || api ? <input type="hidden" name="ruolo" value={corrente.ruolo} /> : (
          <fieldset className="space-y-2">
            <legend className="mb-2 text-label">Ruolo</legend>
            <div className={segmenti}>
              {RUOLI.map(([valore, testo]) => (
                <label key={valore} className={scelta}>
                  <input type="radio" name="ruolo" value={valore} defaultChecked={(corrente?.ruolo ?? "operatore") === valore} className="sr-only" />{testo}
                </label>
              ))}
            </div>
          </fieldset>
        )}
      </FormAzione>
    </main>
  );
  return (
    <main className={paginaAdmin}>
      <BarraTelefono titolo="Utenti" />
      <TestaPagina titolo="Utenti" sottotitolo="Chi può entrare in Prenota e con quale ruolo.">
        <Link href="/admin/utenti?nuovo" className={btnPrimario}><Plus size={16} aria-hidden />Nuovo utente</Link>
      </TestaPagina>

      <ul className={elencoAdmin}>
        {utenti.map((u) => (
          <li key={u.id} className={rigaAdmin}>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`font-semibold ${u.attivo ? "" : "text-ink-muted"}`}>{u.nome}</span>
                {!u.attivo && <span className="rounded-sm bg-surface-sunken px-2 py-1 text-label text-ink-muted">disattivato</span>}
              </div>
              <div className="text-caption text-ink-muted">{[u.email, NOME_RUOLO[u.ruolo]].filter(Boolean).join(" · ")}</div>
            </div>
            <div className={azioniAdmin}>
              <Link href={`/admin/utenti?modifica=${u.id}`} aria-label={`Modifica ${u.nome}`} className={btnSecondario}>Modifica</Link>
              {u.id !== me.id && <BottoneElimina
                azione={attivaUtente.bind(null, u.id, !u.attivo)}
                conferma={u.attivo ? `Disattivare ${u.nome}? Perderà subito l'accesso.` : undefined}
                nome={u.nome}
                etichetta={u.attivo ? "Disattiva" : "Attiva"}
                successo={u.attivo ? "Disattivato" : "Attivato"}
                variante={u.attivo ? "pericolo" : "normale"}
              />}
              {u.id !== me.id && <BottoneElimina azione={eliminaUtente.bind(null, u.id)} conferma={`Eliminare l'utente ${u.nome}?`} nome={u.nome} />}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}

import Link from "next/link";
import { richiediAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { BottoneElimina, FormAzione } from "@/components/FormAzione";
import { azioniAdmin, btnPrimario, btnSecondario, campo, elencoAdmin, etichetta, paginaAdmin, rigaAdmin, scelta } from "@/components/stili";
import { attivaUtente, salvaUtente } from "./azioni";

type U = { id: string; nome: string; email: string; ruolo: "admin" | "operatore"; attivo: boolean };

const RUOLI = [["operatore", "Operatore"], ["admin", "Admin"]] as const;

export default async function Utenti({ searchParams }: { searchParams: Promise<{ modifica?: string; nuovo?: string }> }) {
  const me = await richiediAdmin();
  const { modifica, nuovo } = await searchParams;
  const utenti = await sql<U[]>`select id, nome, email, ruolo, attivo from utenti order by nome`;
  const corrente = utenti.find((u) => u.id === modifica);
  const sonoIo = corrente?.id === me.id; // il proprio ruolo non si cambia
  if (corrente || nuovo !== undefined) return (
    <main className={paginaAdmin}>
      <h1 className="text-title lg:text-display">{corrente ? `Modifica: ${corrente.nome}` : "Nuovo utente"}</h1>
      <FormAzione
        azione={salvaUtente}
        dopo="/admin/utenti"
        annulla="/admin/utenti"
      >
        {corrente && <input type="hidden" name="id" value={corrente.id} />}
        <label className={etichetta}>Nome
          <input name="nome" defaultValue={corrente?.nome} required maxLength={80} className={campo} />
        </label>
        <label className={etichetta}>Email
          <input name="email" type="email" defaultValue={corrente?.email} required autoComplete="off" className={campo} />
        </label>
        <label className={etichetta}>Password
          <input name="password" type="password" minLength={8} required={!corrente} autoComplete="new-password" className={campo} />
          <span className="text-caption font-normal text-ink-muted">{corrente ? "Lascia vuoto per non cambiarla." : "Almeno 8 caratteri."}</span>
        </label>
        {sonoIo ? <input type="hidden" name="ruolo" value={corrente.ruolo} /> : (
          <fieldset className="space-y-2">
            <legend className="mb-2 text-label">Ruolo</legend>
            <div className="flex gap-2">
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-title lg:text-display">Utenti</h1>
        <Link href="/admin/utenti?nuovo" className={btnPrimario}>Nuovo utente</Link>
      </div>

      <ul className={elencoAdmin}>
        {utenti.map((u) => (
          <li key={u.id} className={rigaAdmin}>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`font-semibold ${u.attivo ? "" : "text-ink-muted"}`}>{u.nome}</span>
                {!u.attivo && <span className="rounded-sm bg-surface-sunken px-2 py-1 text-label text-ink-muted">disattivato</span>}
              </div>
              <div className="text-caption text-ink-muted">{u.email} · {u.ruolo === "admin" ? "Admin" : "Operatore"}</div>
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
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}

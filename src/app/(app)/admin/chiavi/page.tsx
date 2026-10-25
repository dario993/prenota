import { richiediAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { BottoneElimina } from "@/components/FormAzione";
import { azioniAdmin, elencoAdmin, paginaAdmin, rigaAdmin } from "@/components/stili";
import { revocaChiave } from "./azioni";
import { NuovaChiave } from "./NuovaChiave";

type Chiave = { id: string; nome: string; autore: string; creata_il: Date; usata_il: Date | null };

const data = (d: Date) =>
  d.toLocaleString("it-IT", { timeZone: "Europe/Rome", dateStyle: "short", timeStyle: "short" });

export default async function Chiavi() {
  await richiediAdmin();
  const chiavi = await sql<Chiave[]>`
    select c.id, c.nome, u.nome as autore, c.creata_il, c.usata_il
    from chiavi_api c join utenti u on u.id = c.utente_id order by c.creata_il desc`;
  return (
    <main className={paginaAdmin}>
      <div>
        <h1 className="text-title lg:text-display">API key</h1>
        <p className="mt-1 text-caption text-ink-muted">
          Accesso remoto con pieni poteri di admin: <code>Authorization: Bearer &lt;chiave&gt;</code> su <code>POST /api/sql</code>.
          Revocala appena non serve più.
        </p>
      </div>
      <NuovaChiave />
      {chiavi.length === 0 ? <p className="py-6 text-center text-ink-muted">Nessuna chiave</p> : (
        <ul className={elencoAdmin}>
          {chiavi.map((c) => (
            <li key={c.id} className={rigaAdmin}>
              <div>
                <div className="font-semibold">{c.nome}</div>
                <div className="text-caption text-ink-muted">
                  {c.autore} · creata {data(c.creata_il)} · {c.usata_il ? `usata ${data(c.usata_il)}` : "mai usata"}
                </div>
              </div>
              <div className={azioniAdmin}>
                <BottoneElimina
                  azione={revocaChiave.bind(null, c.id)}
                  conferma={`Revocare la chiave ${c.nome}? Smetterà subito di funzionare.`}
                  nome={c.nome}
                  etichetta="Revoca"
                  successo="Revocata"
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

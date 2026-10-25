import { z } from "zod";
import { utenteCorrente } from "@/lib/auth";
import { sql } from "@/lib/db";
import { ERRORE_IMPREVISTO } from "@/lib/esito";
import type { VoceStorico } from "@/lib/calcoli";

// Cronologia di una prenotazione, dalla più recente.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await utenteCorrente())) return Response.json({ errore: "Sessione scaduta" }, { status: 401 });
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) return Response.json({ errore: "Prenotazione non trovata" }, { status: 404 });
  try {
    const voci = await sql`
      select s.il, u.nome as utente, s.azione, s.contrassegno, s.dati
      from prenotazioni_storico s left join utenti u on u.id = s.utente_id
      where s.prenotazione_id = ${id.data}
      order by s.il desc, s.id desc`;
    return Response.json(voci.map((v) => ({ ...v, il: new Date(v.il).toISOString() })) as VoceStorico[]);
  } catch (e) {
    console.error(e);
    return Response.json({ errore: ERRORE_IMPREVISTO }, { status: 500 });
  }
}

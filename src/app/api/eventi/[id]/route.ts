import { z } from "zod";
import { utenteCorrente } from "@/lib/auth";
import { sql } from "@/lib/db";
import { ERRORE_IMPREVISTO } from "@/lib/esito";
import type { DettaglioEvento, Prenotazione } from "@/lib/calcoli";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await utenteCorrente())) return Response.json({ errore: "Sessione scaduta" }, { status: 401 });
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) return Response.json({ errore: "Evento non trovato" }, { status: 404 });
  try {
    const [evento] = await sql`
      select e.id, e.data_ora, o.titolo, l.nome as locale, l.capienza,
             o.prezzo_adulto, o.prezzo_ridotto, o.prezzo_bambino,
             o.prezzo_pacchetto_teatro, o.prezzo_pacchetto_ristorante
      from eventi e
      join opere o on o.id = e.opera_id
      join locali l on l.id = e.locale_id
      where e.id = ${id.data}`;
    if (!evento) return Response.json({ errore: "Evento non trovato" }, { status: 404 });
    const prenotazioni = await sql`
      select id, evento_id, cognome_nome, telefono, adulti, ridotti, bambini, pacchetti, omaggi,
             ristorante, pasto, posti, provenienza, note,
             prezzo_adulto, prezzo_ridotto, prezzo_bambino, prezzo_pacchetto_teatro, prezzo_pacchetto_ristorante
      from prenotazioni where evento_id = ${id.data}`;
    const dettaglio = {
      evento: { ...evento, data_ora: new Date(evento.data_ora).toISOString() },
      prenotazioni: prenotazioni as unknown as Prenotazione[],
    } as DettaglioEvento;
    return Response.json(dettaglio);
  } catch (e) {
    console.error(e);
    return Response.json({ errore: ERRORE_IMPREVISTO }, { status: 500 });
  }
}

import { z } from "zod";
import { utenteCorrente } from "@/lib/auth";
import { sql } from "@/lib/db";
import { ERRORE_IMPREVISTO } from "@/lib/esito";
import type { EventoLista } from "@/lib/calcoli";

// ?passati=1: eventi prima di oggi, dal più recente; senza: da oggi in poi (Europe/Rome)
const schemaFiltro = z.object({ passati: z.literal("1").optional() });

export async function GET(req: Request) {
  if (!(await utenteCorrente())) return Response.json({ errore: "Sessione scaduta" }, { status: 401 });
  const filtro = schemaFiltro.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!filtro.success) return Response.json({ errore: "Richiesta non valida" }, { status: 400 });
  const passati = !!filtro.data.passati;
  const oggi = sql`date_trunc('day', now() at time zone 'Europe/Rome') at time zone 'Europe/Rome'`;
  try {
    const righe = await sql`
      select e.id, e.data_ora, o.titolo, l.nome as locale, l.capienza,
             coalesce(sum(p.adulti + p.ridotti + p.bambini + p.pacchetti + p.omaggi), 0)::int as persone
      from eventi e
      join opere o on o.id = e.opera_id
      join locali l on l.id = e.locale_id
      left join prenotazioni p on p.evento_id = e.id
      where ${passati ? sql`e.data_ora < ${oggi}` : sql`e.data_ora >= ${oggi}`}
      group by e.id, o.titolo, l.nome, l.capienza
      order by e.data_ora ${passati ? sql`desc` : sql``}`;
    const eventi: EventoLista[] = righe.map((r) => ({ ...(r as unknown as EventoLista), data_ora: new Date(r.data_ora).toISOString() }));
    return Response.json(eventi);
  } catch (e) {
    console.error(e);
    return Response.json({ errore: ERRORE_IMPREVISTO }, { status: 500 });
  }
}

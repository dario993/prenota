import { utenteCorrente } from "@/lib/auth";
import { sql } from "@/lib/db";
import { ERRORE_IMPREVISTO } from "@/lib/esito";

export async function GET() {
  if (!(await utenteCorrente())) return Response.json({ errore: "Sessione scaduta" }, { status: 401 });
  try {
    const righe = await sql`select distinct provenienza from prenotazioni where provenienza <> '' order by provenienza`;
    return Response.json(righe.map((r) => r.provenienza as string));
  } catch (e) {
    console.error(e);
    return Response.json({ errore: ERRORE_IMPREVISTO }, { status: 500 });
  }
}

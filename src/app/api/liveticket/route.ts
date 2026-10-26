import { utenteCorrente } from "@/lib/auth";
import { salvaOrdine } from "@/lib/liveticket-db";
import { schemaOrdineLiveticket } from "@/lib/schemi";

// Ordine LiveTicket letto da n8n: utente «api» con la sua chiave (o sessione admin). Un rinvio aggiorna, non duplica.
export async function POST(req: Request) {
  const utente = await utenteCorrente();
  if (!utente || (utente.ruolo !== "admin" && utente.ruolo !== "api")) return Response.json({ errore: "Non autorizzato" }, { status: 401 });
  const dati = schemaOrdineLiveticket.safeParse(await req.json().catch(() => null));
  if (!dati.success) return Response.json({ errore: dati.error.issues[0]?.message ?? "Richiesta non valida" }, { status: 400 });
  try {
    return Response.json({ ok: true, evento_id: await salvaOrdine(dati.data) });
  } catch (e) {
    console.error(e);
    return Response.json({ errore: "Errore imprevisto" }, { status: 500 });
  }
}

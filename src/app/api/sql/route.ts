import { z } from "zod";
import { utenteCorrente } from "@/lib/auth";
import { sql } from "@/lib/db";

// Gestione remota con chiave API (o sessione admin): esegue una query qualsiasi, con parametri $1, $2… opzionali.
const schemaQuery = z.object({
  query: z.string().trim().min(1),
  params: z.array(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
});

export async function POST(req: Request) {
  const utente = await utenteCorrente();
  if (!utente || utente.ruolo !== "admin") return Response.json({ errore: "Non autorizzato" }, { status: 401 });
  const dati = schemaQuery.safeParse(await req.json().catch(() => null));
  if (!dati.success) return Response.json({ errore: "Richiesta non valida: { query, params? }" }, { status: 400 });
  try {
    const righe = await sql.unsafe(dati.data.query, dati.data.params as never);
    return Response.json({ righe, conteggio: righe.count });
  } catch (e) {
    // errore SQL restituito per intero: chi chiama è admin e deve poter correggere la query
    return Response.json({ errore: (e as Error).message }, { status: 400 });
  }
}

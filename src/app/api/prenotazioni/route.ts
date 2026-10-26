import { utenteCorrente } from "@/lib/auth";
import { sql } from "@/lib/db";
import { ERRORE_IMPREVISTO } from "@/lib/esito";
import { schemaPrenotazione } from "@/lib/schemi";
import { inserisciRighe, TariffaNonValida } from "@/lib/righe";
import { registraStorico } from "@/lib/storico";

export async function POST(req: Request) {
  const utente = await utenteCorrente();
  if (!utente) return Response.json({ errore: "Sessione scaduta" }, { status: 401 });
  if (utente.ruolo === "visualizzatore") return Response.json({ errore: "Non autorizzato" }, { status: 403 });
  const corpo: unknown = await req.json().catch(() => null);
  if (!corpo || typeof corpo !== "object") return Response.json({ errore: "Dati non validi" }, { status: 400 });
  const dati = schemaPrenotazione.safeParse(corpo);
  if (!dati.success) return Response.json({ errore: dati.error.issues[0].message }, { status: 400 });
  const d = dati.data;
  try {
    // prezzi congelati dal tariffario dell'opera al primo inserimento; un reinvio con lo stesso id non fa nulla.
    // Le tariffe nascoste sono accettate: la prenotazione può essere nata offline prima che venissero nascoste.
    const nuova = await sql.begin(async (tx) => {
      const [p] = await tx`
        insert into prenotazioni (id, evento_id, cognome_nome, telefono, pacchetti, ristorante, pasto, posti,
          provenienza, note, creata_da, prezzo_pacchetto_teatro, prezzo_pacchetto_ristorante)
        select ${d.id}, e.id, ${d.cognome_nome}, ${d.telefono}, ${d.pacchetti}, ${d.ristorante}, ${d.pasto},
          ${d.posti}, ${d.provenienza}, ${d.note}, ${utente.id}, o.prezzo_pacchetto_teatro, o.prezzo_pacchetto_ristorante
        from eventi e join opere o on o.id = e.opera_id
        where e.id = ${d.evento_id}
        on conflict (id) do nothing
        returning id`;
      if (!p) return false;
      await inserisciRighe(tx, d.id, d.evento_id, d.righe);
      await registraStorico(tx, d.id, utente.id, "creata");
      return true;
    });
    if (nuova) return Response.json({ id: d.id }, { status: 201 });
    const [esistente] = await sql`select evento_id from prenotazioni where id = ${d.id}`;
    if (!esistente) return Response.json({ errore: "Evento non trovato" }, { status: 404 });
    if (esistente.evento_id !== d.evento_id)
      return Response.json({ errore: "Prenotazione non valida" }, { status: 400 });
    return Response.json({ id: d.id });
  } catch (e) {
    if (e instanceof TariffaNonValida) return Response.json({ errore: e.message }, { status: 400 });
    console.error(e);
    return Response.json({ errore: ERRORE_IMPREVISTO }, { status: 500 });
  }
}

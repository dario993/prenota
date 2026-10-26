"use server";

import { z } from "zod";
import { utenteCorrente } from "@/lib/auth";
import { sql } from "@/lib/db";
import { ERRORE_IMPREVISTO, type Esito } from "@/lib/esito";
import { schemaPrenotazione, type DatiPrenotazione } from "@/lib/schemi";
import { aggiornaRighe, TariffaNonValida } from "@/lib/righe";
import { registraStorico } from "@/lib/storico";
import { CONTRASSEGNI, type Contrassegno } from "@/lib/calcoli";

// I prezzi congelati non vengono toccati (una tariffa aggiunta prende il prezzo attuale); evento_id non cambia.
export async function modificaPrenotazione(dati: DatiPrenotazione): Promise<Esito> {
  const utente = await utenteCorrente();
  if (!utente) return { errore: "Sessione scaduta" };
  const v = schemaPrenotazione.safeParse(dati);
  if (!v.success) return { errore: v.error.issues[0].message };
  const d = v.data;
  try {
    const trovata = await sql.begin(async (tx) => {
      const r = await tx`
        update prenotazioni set cognome_nome = ${d.cognome_nome}, telefono = ${d.telefono},
          pacchetti = ${d.pacchetti}, ristorante = ${d.ristorante}, pasto = ${d.pasto}, posti = ${d.posti},
          provenienza = ${d.provenienza}, note = ${d.note}, pagamento = ${d.pagamento}, aggiornata_il = now()
        where id = ${d.id} and evento_id = ${d.evento_id}`;
      if (r.count === 0) return false;
      await aggiornaRighe(tx, d.id, d.evento_id, d.righe);
      await registraStorico(tx, d.id, utente.id, "modificata");
      return true;
    });
    if (!trovata) return { errore: "Prenotazione non trovata" };
  } catch (e) {
    if (e instanceof TariffaNonValida) return { errore: e.message };
    console.error(e);
    return { errore: ERRORE_IMPREVISTO };
  }
  return { ok: true };
}

export async function eliminaPrenotazione(id: string): Promise<Esito> {
  if (!(await utenteCorrente())) return { errore: "Sessione scaduta" };
  const uuid = z.uuid().safeParse(id);
  if (!uuid.success) return { errore: "Prenotazione non trovata" };
  try {
    const r = await sql`delete from prenotazioni where id = ${uuid.data}`;
    if (r.count === 0) return { errore: "Prenotazione non trovata" };
  } catch (e) {
    console.error(e);
    return { errore: ERRORE_IMPREVISTO };
  }
  return { ok: true };
}

// Ordine scelto a mano: gli id dell'evento nell'ordine voluto (quelle non elencate restano in fondo).
const schemaRiordino = z.object({ evento_id: z.uuid(), ids: z.array(z.uuid()).max(5000) });
export async function riordinaPrenotazioni(evento_id: string, ids: string[]): Promise<Esito> {
  if (!(await utenteCorrente())) return { errore: "Sessione scaduta" };
  const v = schemaRiordino.safeParse({ evento_id, ids });
  if (!v.success) return { errore: "Dati non validi" };
  try {
    await sql`
      update prenotazioni p set ordine = x.n
      from unnest(${v.data.ids}::uuid[]) with ordinality as x (id, n)
      where p.id = x.id and p.evento_id = ${v.data.evento_id}`;
  } catch (e) {
    console.error(e);
    return { errore: ERRORE_IMPREVISTO };
  }
  return { ok: true };
}

const schemaContrassegno = z.object({ id: z.uuid(), contrassegno: z.enum(CONTRASSEGNI).nullable() });
export async function contrassegnaPrenotazione(id: string, contrassegno: Contrassegno | null): Promise<Esito> {
  const utente = await utenteCorrente();
  if (!utente) return { errore: "Sessione scaduta" };
  const v = schemaContrassegno.safeParse({ id, contrassegno });
  if (!v.success) return { errore: "Dati non validi" };
  try {
    const trovata = await sql.begin(async (tx) => {
      const r = await tx`update prenotazioni set contrassegno = ${v.data.contrassegno} where id = ${v.data.id}`;
      if (r.count === 0) return false;
      await registraStorico(tx, v.data.id, utente.id, "stato");
      return true;
    });
    if (!trovata) return { errore: "Prenotazione non trovata" };
  } catch (e) {
    console.error(e);
    return { errore: ERRORE_IMPREVISTO };
  }
  return { ok: true };
}

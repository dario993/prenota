"use server";

import { z } from "zod";
import { utenteCorrente } from "@/lib/auth";
import { sql } from "@/lib/db";
import { ERRORE_IMPREVISTO, type Esito } from "@/lib/esito";
import { schemaPrenotazione, type DatiPrenotazione } from "@/lib/schemi";

// I prezzi congelati non vengono toccati; evento_id non cambia.
export async function modificaPrenotazione(dati: DatiPrenotazione): Promise<Esito> {
  if (!(await utenteCorrente())) return { errore: "Sessione scaduta" };
  const v = schemaPrenotazione.safeParse(dati);
  if (!v.success) return { errore: v.error.issues[0].message };
  const d = v.data;
  try {
    const r = await sql`
      update prenotazioni set cognome_nome = ${d.cognome_nome}, telefono = ${d.telefono},
        adulti = ${d.adulti}, ridotti = ${d.ridotti}, bambini = ${d.bambini}, pacchetti = ${d.pacchetti},
        omaggi = ${d.omaggi}, ristorante = ${d.ristorante}, pasto = ${d.pasto}, posti = ${d.posti},
        provenienza = ${d.provenienza}, note = ${d.note}, aggiornata_il = now()
      where id = ${d.id} and evento_id = ${d.evento_id}`;
    if (r.count === 0) return { errore: "Prenotazione non trovata" };
  } catch (e) {
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

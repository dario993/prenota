"use server";

import { z } from "zod";
import { utenteCorrente } from "@/lib/auth";
import { sql } from "@/lib/db";
import { ERRORE_IMPREVISTO, type Esito } from "@/lib/esito";
import { schemaPrenotazione, type DatiPrenotazione } from "@/lib/schemi";
import { aggiornaRighe, TariffaNonValida } from "@/lib/righe";

// I prezzi congelati non vengono toccati (una tariffa aggiunta prende il prezzo attuale); evento_id non cambia.
export async function modificaPrenotazione(dati: DatiPrenotazione): Promise<Esito> {
  if (!(await utenteCorrente())) return { errore: "Sessione scaduta" };
  const v = schemaPrenotazione.safeParse(dati);
  if (!v.success) return { errore: v.error.issues[0].message };
  const d = v.data;
  try {
    const trovata = await sql.begin(async (tx) => {
      const r = await tx`
        update prenotazioni set cognome_nome = ${d.cognome_nome}, telefono = ${d.telefono},
          pacchetti = ${d.pacchetti}, ristorante = ${d.ristorante}, pasto = ${d.pasto}, posti = ${d.posti},
          provenienza = ${d.provenienza}, note = ${d.note}, aggiornata_il = now()
        where id = ${d.id} and evento_id = ${d.evento_id}`;
      if (r.count === 0) return false;
      await aggiornaRighe(tx, d.id, d.evento_id, d.righe);
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

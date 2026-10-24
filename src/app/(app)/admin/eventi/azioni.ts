"use server";

import { revalidatePath } from "next/cache";
import { verificaAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { schemaEvento } from "@/lib/schemi";
import { z } from "zod";
import { ERRORE_IMPREVISTO, type Esito } from "@/lib/esito";

// ::text prima di ::timestamp: altrimenti postgres.js converte la stringa in Date col fuso del server e l'ora cambia.
export async function salvaEvento(fd: FormData): Promise<Esito> {
  await verificaAdmin();
  const dati = schemaEvento.safeParse(Object.fromEntries(fd));
  if (!dati.success) return { errore: dati.error.issues[0].message };
  const d = dati.data;
  const id = z.uuid().safeParse(fd.get("id"));
  try {
    if (id.success) {
      const r = await sql`update eventi set opera_id = ${d.opera_id}, locale_id = ${d.locale_id},
        data_ora = ${d.data_ora}::text::timestamp at time zone 'Europe/Rome' where id = ${id.data}`;
      if (r.count === 0) return { errore: "Evento non trovato" };
    } else {
      await sql`insert into eventi (opera_id, locale_id, data_ora)
        values (${d.opera_id}, ${d.locale_id}, ${d.data_ora}::text::timestamp at time zone 'Europe/Rome')`;
    }
  } catch (e) {
    if ((e as { code?: string }).code === "23503") return { errore: "Opera o locale non trovati" };
    console.error(e);
    return { errore: ERRORE_IMPREVISTO };
  }
  revalidatePath("/admin/eventi");
  return { ok: true };
}

export async function eliminaEvento(id: string): Promise<Esito> {
  await verificaAdmin();
  const uuid = z.uuid().safeParse(id);
  if (!uuid.success) return { errore: "Evento non valido" };
  try {
    await sql`delete from eventi where id = ${uuid.data}`;
  } catch (e) {
    if ((e as { code?: string }).code === "23503")
      return { errore: "Impossibile eliminare: ci sono prenotazioni" };
    console.error(e);
    return { errore: ERRORE_IMPREVISTO };
  }
  revalidatePath("/admin/eventi");
  return { ok: true };
}

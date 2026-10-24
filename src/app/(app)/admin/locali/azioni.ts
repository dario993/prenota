"use server";

import { revalidatePath } from "next/cache";
import { verificaAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { schemaLocale } from "@/lib/schemi";
import { z } from "zod";
import { ERRORE_IMPREVISTO, type Esito } from "@/lib/esito";

export async function salvaLocale(fd: FormData): Promise<Esito> {
  await verificaAdmin();
  const dati = schemaLocale.safeParse(Object.fromEntries(fd));
  if (!dati.success) return { errore: dati.error.issues[0].message };
  const id = z.uuid().safeParse(fd.get("id"));
  try {
    if (id.success) {
    const r = await sql`update locali set nome = ${dati.data.nome}, capienza = ${dati.data.capienza} where id = ${id.data}`;
      if (r.count === 0) return { errore: "Locale non trovato" };
    } else {
    await sql`insert into locali (nome, capienza) values (${dati.data.nome}, ${dati.data.capienza})`;
    }
  } catch {
    return { errore: ERRORE_IMPREVISTO };
  }
  revalidatePath("/admin/locali");
  return { ok: true };
}

export async function eliminaLocale(id: string): Promise<Esito> {
  await verificaAdmin();
  const uuid = z.uuid().safeParse(id);
  if (!uuid.success) return { errore: "Locale non valido" };
  try {
    await sql`delete from locali where id = ${uuid.data}`;
  } catch (e) {
    if ((e as { code?: string }).code === "23503")
      return { errore: "Impossibile eliminare: ci sono eventi collegati" };
    return { errore: ERRORE_IMPREVISTO };
  }
  revalidatePath("/admin/locali");
  return { ok: true };
}

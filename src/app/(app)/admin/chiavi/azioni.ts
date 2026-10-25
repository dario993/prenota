"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { hashChiave, verificaAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { z } from "zod";
import { ERRORE_IMPREVISTO, type Esito } from "@/lib/esito";

// Ritorna la chiave in chiaro: è l'unica volta, nel database resta solo l'hash.
export async function creaChiave(nome: string): Promise<{ chiave: string } | { errore: string }> {
  const me = await verificaAdmin();
  const n = z.string().trim().min(1, "Nome obbligatorio").max(80).safeParse(nome);
  if (!n.success) return { errore: n.error.issues[0].message };
  const chiave = `prenota_${randomBytes(32).toString("base64url")}`;
  try {
    await sql`insert into chiavi_api (nome, hash, utente_id) values (${n.data}, ${hashChiave(chiave)}, ${me.id})`;
  } catch (e) {
    console.error(e);
    return { errore: ERRORE_IMPREVISTO };
  }
  revalidatePath("/admin/chiavi");
  return { chiave };
}

export async function revocaChiave(id: string): Promise<Esito> {
  await verificaAdmin();
  const uuid = z.uuid().safeParse(id);
  if (!uuid.success) return { errore: "Chiave non valida" };
  try {
    await sql`delete from chiavi_api where id = ${uuid.data}`;
  } catch (e) {
    console.error(e);
    return { errore: ERRORE_IMPREVISTO };
  }
  revalidatePath("/admin/chiavi");
  return { ok: true };
}

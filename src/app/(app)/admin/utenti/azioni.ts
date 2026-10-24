"use server";

import { revalidatePath } from "next/cache";
import { verificaAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { hashPassword } from "@/lib/password.mjs";
import { schemaUtente } from "@/lib/schemi";
import { z } from "zod";
import { ERRORE_IMPREVISTO, type Esito } from "@/lib/esito";

export async function salvaUtente(fd: FormData): Promise<Esito> {
  const me = await verificaAdmin();
  const dati = schemaUtente.safeParse(Object.fromEntries(fd));
  if (!dati.success) return { errore: dati.error.issues[0].message };
  const d = dati.data;
  const id = z.uuid().safeParse(fd.get("id"));
  if (id.success && id.data === me.id && d.ruolo !== "admin")
    return { errore: "Non puoi declassare te stesso" };
  if (!id.success && !d.password) return { errore: "Password obbligatoria (almeno 8 caratteri)" };
  try {
    const hash = d.password ? await hashPassword(d.password) : null;
    if (id.success) {
      const r = await sql`update utenti set nome = ${d.nome}, email = ${d.email}, ruolo = ${d.ruolo},
        password_hash = coalesce(${hash}::text, password_hash) where id = ${id.data}`;
      if (r.count === 0) return { errore: "Utente non trovato" };
    } else {
      await sql`insert into utenti (nome, email, password_hash, ruolo) values (${d.nome}, ${d.email}, ${hash}, ${d.ruolo})`;
    }
  } catch (e) {
    if ((e as { code?: string }).code === "23505") return { errore: "Email già in uso" };
    console.error(e);
    return { errore: ERRORE_IMPREVISTO };
  }
  revalidatePath("/admin/utenti");
  return { ok: true };
}

export async function attivaUtente(id: string, attivo: boolean): Promise<Esito> {
  const me = await verificaAdmin();
  const uuid = z.uuid().safeParse(id);
  if (!uuid.success) return { errore: "Utente non valido" };
  if (!attivo && uuid.data === me.id) return { errore: "Non puoi disattivare te stesso" };
  try {
    const r = await sql`update utenti set attivo = ${attivo} where id = ${uuid.data}`;
    if (r.count === 0) return { errore: "Utente non trovato" };
    if (!attivo) await sql`delete from sessioni where utente_id = ${uuid.data}`;
  } catch (e) {
    console.error(e);
    return { errore: ERRORE_IMPREVISTO };
  }
  revalidatePath("/admin/utenti");
  return { ok: true };
}

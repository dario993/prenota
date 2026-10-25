"use server";

import { revalidatePath } from "next/cache";
import { nuovaChiave, verificaAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { hashPassword } from "@/lib/password.mjs";
import { schemaUtente } from "@/lib/schemi";
import { z } from "zod";
import { ERRORE_IMPREVISTO, type Esito } from "@/lib/esito";

// true se `id` è un admin attivo e non ce ne sono altri.
async function ultimoAdmin(id: string): Promise<boolean> {
  const [r] = await sql<{ ultimo: boolean }[]>`
    select exists(select 1 from utenti where id = ${id} and ruolo = 'admin' and attivo)
      and not exists(select 1 from utenti where id <> ${id} and ruolo = 'admin' and attivo) as ultimo`;
  return r.ultimo;
}

export async function salvaUtente(fd: FormData): Promise<Esito> {
  const me = await verificaAdmin();
  const dati = schemaUtente.safeParse(Object.fromEntries(fd));
  if (!dati.success) return { errore: dati.error.issues[0].message };
  const d = dati.data;
  const id = z.uuid().transform((v) => v.toLowerCase()).safeParse(fd.get("id"));
  if (id.success && id.data === me.id && d.ruolo !== "admin")
    return { errore: "Non puoi declassare te stesso" };
  if (!id.success && d.ruolo !== "api" && !d.password) return { errore: "Password obbligatoria (almeno 8 caratteri)" };
  try {
    if (id.success) {
      // un utente «api» non ha password: non si passa da api a persona e viceversa
      const [prima] = await sql<{ ruolo: string }[]>`select ruolo from utenti where id = ${id.data}`;
      if (!prima) return { errore: "Utente non trovato" };
      if ((prima.ruolo === "api") !== (d.ruolo === "api"))
        return { errore: "Il tipo API key non si cambia: crea un nuovo utente" };
    }
    if (id.success && d.ruolo !== "admin" && (await ultimoAdmin(id.data)))
      return { errore: "Deve restare almeno un admin attivo" };
    if (!id.success && d.ruolo === "api") {
      const { chiave, hash } = nuovaChiave();
      await sql`insert into utenti (nome, email, password_hash, ruolo) values (${d.nome}, ${d.email}, ${hash}, 'api')`;
      revalidatePath("/admin/utenti");
      return { ok: true, chiave };
    }
    const hash = d.password && d.ruolo !== "api" ? await hashPassword(d.password) : null;
    if (id.success) {
      const r = await sql`update utenti set nome = ${d.nome}, email = ${d.email}, ruolo = ${d.ruolo},
        password_hash = coalesce(${hash}::text, password_hash) where id = ${id.data}`;
      if (r.count === 0) return { errore: "Utente non trovato" };
      if (hash) await sql`delete from sessioni where utente_id = ${id.data}`;
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
  const uuid = z.uuid().transform((v) => v.toLowerCase()).safeParse(id);
  if (!uuid.success) return { errore: "Utente non valido" };
  if (!attivo && uuid.data === me.id) return { errore: "Non puoi disattivare te stesso" };
  try {
    if (!attivo && (await ultimoAdmin(uuid.data))) return { errore: "Deve restare almeno un admin attivo" };
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

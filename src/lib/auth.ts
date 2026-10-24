import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sql } from "./db";
import { verificaPassword } from "./password.mjs";

export type Utente = {
  id: string;
  nome: string;
  email: string;
  ruolo: "admin" | "operatore";
};

export const COOKIE_SESSIONE = "sessione";
const DURATA_SECONDI = 30 * 24 * 60 * 60; // fissa, senza rinnovo

export async function utenteCorrente(): Promise<Utente | null> {
  const token = (await cookies()).get(COOKIE_SESSIONE)?.value;
  if (!token) return null;
  const [u] = await sql<Utente[]>`
    select u.id, u.nome, u.email, u.ruolo
    from sessioni s join utenti u on u.id = s.utente_id
    where s.id = ${token} and u.attivo and s.scade_il > now()`;
  return u ?? null;
}

export async function richiediUtente(): Promise<Utente> {
  const u = await utenteCorrente();
  if (!u) redirect("/login");
  return u;
}

// Per le pagine: l'operatore torna alla home.
export async function richiediAdmin(): Promise<Utente> {
  const u = await richiediUtente();
  if (u.ruolo !== "admin") redirect("/");
  return u;
}

// Per le Server Action: lancia invece di reindirizzare.
export async function verificaAdmin(): Promise<Utente> {
  const u = await utenteCorrente();
  if (!u || u.ruolo !== "admin") throw new Error("Non autorizzato");
  return u;
}

export async function accedi(email: string, password: string): Promise<boolean> {
  const [u] = await sql<{ id: string; password_hash: string }[]>`
    select id, password_hash from utenti where email = ${email} and attivo`;
  if (!u || !(await verificaPassword(password, u.password_hash))) return false;

  const token = randomBytes(32).toString("base64url");
  await sql`
    insert into sessioni (id, utente_id, scade_il)
    values (${token}, ${u.id}, now() + make_interval(secs => ${DURATA_SECONDI}))`;
  (await cookies()).set(COOKIE_SESSIONE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: DURATA_SECONDI,
    path: "/",
  });
  return true;
}

export async function esci(): Promise<void> {
  const c = await cookies();
  const token = c.get(COOKIE_SESSIONE)?.value;
  if (token) await sql`delete from sessioni where id = ${token}`;
  c.delete(COOKIE_SESSIONE);
}

import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { sql } from "./db";
import { hashPassword, verificaPassword } from "./password.mjs";

export type Utente = {
  id: string;
  nome: string;
  email: string | null; // null per gli utenti «api»
  ruolo: "admin" | "operatore" | "visualizzatore" | "api";
};

export const COOKIE_SESSIONE = "sessione";
const DURATA_SECONDI = 30 * 24 * 60 * 60; // fissa, senza rinnovo

// Utente di tipo «api»: la chiave sta in password_hash come sha256 (formato diverso da scrypt, quindi niente login web).
const hashChiave = (chiave: string) => `sha256$${createHash("sha256").update(chiave).digest("hex")}`;

export function nuovaChiave(): { chiave: string; hash: string } {
  const chiave = `prenota_${randomBytes(32).toString("base64url")}`;
  return { chiave, hash: hashChiave(chiave) };
}

// Authorization: Bearer <chiave> di un utente «api» attivo.
async function utenteDaChiave(chiave: string): Promise<Utente | null> {
  const [u] = await sql<Utente[]>`
    select id, nome, email, ruolo from utenti
    where ruolo = 'api' and attivo and password_hash = ${hashChiave(chiave)}`;
  return u ?? null;
}

export async function utenteCorrente(): Promise<Utente | null> {
  const bearer = (await headers()).get("authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1];
  if (bearer) return utenteDaChiave(bearer);
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

async function creaSessione(utenteId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  await sql`
    insert into sessioni (id, utente_id, scade_il)
    values (${token}, ${utenteId}, now() + make_interval(secs => ${DURATA_SECONDI}))`;
  (await cookies()).set(COOKIE_SESSIONE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: DURATA_SECONDI,
    path: "/",
  });
}

export async function accedi(email: string, password: string): Promise<boolean> {
  const [u] = await sql<{ id: string; password_hash: string }[]>`
    select id, password_hash from utenti where email = ${email} and attivo`;
  if (!u || !(await verificaPassword(password, u.password_hash))) return false;

  await creaSessione(u.id);
  return true;
}

export async function esci(): Promise<void> {
  const c = await cookies();
  const token = c.get(COOKIE_SESSIONE)?.value;
  if (token) await sql`delete from sessioni where id = ${token}`;
  c.delete(COOKIE_SESSIONE);
}

export async function ciSonoUtenti(): Promise<boolean> {
  const [r] = await sql<{ e: boolean }[]>`select exists(select 1 from utenti) as e`;
  return r.e;
}

// Crea il primo admin solo se la tabella utenti è vuota. Il controllo iniziale evita hash e lock
// quando ci sono già utenti; il lock esclusivo serializza due invii simultanei: il secondo vede l'utente del primo.
export async function creaPrimoAdmin(d: {
  nome: string;
  email: string;
  password: string;
}): Promise<boolean> {
  if (await ciSonoUtenti()) return false;
  const hash = await hashPassword(d.password);
  const id = await sql.begin(async (tx) => {
    await tx`lock table utenti in exclusive mode`;
    const [r] = await tx<{ id: string }[]>`
      insert into utenti (nome, email, password_hash, ruolo, attivo)
      select ${d.nome}, ${d.email}, ${hash}, 'admin', true
      where not exists (select 1 from utenti)
      returning id`;
    return r?.id;
  });
  if (!id) return false;
  await creaSessione(id);
  return true;
}

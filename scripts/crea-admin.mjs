import postgres from "postgres";
import { hashPassword } from "../src/lib/password.mjs";

const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD ?? "";
const nome = (process.env.ADMIN_NOME ?? "").trim();

if (!email || !nome || password.length < 8) {
  console.error("Servono ADMIN_EMAIL, ADMIN_NOME e ADMIN_PASSWORD (almeno 8 caratteri).");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL);
try {
  const hash = await hashPassword(password);
  await sql`
    insert into utenti (nome, email, password_hash, ruolo, attivo)
    values (${nome}, ${email}, ${hash}, 'admin', true)
    on conflict (email) do update
      set password_hash = excluded.password_hash, ruolo = 'admin', attivo = true`;
  console.log(`Admin ${email} pronto.`);
} finally {
  await sql.end();
}

import { readdirSync, readFileSync } from "node:fs";
import postgres from "postgres";

// Schema (stato finale, idempotente) e poi le migrazioni in ordine: ognuna idempotente, in una transazione.
const sql = postgres(process.env.DATABASE_URL, { onnotice: () => {} });
try {
  await sql.unsafe(readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8"));
  console.log("Schema applicato.");
  const cartella = new URL("../db/migrazioni/", import.meta.url);
  for (const file of readdirSync(cartella).filter((f) => f.endsWith(".sql")).sort()) {
    await sql.begin((tx) => tx.unsafe(readFileSync(new URL(file, cartella), "utf8")));
    console.log(`Migrazione ${file} eseguita.`);
  }
} finally {
  await sql.end();
}

import "server-only";
import postgres from "postgres";

const globale = globalThis as unknown as { __sql?: postgres.Sql };

export const sql = globale.__sql ?? postgres(process.env.DATABASE_URL!);

if (process.env.NODE_ENV !== "production") globale.__sql = sql;

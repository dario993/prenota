"use server";

import { revalidatePath } from "next/cache";
import { verificaAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { schemaOpera } from "@/lib/schemi";
import { z } from "zod";
import { ERRORE_IMPREVISTO, type Esito } from "@/lib/esito";

export async function salvaOpera(fd: FormData): Promise<Esito> {
  await verificaAdmin();
  const dati = schemaOpera.safeParse(Object.fromEntries(fd));
  if (!dati.success) return { errore: dati.error.issues[0].message };
  const d = dati.data;
  const id = z.uuid().safeParse(fd.get("id"));
  try {
    if (id.success) {
      const r = await sql`update opere set titolo = ${d.titolo}, prezzo_adulto = ${d.prezzo_adulto},
        prezzo_ridotto = ${d.prezzo_ridotto}, prezzo_bambino = ${d.prezzo_bambino},
        prezzo_pacchetto_teatro = ${d.prezzo_pacchetto_teatro},
        prezzo_pacchetto_ristorante = ${d.prezzo_pacchetto_ristorante} where id = ${id.data}`;
      if (r.count === 0) return { errore: "Opera non trovata" };
    } else {
      await sql`insert into opere (titolo, prezzo_adulto, prezzo_ridotto, prezzo_bambino,
        prezzo_pacchetto_teatro, prezzo_pacchetto_ristorante)
        values (${d.titolo}, ${d.prezzo_adulto}, ${d.prezzo_ridotto}, ${d.prezzo_bambino},
        ${d.prezzo_pacchetto_teatro}, ${d.prezzo_pacchetto_ristorante})`;
    }
  } catch (e) {
    console.error(e);
    return { errore: ERRORE_IMPREVISTO };
  }
  revalidatePath("/admin/opere");
  return { ok: true };
}

export async function eliminaOpera(id: string): Promise<Esito> {
  await verificaAdmin();
  const uuid = z.uuid().safeParse(id);
  if (!uuid.success) return { errore: "Opera non valida" };
  try {
    await sql`delete from opere where id = ${uuid.data}`;
  } catch (e) {
    if ((e as { code?: string }).code === "23503")
      return { errore: "Impossibile eliminare: ci sono eventi collegati" };
    console.error(e);
    return { errore: ERRORE_IMPREVISTO };
  }
  revalidatePath("/admin/opere");
  return { ok: true };
}

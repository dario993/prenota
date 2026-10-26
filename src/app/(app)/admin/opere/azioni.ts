"use server";

import { revalidatePath } from "next/cache";
import { verificaAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { schemaOpera } from "@/lib/schemi";
import { z } from "zod";
import { ERRORE_IMPREVISTO, type Esito } from "@/lib/esito";

// Opera e tariffario in un colpo solo. Tariffe: con id = modifica, senza = nuova, assenti = da eliminare
// (solo se mai usate: altrimenti nulla cambia e l'admin può nasconderle). Ordine = posizione nell'elenco.
export async function salvaOpera(id: string | null, dati: unknown): Promise<Esito> {
  await verificaAdmin();
  const v = schemaOpera.safeParse(dati);
  if (!v.success) return { errore: v.error.issues[0].message };
  const d = v.data;
  const uuid = id === null ? undefined : z.uuid().safeParse(id);
  if (uuid && !uuid.success) return { errore: "Opera non trovata" };
  try {
    return await sql.begin(async (tx): Promise<Esito> => {
      let operaId: string;
      if (uuid) {
        const r = await tx`update opere set titolo = ${d.titolo}, prezzo_pacchetto_teatro = ${d.prezzo_pacchetto_teatro},
          prezzo_pacchetto_ristorante = ${d.prezzo_pacchetto_ristorante}, pacchetto_nascosto = ${d.pacchetto_nascosto}
          where id = ${uuid.data}`;
        if (r.count === 0) return { errore: "Opera non trovata" };
        operaId = uuid.data;
      } else {
        const [o] = await tx`insert into opere (titolo, prezzo_pacchetto_teatro, prezzo_pacchetto_ristorante, pacchetto_nascosto)
          values (${d.titolo}, ${d.prezzo_pacchetto_teatro}, ${d.prezzo_pacchetto_ristorante}, ${d.pacchetto_nascosto})
          returning id`;
        operaId = o.id;
      }
      const tenute = d.tariffe.flatMap((t) => (t.id ? [t.id] : []));
      const [usata] = await tx`select t.nome from tariffe t
        where t.opera_id = ${operaId} and t.id <> all(${tenute}::uuid[])
          and (exists (select 1 from prenotazioni_tariffe r where r.tariffa_id = t.id)
            or exists (select 1 from liveticket_ordini lo, jsonb_array_elements(lo.biglietti) b where b->>'tariffa_id' = t.id::text))
        limit 1`;
      if (usata) throw new Rifiuto(`Impossibile eliminare «${usata.nome}»: usata da prenotazioni o ordini LiveTicket. Puoi nasconderla`);
      await tx`delete from tariffe where opera_id = ${operaId} and id <> all(${tenute}::uuid[])`;
      // nome provvisorio (l'id): due tariffe possono scambiarsi il nome senza urtare l'indice unico
      for (const t of d.tariffe) {
        if (!t.id) continue;
        const r = await tx`update tariffe set nome = id::text where id = ${t.id} and opera_id = ${operaId}`;
        if (r.count === 0) throw new Rifiuto("Tariffa non trovata");
      }
      for (const [i, t] of d.tariffe.entries()) {
        if (t.id) await tx`update tariffe set nome = ${t.nome}, prezzo = ${t.prezzo}, nascosta = ${t.nascosta}, ordine = ${i + 1}
          where id = ${t.id}`;
        else await tx`insert into tariffe (opera_id, nome, prezzo, nascosta, ordine)
          values (${operaId}, ${t.nome}, ${t.prezzo}, ${t.nascosta}, ${i + 1})`;
      }
      return { ok: true };
    });
  } catch (e) {
    if (e instanceof Rifiuto) return { errore: e.message };
    if ((e as { code?: string }).code === "23505") return { errore: "Tariffa ripetuta" };
    console.error(e);
    return { errore: ERRORE_IMPREVISTO };
  } finally {
    revalidatePath("/admin/opere");
  }
}

// errore previsto che annulla la transazione e arriva all'admin così com'è
class Rifiuto extends Error {}

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

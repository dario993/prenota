import "server-only";
import type { z } from "zod";
import type { Tariffa } from "./calcoli";
import { sql } from "./db";
import { abbinaEvento, assegnaBiglietti, cognomeNome } from "./liveticket";
import type { schemaOrdineLiveticket } from "./schemi";

/** Salva (o aggiorna) un ordine LiveTicket: abbina l'evento, assegna i biglietti, upsert su `codice`. Ritorna l'evento abbinato. */
export async function salvaOrdine(o: z.infer<typeof schemaOrdineLiveticket>): Promise<string | null> {
  // data e ora sono locali Europe/Rome; il server è in UTC
  const [{ ts }] = await sql<{ ts: Date | null }[]>`
    select case when ${o.data}::text is not null and ${o.ora}::text is not null
      then (${o.data}::text || ' ' || ${o.ora}::text)::timestamp at time zone 'Europe/Rome' end as ts`;
  const eventi = ts
    ? await sql<{ id: string; data_ora: Date; opera_id: string }[]>`select id, data_ora, opera_id from eventi where data_ora = ${ts}`
    : [];
  const eventoId = abbinaEvento(ts?.toISOString() ?? null, eventi.map((e) => ({ id: e.id, data_ora: e.data_ora.toISOString() })));
  let tariffe: Tariffa[] = [];
  let prezzi = { prezzo_pacchetto_teatro: 0, prezzo_pacchetto_ristorante: 0 };
  if (eventoId) {
    const operaId = eventi.find((e) => e.id === eventoId)!.opera_id;
    tariffe = await sql<Tariffa[]>`select id, nome, prezzo, nascosta, ordine from tariffe where opera_id = ${operaId}`;
    [prezzi] = await sql<(typeof prezzi)[]>`select prezzo_pacchetto_teatro, prezzo_pacchetto_ristorante from opere where id = ${operaId}`;
  }
  const { biglietti, anomalie } = assegnaBiglietti({
    biglietti: o.biglietti, tariffe, prezzi, importo_pagato: o.importo_pagato, anomalieLettura: o.anomalie,
  });
  await sql`
    insert into liveticket_ordini (codice, cognome_nome, telefono, spettacolo, data_ora, evento_id, biglietti_dichiarati,
      biglietti, importo_pagato, anomalie, email_id, email_data)
    values (${o.codice}, ${cognomeNome(o.nome, o.cognome)}, ${o.telefono ?? ""}, ${o.spettacolo}, ${ts}, ${eventoId},
      ${o.biglietti_dichiarati}, ${sql.json(biglietti as never)}, ${o.importo_pagato}, ${anomalie}, ${o.email_id}, ${o.email_data})
    on conflict (codice) do update set cognome_nome = excluded.cognome_nome, telefono = excluded.telefono,
      spettacolo = excluded.spettacolo, data_ora = excluded.data_ora, evento_id = excluded.evento_id,
      biglietti_dichiarati = excluded.biglietti_dichiarati, biglietti = excluded.biglietti,
      importo_pagato = excluded.importo_pagato, anomalie = excluded.anomalie, email_id = excluded.email_id,
      email_data = excluded.email_data, aggiornato_il = now()`;
  return eventoId;
}

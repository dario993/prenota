import "server-only";
import type { z } from "zod";
import type { PrezziPacchetto, Tariffa } from "./calcoli";
import { sql } from "./db";
import { ANOMALIA_IMPORTO, ANOMALIA_TARIFFA, abbinaEvento, assegnaBiglietti, cognomeNome, type BigliettoLiveticket } from "./liveticket";
import type { schemaOrdineLiveticket } from "./schemi";

/** L'evento alla data e ora `ts` (null se zero o più di uno) con tariffe e prezzi pacchetto della sua opera. */
async function contestoEvento(ts: Date | null) {
  const eventi = ts
    ? await sql<{ id: string; data_ora: Date; opera_id: string }[]>`select id, data_ora, opera_id from eventi where data_ora = ${ts}`
    : [];
  const eventoId = abbinaEvento(ts?.toISOString() ?? null, eventi.map((e) => ({ id: e.id, data_ora: e.data_ora.toISOString() })));
  let tariffe: Tariffa[] = [];
  let prezzi: PrezziPacchetto = { prezzo_pacchetto_teatro: 0, prezzo_pacchetto_ristorante: 0 };
  if (eventoId) {
    const operaId = eventi.find((e) => e.id === eventoId)!.opera_id;
    tariffe = await sql<Tariffa[]>`select id, nome, prezzo, nascosta, ordine from tariffe where opera_id = ${operaId}`;
    [prezzi] = await sql<PrezziPacchetto[]>`select prezzo_pacchetto_teatro, prezzo_pacchetto_ristorante from opere where id = ${operaId}`;
  }
  return { eventoId, tariffe, prezzi };
}

/** Salva (o aggiorna) un ordine LiveTicket: abbina l'evento, assegna i biglietti, upsert su `codice`. Ritorna l'evento abbinato. */
export async function salvaOrdine(o: z.infer<typeof schemaOrdineLiveticket>): Promise<string | null> {
  // data e ora sono locali Europe/Rome; il server è in UTC
  const [{ ts }] = await sql<{ ts: Date | null }[]>`
    select case when ${o.data}::text is not null and ${o.ora}::text is not null
      then (${o.data}::text || ' ' || ${o.ora}::text)::timestamp at time zone 'Europe/Rome' end as ts`;
  const { eventoId, tariffe, prezzi } = await contestoEvento(ts);
  const { biglietti, anomalie } = assegnaBiglietti({
    biglietti: o.biglietti, tariffe, prezzi, importo_pagato: o.importo_pagato, anomalieLettura: o.anomalie, senzaEvento: !eventoId,
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

// jsonb non conserva l'ordine delle chiavi: si confronta solo ciò che l'assegnazione decide
const assegnazione = (b: BigliettoLiveticket[]) => JSON.stringify(b.map((x) => [x.tariffa_id, x.ristorante, x.pasto, x.prezzo]));
const daRifare = (a: string) => a.startsWith(ANOMALIA_TARIFFA) || a === ANOMALIA_IMPORTO;

/** Ripete abbinamento e assegnazione per gli ordini senza evento o con anomalie di tariffa/importo. Ritorna quanti sono cambiati. */
export async function riabbinaOrdini(): Promise<number> {
  const ordini = await sql<{ codice: string; data_ora: Date | null; evento_id: string | null; biglietti: BigliettoLiveticket[];
    importo_pagato: number | null; anomalie: string[]; versione: string; data_evento: Date | null }[]>`
    select l.codice, l.data_ora, l.evento_id, l.biglietti, l.importo_pagato, l.anomalie, l.aggiornato_il::text as versione, e.data_ora as data_evento
    from liveticket_ordini l left join eventi e on e.id = l.evento_id`;
  let cambiati = 0;
  // anche gli ordini la cui data non coincide più con quella dell'evento abbinato (evento spostato)
  const dataDiversa = (o: { data_ora: Date | null; data_evento: Date | null }) =>
    o.data_evento !== null && o.data_ora?.getTime() !== o.data_evento.getTime();
  for (const o of ordini.filter((o) => o.evento_id === null || dataDiversa(o) || o.anomalie.some(daRifare))) {
    const { eventoId, tariffe, prezzi } = await contestoEvento(o.data_ora);
    const { biglietti, anomalie } = assegnaBiglietti({
      biglietti: o.biglietti.map((b) => ({ posto: b.posto, tariffa: b.tariffa })), tariffe, prezzi,
      importo_pagato: o.importo_pagato, anomalieLettura: o.anomalie.filter((a) => !daRifare(a)), senzaEvento: !eventoId,
    });
    if (eventoId === o.evento_id && assegnazione(biglietti) === assegnazione(o.biglietti)
      && JSON.stringify(anomalie) === JSON.stringify(o.anomalie)) continue;
    // aggiornato_il ha i microsecondi: si confronta come testo, non come Date (millisecondi)
    const r = await sql`update liveticket_ordini set evento_id = ${eventoId}, biglietti = ${sql.json(biglietti as never)},
      anomalie = ${anomalie}, aggiornato_il = now() where codice = ${o.codice} and aggiornato_il::text = ${o.versione}`;
    cambiati += r.count;
  }
  return cambiati;
}

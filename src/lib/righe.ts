import "server-only";
import type postgres from "postgres";

// Righe tariffa di una prenotazione, sempre dentro la transazione della prenotazione.
// Una tariffa che non è dell'opera dell'evento fa fallire tutto (rollback).

type Tx = postgres.TransactionSql;
type Riga = { tariffa_id: string; quantita: number };

export class TariffaNonValida extends Error {
  constructor() { super("Tariffa non valida"); }
}

// Nuove righe al prezzo attuale della tariffa (che da qui resta congelato).
export async function inserisciRighe(tx: Tx, prenotazioneId: string, eventoId: string, righe: Riga[]) {
  if (!righe.length) return;
  const r = await tx`
    insert into prenotazioni_tariffe (prenotazione_id, tariffa_id, quantita, prezzo)
    select ${prenotazioneId}, t.id, x.quantita, t.prezzo
    from jsonb_to_recordset(${tx.json(righe)}) as x (tariffa_id uuid, quantita integer)
    join tariffe t on t.id = x.tariffa_id
    join eventi e on e.opera_id = t.opera_id and e.id = ${eventoId}`;
  if (r.count !== righe.length) throw new TariffaNonValida();
}

// Modifica: le righe tolte spariscono, quelle già presenti cambiano solo quantità (prezzo congelato),
// quelle nuove prendono il prezzo attuale.
export async function aggiornaRighe(tx: Tx, prenotazioneId: string, eventoId: string, righe: Riga[]) {
  const ids = righe.map((r) => r.tariffa_id);
  await tx`delete from prenotazioni_tariffe
    where prenotazione_id = ${prenotazioneId} and tariffa_id <> all(${ids}::uuid[])`;
  const esistenti = new Set((await tx`
    update prenotazioni_tariffe p set quantita = x.quantita
    from jsonb_to_recordset(${tx.json(righe)}) as x (tariffa_id uuid, quantita integer)
    where p.prenotazione_id = ${prenotazioneId} and p.tariffa_id = x.tariffa_id
    returning p.tariffa_id`).map((r) => r.tariffa_id as string));
  await inserisciRighe(tx, prenotazioneId, eventoId, righe.filter((r) => !esistenti.has(r.tariffa_id)));
}

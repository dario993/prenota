import { z } from "zod";
import { utenteCorrente } from "@/lib/auth";
import { sql } from "@/lib/db";
import { ERRORE_IMPREVISTO } from "@/lib/esito";
import type { DettaglioEvento, Prenotazione } from "@/lib/calcoli";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await utenteCorrente())) return Response.json({ errore: "Sessione scaduta" }, { status: 401 });
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) return Response.json({ errore: "Evento non trovato" }, { status: 404 });
  try {
    const [evento] = await sql`
      select e.id, e.data_ora, o.titolo, l.nome as locale, l.capienza,
             o.prezzo_pacchetto_teatro, o.prezzo_pacchetto_ristorante, o.pacchetto_nascosto,
             coalesce((select json_agg(json_build_object('id', t.id, 'nome', t.nome, 'prezzo', t.prezzo,
                         'nascosta', t.nascosta, 'ordine', t.ordine) order by t.ordine)
                       from tariffe t where t.opera_id = o.id), '[]') as tariffe
      from eventi e
      join opere o on o.id = e.opera_id
      join locali l on l.id = e.locale_id
      where e.id = ${id.data}`;
    if (!evento) return Response.json({ errore: "Evento non trovato" }, { status: 404 });
    const prenotazioni = await sql`
      select p.id, p.evento_id, p.cognome_nome, p.telefono, p.pacchetti, p.ristorante, p.pasto, p.posti, p.provenienza,
             p.note, p.contrassegno, p.pagamento, p.prezzo_pacchetto_teatro, p.prezzo_pacchetto_ristorante,
             coalesce((select json_agg(json_build_object('tariffa_id', r.tariffa_id, 'quantita', r.quantita, 'prezzo', r.prezzo))
                       from prenotazioni_tariffe r where r.prenotazione_id = p.id), '[]') as righe
      from prenotazioni p where p.evento_id = ${id.data}
      order by p.ordine nulls last, p.creata_il, p.id`;
    const liveticket = await sql`
      select codice, cognome_nome, telefono, spettacolo, data_ora, evento_id, biglietti_dichiarati, biglietti,
             importo_pagato, anomalie, ricevuto_il
      from liveticket_ordini where evento_id = ${id.data} order by cognome_nome`;
    const dettaglio = {
      evento: { ...evento, data_ora: new Date(evento.data_ora).toISOString() },
      prenotazioni: prenotazioni as unknown as Prenotazione[],
      liveticket: liveticket.map((o) => ({
        ...o, data_ora: o.data_ora ? new Date(o.data_ora).toISOString() : null,
        ricevuto_il: new Date(o.ricevuto_il).toISOString(),
      })),
    } as DettaglioEvento;
    return Response.json(dettaglio);
  } catch (e) {
    console.error(e);
    return Response.json({ errore: ERRORE_IMPREVISTO }, { status: 500 });
  }
}

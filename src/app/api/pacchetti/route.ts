import { z } from "zod";
import { utenteCorrente } from "@/lib/auth";
import { sql } from "@/lib/db";
import { ERRORE_IMPREVISTO } from "@/lib/esito";
import { prezziPacchettoDi, vociPacchetti, type Prenotazione, type PrezziPacchetto } from "@/lib/calcoli";
import { vociLiveticket, type OrdineLiveticket } from "@/lib/liveticket";

// Pacchetti di un giorno (Europe/Rome) per il riepilogo Telegram di n8n: utente «api» con la sua chiave (o admin).
const schemaFiltro = z.object({ data: z.iso.date() });

export async function GET(req: Request) {
  const utente = await utenteCorrente();
  if (!utente || (utente.ruolo !== "admin" && utente.ruolo !== "api")) return Response.json({ errore: "Non autorizzato" }, { status: 401 });
  const filtro = schemaFiltro.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!filtro.success) return Response.json({ errore: "Data non valida (AAAA-MM-GG)" }, { status: 400 });
  try {
    const eventi = await sql<({ id: string; data_ora: Date; titolo: string } & PrezziPacchetto)[]>`
      select e.id, e.data_ora, o.titolo, o.prezzo_pacchetto_teatro, o.prezzo_pacchetto_ristorante
      from eventi e join opere o on o.id = e.opera_id
      where (e.data_ora at time zone 'Europe/Rome')::date = ${filtro.data.data}::date
      order by e.data_ora`;
    const ids = eventi.map((e) => e.id);
    const prenotazioni = await sql<Prenotazione[]>`
      select p.id, p.evento_id, p.cognome_nome, p.telefono, p.pacchetti, p.ristorante, p.pasto, p.posti, p.provenienza,
             p.note, p.contrassegno, p.pagamento, p.prezzo_pacchetto_teatro, p.prezzo_pacchetto_ristorante,
             coalesce((select json_agg(json_build_object('tariffa_id', r.tariffa_id, 'quantita', r.quantita, 'prezzo', r.prezzo))
                       from prenotazioni_tariffe r where r.prenotazione_id = p.id), '[]') as righe
      from prenotazioni p where p.evento_id = any(${ids}::uuid[])`;
    const ordini = await sql<OrdineLiveticket[]>`
      select codice, cognome_nome, telefono, spettacolo, data_ora, evento_id, biglietti_dichiarati, biglietti,
             importo_pagato, anomalie, ricevuto_il
      from liveticket_ordini where evento_id = any(${ids}::uuid[])`;
    const lt = ordini.flatMap((o) => vociLiveticket(o, prezziPacchettoDi(eventi.find((e) => e.id === o.evento_id)!)));
    return Response.json({
      data: filtro.data.data,
      eventi: eventi.map((e) => ({ id: e.id, titolo: e.titolo, data_ora: e.data_ora.toISOString() })),
      voci: vociPacchetti([...prenotazioni, ...lt]),
      anomalie: ordini.filter((o) => o.anomalie.length).map((o) => `LiveTicket ${o.codice} – ${o.cognome_nome}: ${o.anomalie.join("; ")}`),
    });
  } catch (e) {
    console.error(e);
    return Response.json({ errore: ERRORE_IMPREVISTO }, { status: 500 });
  }
}

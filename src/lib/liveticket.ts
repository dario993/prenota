import type { Pasto, PrezziPacchetto, Ristorante, Tariffa } from "./calcoli";

export const COMMISSIONE_LIVETICKET = 150; // centesimi a biglietto, trattenuta da LiveTicket, mai conteggiata
export const ANOMALIA_TARIFFA = "Tariffa non presente nell'opera: ";
export const ANOMALIA_IMPORTO = "Importo diverso dal tariffario";

export interface BigliettoLetto { posto: string; tariffa: string } // da n8n
export interface BigliettoLiveticket extends BigliettoLetto { // salvato in jsonb
  tariffa_id: string | null; ristorante: Ristorante | null; pasto: Pasto | null; prezzo: number }
export interface OrdineLiveticket {
  codice: string; cognome_nome: string; telefono: string; spettacolo: string; data_ora: string | null;
  evento_id: string | null; biglietti_dichiarati: number | null; biglietti: BigliettoLiveticket[];
  importo_pagato: number | null; anomalie: string[]; ricevuto_il: string }

const normalizza = (s: string) => s.trim().replace(/\s+/g, " ").toUpperCase();

/** «PRANZO|CENA + SPETTACOLO CM|GG» → pacchetto (CM = Casale, GG = Giamaica). */
export function pacchettoDaTariffa(t: string): { ristorante: Ristorante; pasto: Pasto } | null {
  const m = /^(PRANZO|CENA) \+ SPETTACOLO (CM|GG)$/.exec(normalizza(t));
  return m ? { pasto: m[1] as Pasto, ristorante: m[2] === "CM" ? "CASALE" : "GIAMAICA" } : null;
}

export function assegnaBiglietti(a: {
  biglietti: BigliettoLetto[]; tariffe: Tariffa[]; prezzi: PrezziPacchetto;
  importo_pagato: number | null; anomalieLettura: string[];
}): { biglietti: BigliettoLiveticket[]; anomalie: string[] } {
  // fail closed: con anomalie di lettura nessun pacchetto né tariffa
  if (a.anomalieLettura.length > 0) {
    return {
      biglietti: a.biglietti.map((b) => ({ ...b, tariffa_id: null, ristorante: null, pasto: null, prezzo: 0 })),
      anomalie: a.anomalieLettura,
    };
  }
  const anomalie = new Set<string>();
  const prezzoPacchetto = a.prezzi.prezzo_pacchetto_teatro + a.prezzi.prezzo_pacchetto_ristorante;
  const biglietti = a.biglietti.map((b): BigliettoLiveticket => {
    const vuoto = { ...b, tariffa_id: null, ristorante: null, pasto: null, prezzo: 0 };
    const pacchetto = pacchettoDaTariffa(b.tariffa);
    if (pacchetto) return { ...vuoto, ...pacchetto, prezzo: prezzoPacchetto };
    const nome = normalizza(b.tariffa);
    let scelta: Tariffa | null = null; // nome più lungo vince
    for (const t of a.tariffe) {
      const n = normalizza(t.nome);
      if ((nome === n || nome.startsWith(n + " ")) && (!scelta || n.length > normalizza(scelta.nome).length)) scelta = t;
    }
    if (!scelta) { anomalie.add(ANOMALIA_TARIFFA + b.tariffa.trim()); return vuoto; }
    return { ...vuoto, tariffa_id: scelta.id, prezzo: scelta.prezzo };
  });
  if (a.importo_pagato !== null) {
    const atteso = biglietti.reduce((s, b) => s + b.prezzo, 0) + COMMISSIONE_LIVETICKET * biglietti.length;
    if (atteso !== a.importo_pagato) anomalie.add(ANOMALIA_IMPORTO);
  }
  return { biglietti, anomalie: [...anomalie] };
}

import type { Pasto, Prenotazione, PrezziPacchetto, RigaTariffa, Ristorante, Tariffa } from "./calcoli";

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
  senzaEvento?: boolean; // niente evento = niente tariffe né prezzi: biglietti non abbinati, solo le anomalie di lettura
}): { biglietti: BigliettoLiveticket[]; anomalie: string[] } {
  // fail closed: con anomalie di lettura (o senza evento) nessun pacchetto né tariffa
  if (a.anomalieLettura.length > 0 || a.senzaEvento) {
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
    // il nome della tariffa compare a parole intere in quello LiveTicket («Over 65» in «Ridotto over 65»); il più lungo vince
    const nome = ` ${normalizza(b.tariffa)} `;
    let scelta: Tariffa | null = null;
    for (const t of a.tariffe) {
      const n = normalizza(t.nome);
      if (nome.includes(` ${n} `) && (!scelta || n.length > normalizza(scelta.nome).length)) scelta = t;
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

/** «Platea, Fila O, Posto n. 3», «… n. 4», «Platea, Fila P, Posto n. 10» → «Fila O 3, 4 · Fila P 10». Formati diversi restano in coda. */
export function postiCompatti(posti: string[]): string {
  const file = new Map<string, Set<string>>(), altri: string[] = [];
  for (const p of posti) {
    const m = /Fila\s+(\S+),\s*Posto n\.\s*(\S+)/i.exec(p);
    if (m) file.set(m[1], (file.get(m[1]) ?? new Set()).add(m[2]));
    else if (p.trim()) altri.push(p.replace(/^\s*Platea,\s*/i, "").trim());
  }
  const numerico = (a: string, b: string) => a.localeCompare(b, "it", { numeric: true });
  return [...[...file].sort(([a], [b]) => numerico(a, b)).map(([f, n]) => `Fila ${f} ${[...n].sort(numerico).join(", ")}`), ...altri]
    .join(" · ");
}

/** Persone di un ordine: il maggiore tra biglietti dichiarati e letti (per la capienza meglio contare in più). */
export const personeOrdine = (o: { biglietti_dichiarati: number | null; biglietti: unknown[] }): number =>
  Math.max(o.biglietti_dichiarati ?? 0, o.biglietti.length);

/** «Chiara» + «Ferro» → «FERRO CHIARA»; senza cognome resta il nome com'è, in maiuscolo. */
export const cognomeNome = (nome: string, cognome: string): string => normalizza(`${cognome} ${nome}`);

/** L'evento alla stessa data e ora (ISO); zero o più di uno → null (l'ordine resta senza evento). */
export function abbinaEvento(dataOra: string | null, eventi: { id: string; data_ora: string }[]): string | null {
  if (!dataOra) return null;
  const t = new Date(dataOra).getTime();
  const trovati = eventi.filter((e) => new Date(e.data_ora).getTime() === t);
  return trovati.length === 1 ? trovati[0].id : null;
}

/**
 * L'ordine come voci Prenotazione per i calcoli: righe tariffa (non abbinate = tariffa_id "") nella prima voce,
 * una voce per ogni ristorante/pasto con i prezzi pacchetto dell'opera. Ogni voce ha id = codice.
 */
export function vociLiveticket(o: OrdineLiveticket, prezzi: PrezziPacchetto): Prenotazione[] {
  const righe: RigaTariffa[] = [];
  const pacchetti = new Map<string, { ristorante: Ristorante; pasto: Pasto; n: number }>();
  for (const b of o.biglietti) {
    if (b.ristorante && b.pasto) {
      const k = `${b.ristorante}/${b.pasto}`;
      pacchetti.set(k, { ristorante: b.ristorante, pasto: b.pasto, n: (pacchetti.get(k)?.n ?? 0) + 1 });
      continue;
    }
    const tariffa_id = b.tariffa_id ?? "", prezzo = tariffa_id ? b.prezzo : 0;
    const r = righe.find((x) => x.tariffa_id === tariffa_id && x.prezzo === prezzo);
    if (r) r.quantita++; else righe.push({ tariffa_id, quantita: 1, prezzo });
  }
  // biglietti dichiarati in più di quelli letti: persone mancanti come non abbinate
  const mancanti = personeOrdine(o) - o.biglietti.length;
  if (mancanti > 0) {
    const r = righe.find((x) => x.tariffa_id === "");
    if (r) r.quantita += mancanti; else righe.push({ tariffa_id: "", quantita: mancanti, prezzo: 0 });
  }
  const base = {
    id: o.codice, evento_id: o.evento_id ?? "", cognome_nome: o.cognome_nome, telefono: o.telefono,
    posti: postiCompatti(o.biglietti.map((b) => b.posto)), provenienza: "LiveTicket", note: "",
    contrassegno: null, pagamento: null, liveticket: o.codice, ...prezzi,
  };
  const voci = [...pacchetti.values()].map((p): Prenotazione =>
    ({ ...base, righe: [], pacchetti: p.n, ristorante: p.ristorante, pasto: p.pasto }));
  // chi ha biglietti senza pacchetto siede a tavola con il pacchetto dello stesso ordine
  // ponytail: con pacchetti in più ristoranti/pasti vanno nel primo; caso mai visto
  if (voci.length === 0) voci.push({ ...base, righe, pacchetti: 0, ristorante: null, pasto: null });
  else voci[0].righe = righe;
  return voci;
}

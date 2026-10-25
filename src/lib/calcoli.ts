export const RISTORANTI = ["GIAMAICA", "CASALE"] as const;
export type Ristorante = (typeof RISTORANTI)[number];
export const PASTI = ["PRANZO", "CENA"] as const;
export type Pasto = (typeof PASTI)[number];
export const NOMI_RISTORANTI: Record<Ristorante, string> = { GIAMAICA: "Giamaica", CASALE: "Casale" };
export const NOMI_PASTI: Record<Pasto, string> = { PRANZO: "Pranzo", CENA: "Cena" };
export const CONTRASSEGNI = ["prenotato", "stampato", "modificato", "annullato"] as const;
export type Contrassegno = (typeof CONTRASSEGNI)[number];
export const NOMI_CONTRASSEGNI: Record<Contrassegno, string> = {
  prenotato: "Prenotato", stampato: "Stampato", modificato: "Modificato", annullato: "Annullato",
};

// Tariffario libero per opera; il pacchetto resta a parte (ristorante, pasto, due quote).
export interface Tariffa { id: string; nome: string; prezzo: number; nascosta: boolean; ordine: number }
export interface RigaTariffa { tariffa_id: string; quantita: number; prezzo: number }
export interface PrezziPacchetto { prezzo_pacchetto_teatro: number; prezzo_pacchetto_ristorante: number }
export interface Prenotazione extends PrezziPacchetto {
  id: string; evento_id: string; cognome_nome: string; telefono: string;
  righe: RigaTariffa[]; pacchetti: number;
  ristorante: Ristorante | null; pasto: Pasto | null; posti: string; provenienza: string; note: string;
  contrassegno?: Contrassegno | null; // null o assente (in coda sul telefono) = nessuno stato
  in_attesa?: boolean; // solo lato client
}
export interface EventoLista { id: string; data_ora: string; titolo: string; locale: string; capienza: number; persone: number }
export interface DettaglioEvento {
  evento: Omit<EventoLista, "persone"> & PrezziPacchetto & { pacchetto_nascosto: boolean; tariffe: Tariffa[] };
  prenotazioni: Prenotazione[];
}
// Copia della prenotazione salvata a ogni voce di cronologia (null per le voci ricostruite, senza copia).
export type DatiStorico = Pick<Prenotazione, "cognome_nome" | "telefono" | "pacchetti" | "ristorante" | "pasto" | "posti"
  | "provenienza" | "note" | "contrassegno" | "righe" | "prezzo_pacchetto_teatro" | "prezzo_pacchetto_ristorante">;
export interface VoceStorico {
  il: string; utente: string | null; azione: "creata" | "modificata" | "stato"; contrassegno: Contrassegno | null;
  dati: DatiStorico | null;
}
export interface VoceTariffa { tariffa_id: string; nome: string; quantita: number }
export interface Riepilogo {
  persone: number; capienza: number; postiLiberi: number; oltreCapienza: boolean;
  perTariffa: VoceTariffa[]; pacchetti: number; incassoTeatro: number; incassoRistorante: number;
  ristoranti: Record<Ristorante, { PRANZO: number; CENA: number; incasso: number }>;
}

export const TARIFFA_ELIMINATA = "Tariffa eliminata";

export const persone = (p: { righe: { quantita: number }[]; pacchetti: number }): number =>
  p.righe.reduce((s, r) => s + r.quantita, 0) + p.pacchetti;

export const incassoTeatro = (
  p: { righe: { quantita: number; prezzo: number }[]; pacchetti: number } & Pick<PrezziPacchetto, "prezzo_pacchetto_teatro">,
): number => p.righe.reduce((s, r) => s + r.quantita * r.prezzo, 0) + p.pacchetti * p.prezzo_pacchetto_teatro;

export const incassoRistorante = (p: { pacchetti: number } & Pick<PrezziPacchetto, "prezzo_pacchetto_ristorante">): number =>
  p.pacchetti * p.prezzo_pacchetto_ristorante;

// Solo le quote: un oggetto intero, spalmato, sovrascriverebbe le quantità.
export const prezziPacchettoDi = (p: PrezziPacchetto): PrezziPacchetto => ({
  prezzo_pacchetto_teatro: p.prezzo_pacchetto_teatro, prezzo_pacchetto_ristorante: p.prezzo_pacchetto_ristorante,
});

// Prezzo di ogni riga: congelato se la prenotazione l'aveva già, altrimenti quello attuale (0 se la tariffa non c'è più).
export function righeConPrezzi(
  righe: { tariffa_id: string; quantita: number }[], tariffe: Tariffa[], congelate: RigaTariffa[] = [],
): RigaTariffa[] {
  return righe.filter((r) => r.quantita > 0).map((r) => ({
    tariffa_id: r.tariffa_id, quantita: r.quantita,
    prezzo: congelate.find((c) => c.tariffa_id === r.tariffa_id)?.prezzo
      ?? tariffe.find((t) => t.id === r.tariffa_id)?.prezzo ?? 0,
  }));
}

const perOrdine = (a: Tariffa, b: Tariffa) => a.ordine - b.ordine;

export function riepilogoEvento(prenotazioni: Prenotazione[], capienza: number, tariffe: Tariffa[]): Riepilogo {
  const quante = new Map<string, number>();
  const ristoranti = {
    GIAMAICA: { PRANZO: 0, CENA: 0, incasso: 0 },
    CASALE: { PRANZO: 0, CENA: 0, incasso: 0 },
  };
  let teatro = 0, ristorante = 0, pacchetti = 0, tot = 0;
  for (const p of prenotazioni) {
    for (const r of p.righe) quante.set(r.tariffa_id, (quante.get(r.tariffa_id) ?? 0) + r.quantita);
    pacchetti += p.pacchetti;
    tot += persone(p);
    teatro += incassoTeatro(p);
    const inc = incassoRistorante(p);
    ristorante += inc;
    if (p.pacchetti > 0 && p.ristorante && p.pasto) {
      ristoranti[p.ristorante][p.pasto] += p.pacchetti;
      ristoranti[p.ristorante].incasso += inc;
    }
  }
  const note = [...tariffe].sort(perOrdine).filter((t) => quante.has(t.id))
    .map((t) => ({ tariffa_id: t.id, nome: t.nome, quantita: quante.get(t.id)! }));
  const ignote = [...quante].filter(([id]) => !tariffe.some((t) => t.id === id))
    .map(([tariffa_id, quantita]) => ({ tariffa_id, nome: TARIFFA_ELIMINATA, quantita }));
  return { persone: tot, capienza, postiLiberi: capienza - tot, oltreCapienza: tot > capienza,
    perTariffa: [...note, ...ignote].filter((v) => v.quantita > 0), pacchetti,
    incassoTeatro: teatro, incassoRistorante: ristorante, ristoranti };
}

// Contatori del modulo: le tariffe visibili, più (in modifica) le nascoste che la prenotazione usa già.
export const tariffeDelModulo = (tariffe: Tariffa[], righeIniziali: { tariffa_id: string }[] = []): Tariffa[] =>
  tariffe.filter((t) => !t.nascosta || righeIniziali.some((r) => r.tariffa_id === t.id)).sort(perOrdine);

// Biglietti in una riga per elenchi e schede: "2 Adulti · 1 Associato · 2 Pacchetti Casale cena".
export function descriviBiglietti(
  p: { righe: { tariffa_id: string; quantita: number }[] } & Pick<Prenotazione, "pacchetti" | "ristorante" | "pasto">,
  tariffe: Tariffa[],
): string {
  const parti = [...tariffe].sort(perOrdine).flatMap((t) => {
    const q = p.righe.filter((r) => r.tariffa_id === t.id).reduce((s, r) => s + r.quantita, 0);
    return q ? [`${q} ${t.nome}`] : [];
  });
  const ignote = p.righe.filter((r) => !tariffe.some((t) => t.id === r.tariffa_id)).reduce((s, r) => s + r.quantita, 0);
  if (ignote) parti.push(`${ignote} ${TARIFFA_ELIMINATA}`);
  if (p.pacchetti) parti.push(`${p.pacchetti} Pacchetti` +
    (p.ristorante && p.pasto ? ` ${NOMI_RISTORANTI[p.ristorante]} ${NOMI_PASTI[p.pasto].toLowerCase()}` : ""));
  return parti.join(" · ");
}

export const ordinaPerNome = <T extends { cognome_nome: string }>(lista: T[]): T[] =>
  [...lista].sort((a, b) => a.cognome_nome.localeCompare(b.cognome_nome, "it", { sensitivity: "base" }));

// le annullate non vanno ai ristoranti
export const elencoRistorante = (prenotazioni: Prenotazione[], r: Ristorante, p: Pasto): Prenotazione[] =>
  ordinaPerNome(prenotazioni.filter((x) => x.pacchetti > 0 && x.ristorante === r && x.pasto === p && x.contrassegno !== "annullato"));

export function testoElencoRistorante(a: {
  ristorante: Ristorante; pasto: Pasto; dataOra: Date; titolo: string; prenotazioni: Prenotazione[];
}): string {
  const lista = elencoRistorante(a.prenotazioni, a.ristorante, a.pasto);
  const data = new Intl.DateTimeFormat("it-IT", {
    weekday: "short", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Rome",
  }).format(a.dataOra);
  const coperti = lista.reduce((s, x) => s + x.pacchetti, 0);
  const righe = lista.map((x) =>
    `- ${x.cognome_nome} (${x.pacchetti})` + (x.telefono ? ` – ${x.telefono}` : "") + (x.note ? ` – ${x.note}` : ""));
  return `${a.ristorante} – ${a.pasto} – ${data}\nOpera: ${a.titolo}\nCoperti: ${coperti}\n\n${righe.join("\n")}`;
}

const euro = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });
export const formattaEuro = (centesimi: number): string => euro.format(centesimi / 100);

export function euroInCentesimi(testo: string): number | null {
  const t = testo.trim();
  return /^\d+([.,]\d{1,2})?$/.test(t) ? Math.round(Number(t.replace(",", ".")) * 100) : null;
}

const dataOra = new Intl.DateTimeFormat("it-IT", {
  weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  timeZone: "Europe/Rome",
});
export const formattaDataOra = (d: Date): string => dataOra.format(d);

// Una versione della prenotazione come [campo, valore] da mostrare nella cronologia.
export const campiVersione = (d: DatiStorico, tariffe: Tariffa[]): [string, string][] => [
  ["Nome", d.cognome_nome], ["Telefono", d.telefono], ["Biglietti", descriviBiglietti(d, tariffe)],
  ["Persone", String(persone(d))], ["Totale", formattaEuro(incassoTeatro(d) + incassoRistorante(d))],
  ["Posti", d.posti], ["Provenienza", d.provenienza], ["Note", d.note],
  ["Stato", d.contrassegno ? NOMI_CONTRASSEGNI[d.contrassegno] : "Nessuno stato"],
];

// Campi di una versione col valore della versione precedente se è cambiato (prima = null: niente confronto).
export function confrontaVersioni(dopo: DatiStorico, prima: DatiStorico | null, tariffe: Tariffa[]) {
  const vecchi = new Map(prima ? campiVersione(prima, tariffe) : []);
  return campiVersione(dopo, tariffe).map(([campo, valore]) => {
    const era = vecchi.get(campo);
    return { campo, valore, era: era !== undefined && era !== valore ? era : undefined };
  });
}

// Trascinamento nell'elenco: l'elemento in posizione «da» finisce in posizione «a».
export function spostaElemento<T>(lista: T[], da: number, a: number): T[] {
  const nuova = [...lista];
  nuova.splice(a, 0, ...nuova.splice(da, 1));
  return nuova;
}

// Posizione di arrivo: quanti altri elementi hanno il centro sopra il centro di quello trascinato.
export const indiceDestinazione = (centri: number[], da: number, centro: number): number =>
  centri.filter((c, i) => i !== da && c < centro).length;

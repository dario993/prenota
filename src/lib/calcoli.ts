export const RISTORANTI = ["GIAMAICA", "CASALE"] as const;
export type Ristorante = (typeof RISTORANTI)[number];
export const PASTI = ["PRANZO", "CENA"] as const;
export type Pasto = (typeof PASTI)[number];
export const NOMI_RISTORANTI: Record<Ristorante, string> = { GIAMAICA: "Giamaica", CASALE: "Casale" };
export const NOMI_PASTI: Record<Pasto, string> = { PRANZO: "Pranzo", CENA: "Cena" };

export interface Quantita { adulti: number; ridotti: number; bambini: number; pacchetti: number; omaggi: number }
export interface Prezzi {
  prezzo_adulto: number; prezzo_ridotto: number; prezzo_bambino: number;
  prezzo_pacchetto_teatro: number; prezzo_pacchetto_ristorante: number;
}
export interface Prenotazione extends Quantita, Prezzi {
  id: string; evento_id: string; cognome_nome: string; telefono: string;
  ristorante: Ristorante | null; pasto: Pasto | null; posti: string; provenienza: string; note: string;
  in_attesa?: boolean; // solo lato client
}
export interface Riepilogo {
  persone: number; capienza: number; postiLiberi: number; oltreCapienza: boolean;
  perTipo: Quantita; incassoTeatro: number; incassoRistorante: number;
  ristoranti: Record<Ristorante, { PRANZO: number; CENA: number; incasso: number }>;
}

export const persone = (q: Quantita): number => q.adulti + q.ridotti + q.bambini + q.pacchetti + q.omaggi;

export const incassoTeatro = (p: Quantita & Prezzi): number =>
  p.adulti * p.prezzo_adulto + p.ridotti * p.prezzo_ridotto + p.bambini * p.prezzo_bambino +
  p.pacchetti * p.prezzo_pacchetto_teatro;

export const incassoRistorante = (p: Quantita & Prezzi): number => p.pacchetti * p.prezzo_pacchetto_ristorante;

export function riepilogoEvento(prenotazioni: Prenotazione[], capienza: number): Riepilogo {
  const perTipo: Quantita = { adulti: 0, ridotti: 0, bambini: 0, pacchetti: 0, omaggi: 0 };
  const ristoranti = {
    GIAMAICA: { PRANZO: 0, CENA: 0, incasso: 0 },
    CASALE: { PRANZO: 0, CENA: 0, incasso: 0 },
  };
  let teatro = 0, ristorante = 0;
  for (const p of prenotazioni) {
    for (const k of Object.keys(perTipo) as (keyof Quantita)[]) perTipo[k] += p[k];
    teatro += incassoTeatro(p);
    const r = incassoRistorante(p);
    ristorante += r;
    if (p.pacchetti > 0 && p.ristorante && p.pasto) {
      ristoranti[p.ristorante][p.pasto] += p.pacchetti;
      ristoranti[p.ristorante].incasso += r;
    }
  }
  const tot = persone(perTipo);
  return { persone: tot, capienza, postiLiberi: capienza - tot, oltreCapienza: tot > capienza, perTipo,
    incassoTeatro: teatro, incassoRistorante: ristorante, ristoranti };
}

export const ordinaPerNome = <T extends { cognome_nome: string }>(lista: T[]): T[] =>
  [...lista].sort((a, b) => a.cognome_nome.localeCompare(b.cognome_nome, "it", { sensitivity: "base" }));

export const elencoRistorante = (prenotazioni: Prenotazione[], r: Ristorante, p: Pasto): Prenotazione[] =>
  ordinaPerNome(prenotazioni.filter((x) => x.pacchetti > 0 && x.ristorante === r && x.pasto === p));

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

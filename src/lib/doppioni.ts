import type { Prenotazione } from "./calcoli";

export interface Doppione { id: string; nome: string; liveticket: boolean; motivo: "nome" | "telefono" }

const senzaAccenti = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

// maiuscolo, senza accenti e spazi doppi, parole ordinate: «Rossi Mario» = «MARIO ROSSI»
export const normalizzaNome = (s: string) => senzaAccenti(s).toUpperCase().split(/\s+/).filter(Boolean).sort().join(" ");

// solo cifre, senza prefisso 39/0039 se restano almeno 9 cifre; "" = non confrontato
export const normalizzaTelefono = (s: string) => {
  const c = s.replace(/\D/g, "").replace(/^(?:00)?39(?=\d{9})/, "");
  return c;
};

/**
 * Per ogni voce (chiave = id prenotazione o codice LiveTicket) le altre voci con stesso nome o telefono.
 * Escluse le annullate; le voci con lo stesso id (pacchetti misti) e due voci LiveTicket non si confrontano.
 */
export function possibiliDoppioni(voci: Prenotazione[]): Map<string, Doppione[]> {
  const viste = new Map<string, Prenotazione>();
  for (const v of voci) if (v.contrassegno !== "annullato" && !viste.has(v.id)) viste.set(v.id, v);
  const elenco = [...viste.values()].map((v) => ({ v, nome: normalizzaNome(v.cognome_nome), tel: normalizzaTelefono(v.telefono) }));
  const out = new Map<string, Doppione[]>();
  const aggiungi = (a: typeof elenco[number], b: typeof elenco[number], motivo: Doppione["motivo"]) =>
    out.set(a.v.id, [...(out.get(a.v.id) ?? []), { id: b.v.id, nome: b.v.cognome_nome, liveticket: !!b.v.liveticket, motivo }]);
  for (const a of elenco) for (const b of elenco) {
    if (a === b || (a.v.liveticket && b.v.liveticket)) continue;
    const motivo = a.nome && a.nome === b.nome ? "nome" : a.tel && a.tel === b.tel ? "telefono" : null;
    if (motivo) aggiungi(a, b, motivo);
  }
  return out;
}

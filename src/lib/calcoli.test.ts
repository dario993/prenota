import { describe, expect, test } from "vitest";
import {
  descriviBiglietti, elencoRistorante, euroInCentesimi, formattaDataOra, formattaEuro, incassoRistorante,
  incassoTeatro, persone, righeConPrezzi, riepilogoEvento, tariffeDelModulo, testoElencoRistorante,
  TARIFFA_ELIMINATA, type Prenotazione, type Tariffa,
} from "./calcoli";

const A = "00000000-0000-4000-8000-00000000000a", R = "00000000-0000-4000-8000-00000000000b",
  O = "00000000-0000-4000-8000-00000000000c", S = "00000000-0000-4000-8000-00000000000d",
  X = "00000000-0000-4000-8000-0000000000ff";
const tariffe: Tariffa[] = [
  { id: S, nome: "Associato", prezzo: 500, nascosta: true, ordine: 4 },
  { id: A, nome: "Adulti", prezzo: 1500, nascosta: false, ordine: 1 },
  { id: R, nome: "Ridotti gruppi", prezzo: 1200, nascosta: false, ordine: 2 },
  { id: O, nome: "Omaggi", prezzo: 0, nascosta: false, ordine: 3 },
];
const riga = (tariffa_id: string, quantita: number, prezzo = 0) => ({ tariffa_id, quantita, prezzo });

function pren(p: Partial<Prenotazione> = {}): Prenotazione {
  return { id: "1", evento_id: "e", cognome_nome: "", telefono: "", ristorante: null, pasto: null,
    posti: "", provenienza: "", note: "", righe: [], pacchetti: 0,
    prezzo_pacchetto_teatro: 2200, prezzo_pacchetto_ristorante: 2700, ...p };
}

describe("calcoli", () => {
  test("persone somma le quantità delle tariffe e i pacchetti", () =>
    expect(persone({ righe: [riga(A, 2), riga(O, 1)], pacchetti: 2 })).toBe(5));
  test("incasso teatro: righe al loro prezzo più quota teatro dei pacchetti", () =>
    expect(incassoTeatro(pren({ righe: [riga(A, 2, 1500), riga(R, 1, 1200)], pacchetti: 2 }))).toBe(8600));
  test("incasso ristorante: solo pacchetti", () => expect(incassoRistorante(pren({ pacchetti: 2 }))).toBe(5400));
  test("righeConPrezzi: prezzo attuale della tariffa, righe a 0 escluse", () =>
    expect(righeConPrezzi([{ tariffa_id: A, quantita: 2 }, { tariffa_id: S, quantita: 1 }, { tariffa_id: R, quantita: 0 }], tariffe))
      .toEqual([riga(A, 2, 1500), riga(S, 1, 500)]));
  test("righeConPrezzi: le righe già salvate tengono il prezzo congelato", () =>
    expect(righeConPrezzi([{ tariffa_id: A, quantita: 3 }, { tariffa_id: S, quantita: 1 }], tariffe, [riga(A, 2, 1400)]))
      .toEqual([riga(A, 3, 1400), riga(S, 1, 500)]));
  test("righeConPrezzi: tariffa sconosciuta vale 0", () =>
    expect(righeConPrezzi([{ tariffa_id: X, quantita: 1 }], tariffe)).toEqual([riga(X, 1, 0)]));
  test("riepilogo: una voce per tariffa usata, nell'ordine del tariffario, nascoste comprese", () => {
    const r = riepilogoEvento([pren({ righe: [riga(S, 1, 500), riga(A, 2, 1500)] }),
      pren({ righe: [riga(A, 1, 1500)], pacchetti: 2, ristorante: "CASALE", pasto: "CENA" })], 100, tariffe);
    expect(r.perTariffa).toEqual([{ tariffa_id: A, nome: "Adulti", quantita: 3 }, { tariffa_id: S, nome: "Associato", quantita: 1 }]);
    expect(r.pacchetti).toBe(2); expect(r.persone).toBe(6);
    expect(r.incassoTeatro).toBe(3 * 1500 + 500 + 2 * 2200); expect(r.incassoRistorante).toBe(5400);
  });
  test("riepilogo: tariffa non più nel tariffario in fondo come «Tariffa eliminata»", () => {
    const r = riepilogoEvento([pren({ righe: [riga(X, 2), riga(A, 1, 1500)] })], 10, tariffe);
    expect(r.perTariffa).toEqual([{ tariffa_id: A, nome: "Adulti", quantita: 1 }, { tariffa_id: X, nome: TARIFFA_ELIMINATA, quantita: 2 }]);
  });
  test("riepilogo: oltre capienza e posti liberi negativi", () => {
    const r = riepilogoEvento([pren({ righe: [riga(R, 35, 1200)] }),
      pren({ righe: [riga(O, 1)], pacchetti: 2, ristorante: "CASALE", pasto: "CENA" })], 36, tariffe);
    expect(r.persone).toBe(38); expect(r.postiLiberi).toBe(-2); expect(r.oltreCapienza).toBe(true);
    expect(r.ristoranti.CASALE).toEqual({ PRANZO: 0, CENA: 2, incasso: 5400 });
    expect(r.ristoranti.GIAMAICA).toEqual({ PRANZO: 0, CENA: 0, incasso: 0 });
  });
  test("riepilogo esattamente pieno non è oltre capienza", () => {
    const r = riepilogoEvento([pren({ righe: [riga(A, 36, 1500)] })], 36, tariffe);
    expect(r.oltreCapienza).toBe(false); expect(r.postiLiberi).toBe(0);
  });
  test("tariffeDelModulo: solo le visibili, in ordine", () =>
    expect(tariffeDelModulo(tariffe).map((t) => t.nome)).toEqual(["Adulti", "Ridotti gruppi", "Omaggi"]));
  test("tariffeDelModulo: in modifica anche le nascoste già usate", () =>
    expect(tariffeDelModulo(tariffe, [{ tariffa_id: S }]).map((t) => t.nome))
      .toEqual(["Adulti", "Ridotti gruppi", "Omaggi", "Associato"]));
  test("descriviBiglietti", () => {
    expect(descriviBiglietti(pren({ righe: [riga(S, 1), riga(A, 2)], pacchetti: 2 }), tariffe))
      .toBe("2 Adulti · 1 Associato · 2 Pacchetti");
    expect(descriviBiglietti(pren({ pacchetti: 1, ristorante: "CASALE", pasto: "CENA" }), tariffe))
      .toBe("1 Pacchetti Casale cena");
    expect(descriviBiglietti(pren(), tariffe)).toBe("");
  });
  test("elencoRistorante filtra ristorante+pasto e ordina", () => {
    const l = [
      pren({ cognome_nome: "Zeta", pacchetti: 1, ristorante: "CASALE", pasto: "CENA" }),
      pren({ cognome_nome: "alfa", pacchetti: 1, ristorante: "CASALE", pasto: "CENA" }),
      pren({ cognome_nome: "Altro", pacchetti: 1, ristorante: "CASALE", pasto: "PRANZO" }),
      pren({ cognome_nome: "Altro2", pacchetti: 1, ristorante: "GIAMAICA", pasto: "CENA" }),
      pren({ cognome_nome: "NoPacchetti", righe: [riga(A, 3)] }),
    ];
    expect(elencoRistorante(l, "CASALE", "CENA").map((x) => x.cognome_nome)).toEqual(["alfa", "Zeta"]);
  });
  test("testoElencoRistorante formato esatto", () => {
    expect(testoElencoRistorante({ ristorante: "CASALE", pasto: "CENA", dataOra: new Date("2026-10-10T19:00:00Z"),
      titolo: "DOCUFILM", prenotazioni: [
        pren({ cognome_nome: "ROSSI MARIO", pacchetti: 2, ristorante: "CASALE", pasto: "CENA",
          telefono: "333 1234567", note: "1 celiaco" }),
        pren({ cognome_nome: "Gruppo Sicilia", pacchetti: 10, ristorante: "CASALE", pasto: "CENA" })] }))
      .toBe("CASALE – CENA – sab 10 ottobre 2026\nOpera: DOCUFILM\nCoperti: 12\n\n- Gruppo Sicilia (10)\n- ROSSI MARIO (2) – 333 1234567 – 1 celiaco");
  });
  test("euroInCentesimi", () => {
    expect(euroInCentesimi("22,50")).toBe(2250); expect(euroInCentesimi("22.5")).toBe(2250);
    expect(euroInCentesimi(" 22 ")).toBe(2200); expect(euroInCentesimi("0")).toBe(0);
    expect(euroInCentesimi("abc")).toBeNull(); expect(euroInCentesimi("-1")).toBeNull();
    expect(euroInCentesimi("1,234")).toBeNull();
  });
  test("euroInCentesimi senza errori di virgola mobile", () => {
    expect(euroInCentesimi("1.15")).toBe(115); expect(euroInCentesimi("0,29")).toBe(29);
  });
  test("riepilogo evento vuoto", () => {
    const r = riepilogoEvento([], 105, tariffe);
    expect(r.persone).toBe(0); expect(r.postiLiberi).toBe(105); expect(r.oltreCapienza).toBe(false);
    expect(r.ristoranti.CASALE).toEqual({ PRANZO: 0, CENA: 0, incasso: 0 });
    expect(r.ristoranti.GIAMAICA).toEqual({ PRANZO: 0, CENA: 0, incasso: 0 });
  });
  test("formattaEuro", () => expect(formattaEuro(4900).replace(/\s/g, " ")).toBe("49,00 €"));
  test("formattaDataOra usa Europe/Rome", () =>
    expect(formattaDataOra(new Date("2026-11-07T20:00:00Z"))).toContain("21:00"));
});

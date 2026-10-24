import { describe, expect, test } from "vitest";
import {
  elencoRistorante, euroInCentesimi, formattaDataOra, formattaEuro, incassoRistorante, incassoTeatro,
  persone, riepilogoEvento, testoElencoRistorante, type Prenotazione,
} from "./calcoli";

const prezzi = { prezzo_adulto: 1500, prezzo_ridotto: 1200, prezzo_bambino: 800,
  prezzo_pacchetto_teatro: 2200, prezzo_pacchetto_ristorante: 2700 };
const q = { adulti: 2, ridotti: 0, bambini: 1, pacchetti: 2, omaggi: 1 };

function pren(p: Partial<Prenotazione> = {}): Prenotazione {
  return { id: "1", evento_id: "e", cognome_nome: "", telefono: "", ristorante: null, pasto: null,
    posti: "", provenienza: "", note: "", adulti: 0, ridotti: 0, bambini: 0, pacchetti: 0, omaggi: 0,
    ...prezzi, ...p };
}

describe("calcoli", () => {
  test("persone conta anche pacchetti e omaggi", () => expect(persone(q)).toBe(6));
  test("incasso teatro", () => expect(incassoTeatro({ ...q, ...prezzi })).toBe(8200));
  test("incasso ristorante", () => expect(incassoRistorante({ ...q, ...prezzi })).toBe(5400));
  test("2 pacchetti = +44 € teatro e +54 € ristorante", () => {
    const p = { ...prezzi, adulti: 0, ridotti: 0, bambini: 0, pacchetti: 2, omaggi: 0 };
    expect([incassoTeatro(p), incassoRistorante(p)]).toEqual([4400, 5400]);
  });
  test("riepilogo: oltre capienza e posti liberi negativi", () => {
    const r = riepilogoEvento([pren({ ridotti: 35 }),
      pren({ pacchetti: 2, omaggi: 1, ristorante: "CASALE", pasto: "CENA" })], 36);
    expect(r.persone).toBe(38); expect(r.postiLiberi).toBe(-2); expect(r.oltreCapienza).toBe(true);
    expect(r.ristoranti.CASALE).toEqual({ PRANZO: 0, CENA: 2, incasso: 5400 });
    expect(r.ristoranti.GIAMAICA).toEqual({ PRANZO: 0, CENA: 0, incasso: 0 });
  });
  test("riepilogo esattamente pieno non è oltre capienza", () => {
    const r = riepilogoEvento([pren({ adulti: 36 })], 36);
    expect(r.oltreCapienza).toBe(false); expect(r.postiLiberi).toBe(0);
  });
  test("elencoRistorante filtra ristorante+pasto e ordina", () => {
    const l = [
      pren({ cognome_nome: "Zeta", pacchetti: 1, ristorante: "CASALE", pasto: "CENA" }),
      pren({ cognome_nome: "alfa", pacchetti: 1, ristorante: "CASALE", pasto: "CENA" }),
      pren({ cognome_nome: "Altro", pacchetti: 1, ristorante: "CASALE", pasto: "PRANZO" }),
      pren({ cognome_nome: "Altro2", pacchetti: 1, ristorante: "GIAMAICA", pasto: "CENA" }),
      pren({ cognome_nome: "NoPacchetti", adulti: 3 }),
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
  test("formattaEuro", () => expect(formattaEuro(4900).replace(/\s/g, " ")).toBe("49,00 €"));
  test("formattaDataOra usa Europe/Rome", () =>
    expect(formattaDataOra(new Date("2026-11-07T20:00:00Z"))).toContain("21:00"));
});

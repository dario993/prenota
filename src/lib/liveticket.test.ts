import { describe, expect, test } from "vitest";
import type { Tariffa } from "./calcoli";
import { ANOMALIA_IMPORTO, ANOMALIA_TARIFFA, assegnaBiglietti, pacchettoDaTariffa } from "./liveticket";

const t = (id: string, nome: string, prezzo: number, nascosta = false): Tariffa => ({ id, nome, prezzo, nascosta, ordine: 0 });
const tariffe = [t("int", "Intero", 2800), t("o65", "Over 65", 2200), t("gru", "Gruppi", 2200),
  t("bam", "Bambini", 1200), t("ass", "Associato", 500, true), t("omg", "Omaggio", 0)];
const prezzi = { prezzo_pacchetto_teatro: 2200, prezzo_pacchetto_ristorante: 2700 };
const bg = (...tariffa: string[]) => tariffa.map((x, i) => ({ posto: `P${i + 1}`, tariffa: x }));
const assegna = (tariffa: string[], importo_pagato: number | null, anomalieLettura: string[] = [], tf = tariffe) =>
  assegnaBiglietti({ biglietti: bg(...tariffa), tariffe: tf, prezzi, importo_pagato, anomalieLettura });

describe("pacchettoDaTariffa", () => {
  test("riconosce i pacchetti", () => {
    expect(pacchettoDaTariffa("PRANZO + SPETTACOLO CM")).toEqual({ ristorante: "CASALE", pasto: "PRANZO" });
    expect(pacchettoDaTariffa("cena + spettacolo gg")).toEqual({ ristorante: "GIAMAICA", pasto: "CENA" });
    expect(pacchettoDaTariffa("Intero")).toBeNull();
  });
});

describe("assegnaBiglietti", () => {
  test("Ferro: 2 Intero", () => {
    const r = assegna(["Intero", "Intero"], 5900);
    expect(r.biglietti.map((b) => [b.tariffa_id, b.prezzo])).toEqual([["int", 2800], ["int", 2800]]);
    expect(r.anomalie).toEqual([]);
  });
  test("De Dominicis: Bambini con spazi e fasce d'età", () => {
    const r = assegna(["Intero", "Intero", "Intero", "Bambini   4 - 12 anni", "Bambini   4 - 12 anni"], 11550);
    expect(r.biglietti[3]).toMatchObject({ tariffa_id: "bam", prezzo: 1200 });
    expect(r.anomalie).toEqual([]);
  });
  test("Guerra: pacchetto Casale pranzo", () => {
    const r = assegna(["PRANZO + SPETTACOLO CM", "PRANZO + SPETTACOLO CM"], 10100);
    expect(r.biglietti[0]).toMatchObject({ tariffa_id: null, ristorante: "CASALE", pasto: "PRANZO", prezzo: 4900 });
    expect(r.anomalie).toEqual([]);
  });
  test("tariffa assente", () => {
    const r = assegna(["Ridotto"], null);
    expect(r.biglietti[0]).toMatchObject({ tariffa_id: null, prezzo: 0 });
    expect(r.anomalie).toEqual(["Tariffa non presente nell'opera: Ridotto"]);
    expect(r.anomalie[0]).toBe(ANOMALIA_TARIFFA + "Ridotto");
  });
  test("importo diverso", () => {
    expect(assegna(["Intero", "Intero"], 6000).anomalie).toEqual([ANOMALIA_IMPORTO]);
  });
  test("prefisso più lungo vince", () => {
    const tf = [t("b", "Bambini", 1200), t("bp", "Bambini piccoli", 600)];
    expect(assegna(["Bambini piccoli 0-3"], null, [], tf).biglietti[0].tariffa_id).toBe("bp");
  });
  test("il prefisso deve finire a parola intera", () => {
    expect(assegna(["Internazionale"], null).biglietti[0].tariffa_id).toBeNull();
  });
  test("tariffa nascosta abbinata", () => {
    expect(assegna(["Associato"], null).biglietti[0]).toMatchObject({ tariffa_id: "ass", prezzo: 500 });
  });
  test("fail closed con anomalie di lettura", () => {
    const lettura = ["Conteggio non coincidente: 1 su 2"];
    const r = assegna(["PRANZO + SPETTACOLO CM"], 5000, lettura);
    expect(r.biglietti[0]).toMatchObject({ tariffa_id: null, ristorante: null, pasto: null, prezzo: 0 });
    expect(r.anomalie).toEqual(lettura);
  });
});

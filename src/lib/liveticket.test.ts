import { describe, expect, test } from "vitest";
import { elencoRistorante, persone, riepilogoEvento, TARIFFA_NON_ABBINATA, testoElencoRistorante, type Tariffa } from "./calcoli";
import { abbinaEvento, ANOMALIA_IMPORTO, ANOMALIA_TARIFFA, assegnaBiglietti, cognomeNome, pacchettoDaTariffa, personeOrdine, postiCompatti, vociLiveticket, type OrdineLiveticket } from "./liveticket";

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
  test("nome della tariffa anche dentro quello LiveTicket", () => {
    const r = assegna(["Ridotto over 65", "Ridotto  OVER 65"], 4700);
    expect(r.biglietti.map((b) => b.tariffa_id)).toEqual(["o65", "o65"]);
    expect(r.anomalie).toEqual([]);
    expect(assegna(["Ridotto over 650"], null).biglietti[0].tariffa_id).toBeNull();
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

test("cognomeNome", () => {
  expect(cognomeNome("Chiara", "Ferro")).toBe("FERRO CHIARA");
  expect(cognomeNome("Chiara Ferro", "")).toBe("CHIARA FERRO");
});

test("abbinaEvento: uno solo → id, zero o due → null", () => {
  const ev = [{ id: "a", data_ora: "2026-11-01T15:30:00.000Z" }, { id: "b", data_ora: "2026-11-02T15:30:00.000Z" }];
  expect(abbinaEvento("2026-11-01T15:30:00Z", ev)).toBe("a");
  expect(abbinaEvento("2026-11-03T15:30:00Z", ev)).toBeNull();
  expect(abbinaEvento("2026-11-01T15:30:00Z", [...ev, { id: "c", data_ora: "2026-11-01T15:30:00Z" }])).toBeNull();
  expect(abbinaEvento(null, ev)).toBeNull();
});

describe("assegnaBiglietti senza evento", () => {
  test("niente abbinamento né anomalie di tariffa/importo, solo la lettura", () => {
    const r = assegnaBiglietti({ biglietti: bg("PRANZO + SPETTACOLO CM", "Boh"), tariffe: [], prezzi: { prezzo_pacchetto_teatro: 0, prezzo_pacchetto_ristorante: 0 },
      importo_pagato: 9999, anomalieLettura: ["Data non letta"], senzaEvento: true });
    expect(r.anomalie).toEqual(["Data non letta"]);
    expect(r.biglietti.every((b) => b.tariffa_id === null && b.ristorante === null && b.pasto === null && b.prezzo === 0)).toBe(true);
  });
  test("senza anomalie di lettura la lista è vuota", () => {
    const r = assegnaBiglietti({ biglietti: bg("Intero"), tariffe: [], prezzi, importo_pagato: 1, anomalieLettura: [], senzaEvento: true });
    expect(r.anomalie).toEqual([]);
  });
});

describe("personeOrdine", () => {
  const bgs = [{}, {}] as unknown[];
  test("il maggiore tra dichiarati e letti", () => {
    expect(personeOrdine({ biglietti_dichiarati: 3, biglietti: bgs })).toBe(3);
    expect(personeOrdine({ biglietti_dichiarati: 1, biglietti: bgs })).toBe(2);
    expect(personeOrdine({ biglietti_dichiarati: null, biglietti: bgs })).toBe(2);
  });
});

describe("vociLiveticket", () => {
  const ordine = (tariffa: string[], extra: Partial<OrdineLiveticket> = {}): OrdineLiveticket => ({
    codice: "lvtckt-30534501", cognome_nome: "FERRO CHIARA", telefono: "+393472300236", spettacolo: "X",
    data_ora: null, evento_id: "e1", biglietti_dichiarati: null, importo_pagato: null, anomalie: [],
    ricevuto_il: "2026-10-26T10:00:00.000Z",
    biglietti: assegna(tariffa, null).biglietti, ...extra });
  test("tariffe: una voce con righe, nessun pacchetto", () => {
    const v = vociLiveticket(ordine(["Intero", "Intero"]), prezzi);
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({ id: "lvtckt-30534501", liveticket: "lvtckt-30534501", pacchetti: 0, contrassegno: null,
      righe: [{ tariffa_id: "int", quantita: 2, prezzo: 2800 }] });
    expect(persone(v[0])).toBe(2);
  });
  test("pacchetti: una voce per ristorante e pasto, righe nella prima (a tavola con il pacchetto)", () => {
    const v = vociLiveticket(ordine(["PRANZO + SPETTACOLO CM", "CENA + SPETTACOLO GG", "CENA + SPETTACOLO GG", "Intero"]), prezzi);
    expect(v).toHaveLength(2);
    expect(v.map((x) => x.id)).toEqual(Array(2).fill("lvtckt-30534501"));
    expect(v.map((x) => [x.ristorante, x.pasto, x.pacchetti, x.righe.length, x.prezzo_pacchetto_teatro]))
      .toEqual([["CASALE", "PRANZO", 1, 1, 2200], ["GIAMAICA", "CENA", 2, 0, 2200]]);
  });
  test("pacchetti + Intero: tutti a tavola, 3 coperti", () => {
    const v = vociLiveticket(ordine(["CENA + SPETTACOLO GG", "CENA + SPETTACOLO GG", "Intero"]), prezzi);
    expect(v).toHaveLength(1);
    expect(riepilogoEvento(v, 100, tariffe).ristoranti.GIAMAICA.CENA).toBe(3);
  });
  test("solo pacchetti: righe sulla prima voce pacchetto", () => {
    const v = vociLiveticket(ordine(["CENA + SPETTACOLO GG"]), prezzi);
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({ pacchetti: 1, ristorante: "GIAMAICA", righe: [] });
  });
  test("non abbinati → tariffa_id vuoto, prezzo 0", () => {
    const v = vociLiveticket(ordine(["Boh"]), prezzi);
    expect(v[0].righe).toEqual([{ tariffa_id: "", quantita: 1, prezzo: 0 }]);
  });
  test("dichiarati in più → riga non abbinata in più", () => {
    const v = vociLiveticket(ordine(["Intero", "Intero"], { biglietti_dichiarati: 3 }), prezzi);
    expect(v[0].righe).toContainEqual({ tariffa_id: "", quantita: 1, prezzo: 0 });
    expect(persone(v[0])).toBe(3);
  });
  test("dichiarati in meno dei letti → contano i letti", () => {
    const v = vociLiveticket(ordine(["Intero", "Intero"], { biglietti_dichiarati: 1 }), prezzi);
    expect(v.reduce((s, x) => s + persone(x), 0)).toBe(2);
  });
  test("riepilogo, elenco ristorante e testo", () => {
    const v = vociLiveticket(ordine(["Boh", "CENA + SPETTACOLO GG", "CENA + SPETTACOLO GG"]), prezzi);
    expect(riepilogoEvento(v, 100, tariffe).perTariffa).toContainEqual({ tariffa_id: "", nome: TARIFFA_NON_ABBINATA, quantita: 1 });
    expect(elencoRistorante(v, "GIAMAICA", "CENA")).toHaveLength(1);
    expect(testoElencoRistorante({ ristorante: "GIAMAICA", pasto: "CENA", dataOra: new Date("2026-10-10T19:00:00Z"),
      titolo: "X", prenotazioni: v })).toContain("- 3x FERRO CHIARA (2x pacchetti + 1x alla carta) – +393472300236 – LiveTicket");
  });
});

describe("postiCompatti", () => {
  test("raggruppa per fila, senza Platea, posti in ordine numerico", () =>
    expect(postiCompatti(["Platea, Fila P, Posto n. 10", "Platea, Fila O, Posto n. 11", "Platea, Fila O, Posto n. 3",
      "Platea, Fila O, Posto n. 4", "Platea, Fila O, Posto n. 3"])).toBe("Fila O 3, 4, 11 · Fila P 10"));
  test("formato diverso in coda, lista vuota", () => {
    expect(postiCompatti(["Platea, Ingresso libero", "Platea, Fila F, Posto n. 1"])).toBe("Fila F 1 · Ingresso libero");
    expect(postiCompatti([])).toBe("");
  });
});

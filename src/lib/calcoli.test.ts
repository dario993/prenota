import { describe, expect, test } from "vitest";
import {
  confrontaVersioni, descriviBiglietti, indiceDestinazione, spostaElemento, elencoRistorante, euroInCentesimi, formattaDataOra, formattaEuro, partiData, incassoRistorante,
  incassoTeatro, persone, righeConPrezzi, riepilogoEvento, tariffeDelModulo, testoElencoRistorante, vociPacchetti,
  TARIFFA_ELIMINATA, type Prenotazione, type Tariffa,
} from "./calcoli";
import { vociLiveticket, type OrdineLiveticket } from "./liveticket";

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
    expect(r.ristoranti.CASALE).toEqual({ PRANZO: 0, CENA: 3, incasso: 5400 });
    expect(r.ristoranti.GIAMAICA).toEqual({ PRANZO: 0, CENA: 0, incasso: 0 });
  });
  test("riepilogo: prenotazioni e totale per pagamento scelto", () => {
    const r = riepilogoEvento([pren({ righe: [riga(A, 2, 1500)], pagamento: "da_pagare" }),
      pren({ righe: [riga(A, 1, 1500)], pacchetti: 1, ristorante: "CASALE", pasto: "CENA", pagamento: "da_pagare" }),
      pren({ righe: [riga(A, 1, 1500)] })], 100, tariffe);
    expect(r.pagamenti.da_pagare).toEqual({ prenotazioni: 2, importo: 3000 + 1500 + 2200 + 2700 });
    expect(r.pagamenti.bonifico).toEqual({ prenotazioni: 0, importo: 0 });
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
    expect(descriviBiglietti(pren({ righe: [riga("", 2), riga("x-sparita", 1)] }), tariffe))
      .toBe("2 Non abbinata (LiveTicket) · 1 Tariffa eliminata");
  });
  test("elencoRistorante filtra ristorante+pasto e ordina", () => {
    const l = [
      pren({ cognome_nome: "Zeta", pacchetti: 1, ristorante: "CASALE", pasto: "CENA" }),
      pren({ cognome_nome: "alfa", pacchetti: 1, ristorante: "CASALE", pasto: "CENA" }),
      pren({ cognome_nome: "Altro", pacchetti: 1, ristorante: "CASALE", pasto: "PRANZO" }),
      pren({ cognome_nome: "Altro2", pacchetti: 1, ristorante: "GIAMAICA", pasto: "CENA" }),
      pren({ cognome_nome: "NoPacchetti", righe: [riga(A, 3)] }),
      pren({ cognome_nome: "Annullata", pacchetti: 1, ristorante: "CASALE", pasto: "CENA", contrassegno: "annullato" }),
    ];
    expect(elencoRistorante(l, "CASALE", "CENA").map((x) => x.cognome_nome)).toEqual(["alfa", "Zeta"]);
  });
  test("testoElencoRistorante formato esatto", () => {
    expect(testoElencoRistorante({ ristorante: "CASALE", pasto: "CENA", dataOra: new Date("2026-10-10T19:00:00Z"),
      titolo: "DOCUFILM", prenotazioni: [
        pren({ cognome_nome: "ROSSI MARIO", pacchetti: 2, ristorante: "CASALE", pasto: "CENA",
          telefono: "333 1234567", note: "1 celiaco" }),
        pren({ cognome_nome: "Gruppo Sicilia", pacchetti: 10, ristorante: "CASALE", pasto: "CENA" })] }))
      .toBe("CASALE – CENA – sab 10 ottobre 2026\nOpera: DOCUFILM\nCoperti: 12\n\n- 10x Gruppo Sicilia\n- 2x ROSSI MARIO – 333 1234567 – 1 celiaco");
  });
  test("a tavola tutta la prenotazione: 2 pacchetti + 1 intero + 1 bambino = 4 coperti, incasso solo pacchetti", () => {
    const p = pren({ cognome_nome: "ROSSI MARIO", pacchetti: 2, righe: [riga(A, 1, 1500), riga(R, 1, 1200)],
      ristorante: "CASALE", pasto: "PRANZO", note: "1 celiaco" });
    const r = riepilogoEvento([p], 100, tariffe);
    expect(r.ristoranti.CASALE).toEqual({ PRANZO: 4, CENA: 0, incasso: 2 * 2700 });
    expect(testoElencoRistorante({ ristorante: "CASALE", pasto: "PRANZO", dataOra: new Date("2026-11-01T11:00:00Z"),
      titolo: "X", prenotazioni: [p] })).toContain("Coperti: 4\n\n- 4x ROSSI MARIO (2x pacchetti + 2x alla carta) – 1 celiaco");
  });
  test("vociPacchetti: solo con pacchetto, annullate segnate, fonte LiveTicket", () => {
    const v = vociPacchetti([
      pren({ id: "a", cognome_nome: "ROSSI", pacchetti: 2, righe: [riga(A, 2)], ristorante: "GIAMAICA", pasto: "CENA" }),
      pren({ id: "b", cognome_nome: "BIANCHI", pacchetti: 1, ristorante: "CASALE", pasto: "PRANZO", contrassegno: "annullato" }),
      pren({ id: "c", cognome_nome: "VERDI", righe: [riga(A, 3)] }),
      pren({ id: "lvtckt-1", cognome_nome: "NERI", pacchetti: 1, ristorante: "CASALE", pasto: "PRANZO", liveticket: "lvtckt-1" }),
    ]);
    expect(v.map((x) => [x.id, x.fonte, x.persone, x.dettaglio, x.annullata])).toEqual([
      ["b", "PRENOTATI", 1, "", true], ["lvtckt-1", "LIVETICKET", 1, "", false],
      ["a", "PRENOTATI", 4, "2x pacchetti + 2x alla carta", false]]);
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
  test("partiData: giorno, mese e ora in Europe/Rome", () =>
    expect(partiData(new Date("2026-11-01T15:30:00Z"))).toEqual({
      giorno: "1", settimana: "dom", mese: "nov", ora: "16:30", lunga: "domenica 1 novembre",
    }));
  test("confrontaVersioni: valore precedente solo sui campi cambiati", () => {
    const prima = pren({ cognome_nome: "Rossi", telefono: "333", righe: [riga(A, 2, 1500)] });
    const dopo = pren({ cognome_nome: "Rossi", telefono: "334", righe: [riga(A, 3, 1500)], contrassegno: "stampato" });
    const cambiati = confrontaVersioni(dopo, prima, tariffe).filter((c) => c.era !== undefined)
      .map((c) => [c.campo, c.era, c.valore]);
    expect(cambiati.map((c) => c.join("|").replace(/\s/g, " "))).toEqual([
      "Telefono|333|334", "Biglietti|2 Adulti|3 Adulti", "Persone|2|3", "Totale|30,00 €|45,00 €", "Stato|Nessuno stato|Stampato",
    ]);
    expect(confrontaVersioni(dopo, null, tariffe).every((c) => c.era === undefined)).toBe(true);
  });
  test("spostaElemento e indiceDestinazione per il trascinamento", () => {
    expect(spostaElemento(["a", "b", "c", "d"], 0, 2)).toEqual(["b", "c", "a", "d"]);
    expect(spostaElemento(["a", "b", "c", "d"], 3, 0)).toEqual(["d", "a", "b", "c"]);
    expect(spostaElemento(["a", "b"], 1, 1)).toEqual(["a", "b"]);
    const centri = [10, 30, 50, 70];
    expect(indiceDestinazione(centri, 0, 12)).toBe(0); // appena mosso: resta
    expect(indiceDestinazione(centri, 0, 55)).toBe(2); // oltre il terzo
    expect(indiceDestinazione(centri, 3, 5)).toBe(0); // in cima
    expect(indiceDestinazione(centri, 1, 999)).toBe(3); // in fondo
  });

  test("riepilogo con LiveTicket: l'unione somma persone e posti, l'incasso teatro della lista non cambia", () => {
    const b = (tariffa_id: string, prezzo: number) => ({ posto: "A1", tariffa: "", tariffa_id, ristorante: null, pasto: null, prezzo });
    const ordine: OrdineLiveticket = { codice: "lvtckt-1", cognome_nome: "ROSSI", telefono: "", spettacolo: "", data_ora: null,
      evento_id: "e", biglietti_dichiarati: 5, importo_pagato: null, anomalie: [], ricevuto_il: "",
      biglietti: [b(A, 1500), b(A, 1500), b(R, 1200), { ...b("", 0), ristorante: "CASALE", pasto: "CENA", prezzo: 4900 }, b(R, 1200)] };
    const lista = [pren({ righe: [riga(A, 2, 1500)], pacchetti: 1, ristorante: "CASALE", pasto: "CENA" })];
    const lt = vociLiveticket(ordine, { prezzo_pacchetto_teatro: 2200, prezzo_pacchetto_ristorante: 2700 });
    const rp = riepilogoEvento(lista, 20, tariffe), rl = riepilogoEvento(lt, 20, tariffe), r = riepilogoEvento([...lista, ...lt], 20, tariffe);
    expect(rl.persone).toBe(5);
    expect(r.persone).toBe(rp.persone + rl.persone); expect(r.postiLiberi).toBe(20 - 8);
    expect(rp.incassoTeatro).toBe(3000 + 2200);
    expect(rl.incassoTeatro).toBe(3000 + 2400 + 2200);
    expect(new Set(lt.map((v) => v.liveticket)).size).toBe(1);
    expect(r.ristoranti.CASALE.CENA).toBe(rp.ristoranti.CASALE.CENA + rl.ristoranti.CASALE.CENA);
    expect(r.perTariffa).toEqual([{ tariffa_id: A, nome: "Adulti", quantita: 4 }, { tariffa_id: R, nome: "Ridotti gruppi", quantita: 2 }]);
  });
});

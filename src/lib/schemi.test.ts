import { describe, expect, test } from "vitest";
import { schemaEvento, schemaLocale, schemaLogin, schemaOpera, schemaPrenotazione, schemaPrimoAccesso, schemaUtente } from "./schemi";

const T1 = "2c9a6a8e-6f0e-4a57-8d3e-3c1f0a2b7c33", T2 = "3c9a6a8e-6f0e-4a57-8d3e-3c1f0a2b7c44";
const base = {
  id: "0b9a6a8e-6f0e-4a57-9d3e-3c1f0a2b7c11",
  evento_id: "1c9a6a8e-6f0e-4a57-8d3e-3c1f0a2b7c22",
  cognome_nome: "ROSSI",
  telefono: "333",
  posti: "A1",
  provenienza: "",
  righe: [{ tariffa_id: T1, quantita: 1 }], pacchetti: 0,
  ristorante: null, pasto: null,
};

describe("schemaPrenotazione", () => {
  test("serve almeno una persona", () => {
    const r = schemaPrenotazione.safeParse({ ...base, righe: [{ tariffa_id: T1, quantita: 0 }] });
    expect(r.success).toBe(false);
    const i = r.error!.issues.find((x) => x.path[0] === "righe");
    expect(i?.message).toBe("Inserisci almeno una persona");
  });
  test("pagamento: assente = null, valore sconosciuto rifiutato", () => {
    expect(schemaPrenotazione.parse(base).pagamento).toBeNull();
    expect(schemaPrenotazione.parse({ ...base, pagamento: "bonifico" }).pagamento).toBe("bonifico");
    expect(schemaPrenotazione.safeParse({ ...base, pagamento: "contanti" }).success).toBe(false);
  });
  test("solo pacchetti basta", () =>
    expect(schemaPrenotazione.safeParse({ ...base, righe: [], pacchetti: 2, ristorante: "CASALE", pasto: "CENA" }).success).toBe(true));
  test("la stessa tariffa due volte è rifiutata", () => {
    const r = schemaPrenotazione.safeParse({ ...base, righe: [{ tariffa_id: T1, quantita: 1 }, { tariffa_id: T1, quantita: 2 }] });
    expect(r.error!.issues[0].message).toBe("Tariffa ripetuta");
  });
  test("le righe a 0 non si salvano", () =>
    expect(schemaPrenotazione.parse({ ...base, righe: [{ tariffa_id: T1, quantita: 2 }, { tariffa_id: T2, quantita: 0 }] }).righe)
      .toEqual([{ tariffa_id: T1, quantita: 2 }]));
  test("pacchetti > 0 richiede ristorante e pasto", () => {
    const a = schemaPrenotazione.safeParse({ ...base, pacchetti: 2, pasto: "CENA" });
    expect(a.error!.issues.map((x) => x.path[0])).toEqual(["ristorante"]);
    const b = schemaPrenotazione.safeParse({ ...base, pacchetti: 2, ristorante: "CASALE" });
    expect(b.error!.issues.map((x) => x.path[0])).toEqual(["pasto"]);
  });
  test("pacchetti = 0 azzera ristorante e pasto", () => {
    const r = schemaPrenotazione.parse({ ...base, ristorante: "CASALE", pasto: "CENA" });
    expect(r.ristorante).toBeNull();
    expect(r.pasto).toBeNull();
  });
  test("cognome_nome viene trimmato e non può essere vuoto", () => {
    expect(schemaPrenotazione.parse({ ...base, cognome_nome: "  ROSSI " }).cognome_nome).toBe("ROSSI");
    expect(schemaPrenotazione.safeParse({ ...base, cognome_nome: "   " }).success).toBe(false);
  });
  test("quantità come stringhe (form), note di default vuote", () => {
    const r = schemaPrenotazione.parse({ ...base, righe: [{ tariffa_id: T1, quantita: "3" }] });
    expect(r.righe[0].quantita).toBe(3);
    expect(r.note).toBe("");
  });
});

describe("schemaOpera", () => {
  const opera = {
    titolo: "Amleto",
    tariffe: [{ nome: "Adulti", prezzo: "15", nascosta: false }, { nome: "Bambini", prezzo: "5,5", nascosta: false }],
    prezzo_pacchetto_teatro: "22,00", prezzo_pacchetto_ristorante: "27", pacchetto_nascosto: false,
  };
  const conTariffe = (tariffe: { nome: string; prezzo: string; nascosta: boolean }[]) => ({ ...opera, tariffe });
  test("converte euro in centesimi", () =>
    expect(schemaOpera.parse(opera)).toMatchObject({
      tariffe: [{ nome: "Adulti", prezzo: 1500 }, { nome: "Bambini", prezzo: 550 }],
      prezzo_pacchetto_teatro: 2200, prezzo_pacchetto_ristorante: 2700,
    }));
  test("importo non valido indica la tariffa", () =>
    expect(schemaOpera.safeParse(conTariffe([{ nome: "Bambini", prezzo: "abc", nascosta: false }])).error!.issues[0].message)
      .toBe("Importo non valido: Bambini"));
  test("importo del pacchetto non valido", () =>
    expect(schemaOpera.safeParse({ ...opera, prezzo_pacchetto_ristorante: "-1" }).error!.issues[0].message)
      .toBe("Importo non valido: Pacchetto quota ristorante"));
  test("nomi uguali a parte maiuscole e spazi sono rifiutati", () =>
    expect(schemaOpera.safeParse(conTariffe([{ nome: "Adulti", prezzo: "1", nascosta: false },
      { nome: " adulti ", prezzo: "2", nascosta: false }])).error!.issues[0].message).toBe("Tariffa ripetuta: adulti"));
  test("«Pacchetti» è un nome riservato", () =>
    expect(schemaOpera.safeParse(conTariffe([{ nome: "pacchetti", prezzo: "1", nascosta: false }])).error!.issues[0].message)
      .toBe("Nome riservato: Pacchetti"));
  test("tutto nascosto non si salva", () =>
    expect(schemaOpera.safeParse({ ...conTariffe([{ nome: "Adulti", prezzo: "1", nascosta: true }]), pacchetto_nascosto: true })
      .error!.issues[0].message).toBe("Lascia visibile almeno una tariffa"));
  test("solo il pacchetto visibile va bene", () =>
    expect(schemaOpera.safeParse(conTariffe([{ nome: "Adulti", prezzo: "1", nascosta: true }])).success).toBe(true));
});

test("schemaLogin normalizza email", () => {
  expect(schemaLogin.parse({ email: "  Mario@X.it ", password: "x" }).email).toBe("mario@x.it");
});

describe("schemaPrimoAccesso", () => {
  const ok = { nome: "Mario", email: "  Mario@X.it ", password: "password1", conferma: "password1" };
  test("normalizza email", () => {
    expect(schemaPrimoAccesso.parse(ok).email).toBe("mario@x.it");
  });
  test("password diverse: errore su conferma", () => {
    const r = schemaPrimoAccesso.safeParse({ ...ok, conferma: "altra1234" });
    expect(r.success ? [] : r.error.issues[0].path).toEqual(["conferma"]);
  });
  test("password corta rifiutata", () => {
    expect(schemaPrimoAccesso.safeParse({ ...ok, password: "corta", conferma: "corta" }).success).toBe(false);
  });
});

test("schemaEvento accetta datetime-local", () => {
  const ids = { opera_id: base.id, locale_id: base.evento_id };
  expect(schemaEvento.safeParse({ ...ids, data_ora: "2026-11-07T21:00" }).success).toBe(true);
  expect(schemaEvento.safeParse({ ...ids, data_ora: "07/11/2026" }).success).toBe(false);
});

test("schemaUtente: password opzionale ma min 8, email normalizzata", () => {
  const u = { nome: "Mario", email: " M@X.it ", ruolo: "operatore" };
  expect(schemaUtente.parse(u).email).toBe("m@x.it");
  expect(schemaUtente.safeParse({ ...u, password: "corta" }).success).toBe(false);
  expect(schemaUtente.safeParse({ ...u, password: "abcdefgh" }).success).toBe(true);
  expect(schemaUtente.safeParse({ ...u, ruolo: "boss" }).success).toBe(false);
});

test("schemaUtente: email obbligatoria tranne che per API key", () => {
  const u = { nome: "Mario", ruolo: "operatore" };
  expect(schemaUtente.safeParse(u).success).toBe(false);
  expect(schemaUtente.safeParse({ ...u, email: "" }).success).toBe(false);
  const api = schemaUtente.parse({ ...u, ruolo: "api", email: "", password: "" });
  expect(api.email).toBeNull();
  expect(api.password).toBeUndefined();
});

test("schemaUtente: password vuota = undefined", () => {
  const u = { nome: "Mario", email: "m@x.it", ruolo: "admin", password: "" };
  const r = schemaUtente.parse(u);
  expect(r.password).toBeUndefined();
});

test("quantità: non numerica, negativa, frazionaria, enorme", () => {
  const con = (quantita: unknown) => ({ ...base, righe: [{ tariffa_id: T1, quantita }] });
  expect(schemaPrenotazione.safeParse(con("abc")).error!.issues[0].message).toBe("Numero non valido");
  expect(schemaPrenotazione.safeParse(con(-1)).success).toBe(false);
  expect(schemaPrenotazione.safeParse(con(1.5)).success).toBe(false);
  expect(schemaPrenotazione.safeParse(con(10001)).success).toBe(false);
  expect(schemaPrenotazione.safeParse({ ...base, pacchetti: -1 }).success).toBe(false);
});

test("schemaEvento rifiuta date impossibili", () => {
  const ids = { opera_id: base.id, locale_id: base.evento_id };
  for (const d of ["2026-13-45T99:99", "2026-02-30T21:00", "2026-11-07T24:00"])
    expect(schemaEvento.safeParse({ ...ids, data_ora: d }).success).toBe(false);
});

test("schemaLocale: capienza", () => {
  expect(schemaLocale.safeParse({ nome: "Teatro", capienza: "0" }).success).toBe(false);
  expect(schemaLocale.parse({ nome: "Teatro", capienza: "105" }).capienza).toBe(105);
});

test("schemaOpera rifiuta importi enormi", () => {
  const p = { titolo: "A", tariffe: [{ nome: "Adulti", prezzo: "100001", nascosta: false }],
    prezzo_pacchetto_teatro: "1", prezzo_pacchetto_ristorante: "1", pacchetto_nascosto: false };
  expect(schemaOpera.safeParse(p).error!.issues[0].message).toBe("Importo non valido: Adulti");
});

import { describe, expect, test } from "vitest";
import { schemaEvento, schemaLogin, schemaOpera, schemaPrenotazione, schemaUtente } from "./schemi";

const base = {
  id: "0b9a6a8e-6f0e-4a57-9d3e-3c1f0a2b7c11",
  evento_id: "1c9a6a8e-6f0e-4a57-8d3e-3c1f0a2b7c22",
  cognome_nome: "ROSSI",
  telefono: "333",
  posti: "A1",
  provenienza: "",
  adulti: 1, ridotti: 0, bambini: 0, pacchetti: 0, omaggi: 0,
  ristorante: null, pasto: null,
};

describe("schemaPrenotazione", () => {
  test("serve almeno una quantità > 0", () => {
    const r = schemaPrenotazione.safeParse({ ...base, adulti: 0 });
    expect(r.success).toBe(false);
    const i = r.error!.issues.find((x) => x.path[0] === "adulti");
    expect(i?.message).toBe("Inserisci almeno una persona");
  });
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
    const r = schemaPrenotazione.parse({ ...base, adulti: "3" });
    expect(r.adulti).toBe(3);
    expect(r.note).toBe("");
  });
});

test("schemaOpera converte euro", () => {
  const p = { titolo: "Amleto", prezzo_adulto: "15", prezzo_ridotto: "10", prezzo_bambino: "5,5", prezzo_pacchetto_teatro: "22,00", prezzo_pacchetto_ristorante: "27" };
  expect(schemaOpera.parse(p)).toMatchObject({ prezzo_adulto: 1500, prezzo_bambino: 550, prezzo_pacchetto_teatro: 2200, prezzo_pacchetto_ristorante: 2700 });
  const r = schemaOpera.safeParse({ ...p, prezzo_adulto: "abc" });
  expect(r.error!.issues[0].message).toBe("Importo non valido");
});

test("schemaLogin normalizza email", () => {
  expect(schemaLogin.parse({ email: "  Mario@X.it ", password: "x" }).email).toBe("mario@x.it");
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

import { describe, expect, it } from "vitest";
import type { Prenotazione } from "./calcoli";
import { normalizzaNome, normalizzaTelefono, possibiliDoppioni } from "./doppioni";

const v = (id: string, nome: string, telefono = "", extra: Partial<Prenotazione> = {}) =>
  ({ id, evento_id: "e", cognome_nome: nome, telefono, righe: [], pacchetti: 0, ristorante: null, pasto: null, posti: "",
    provenienza: "", note: "", prezzo_pacchetto_teatro: 0, prezzo_pacchetto_ristorante: 0, ...extra }) as Prenotazione;
const lt = (codice: string, nome: string, telefono = "") => v(codice, nome, telefono, { liveticket: codice });

describe("normalizzazione", () => {
  it("nome: ordine, maiuscole, accenti, spazi", () => {
    expect(normalizzaNome("Rossi  Mario")).toBe(normalizzaNome("MARIO ROSSI"));
    expect(normalizzaNome("Nicolò")).toBe("NICOLO");
  });
  it("telefono: prefisso 39/0039", () => {
    const n = normalizzaTelefono("3472300236");
    expect(normalizzaTelefono("+39 347 230 0236")).toBe(n);
    expect(normalizzaTelefono("0039347-2300236")).toBe(n);
    expect(normalizzaTelefono("39")).toBe("39");
    expect(normalizzaTelefono("")).toBe("");
  });
});

describe("possibiliDoppioni", () => {
  it("telefono vuoto non crea doppioni", () => expect(possibiliDoppioni([v("a", "A B"), v("b", "C D")]).size).toBe(0));
  it("due ordini LiveTicket non si confrontano", () => expect(possibiliDoppioni([lt("l1", "A B"), lt("l2", "A B")]).size).toBe(0));
  it("annullata esclusa", () => expect(possibiliDoppioni([v("a", "A B"), v("b", "A B", "", { contrassegno: "annullato" })]).size).toBe(0));
  it("voci dello stesso ordine non sono doppioni", () => expect(possibiliDoppioni([lt("l1", "A B", "333111222"), lt("l1", "A B", "333111222")]).size).toBe(0));
  it("prenotazione e ordine con stesso telefono", () => {
    const m = possibiliDoppioni([v("a", "X Y", "+39 347 230 0236"), lt("l1", "Z W", "3472300236"), lt("l1", "Z W", "3472300236")]);
    expect(m.get("a")).toEqual([{ id: "l1", nome: "Z W", liveticket: true, motivo: "telefono" }]);
    expect(m.get("l1")).toEqual([{ id: "a", nome: "X Y", liveticket: false, motivo: "telefono" }]);
  });
  it("due prenotazioni stesso nome", () => {
    expect(possibiliDoppioni([v("a", "Rossi Mario"), v("b", "MARIO ROSSI")]).get("a")?.[0].motivo).toBe("nome");
  });
});

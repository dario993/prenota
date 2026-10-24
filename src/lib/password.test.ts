import { describe, expect, it } from "vitest";
import { hashPassword, verificaPassword } from "./password.mjs";

describe("password", () => {
  it("genera hash diversi a ogni chiamata", async () => {
    expect(await hashPassword("segreta123")).not.toBe(await hashPassword("segreta123"));
  });
  it("verifica la password corretta e rifiuta quella sbagliata", async () => {
    const h = await hashPassword("segreta123");
    expect(await verificaPassword("segreta123", h)).toBe(true);
    expect(await verificaPassword("sbagliata", h)).toBe(false);
  });
  it("non lancia con stringhe malformate", async () => {
    expect(await verificaPassword("x", "xyz")).toBe(false);
    expect(await verificaPassword("x", "scrypt$zz$zz")).toBe(false);
  });
});

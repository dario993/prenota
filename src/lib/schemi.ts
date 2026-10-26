import { z } from "zod";
import { euroInCentesimi, PAGAMENTI, PASTI, RISTORANTI } from "./calcoli";

const testo = (max: number) =>
  z.string().trim().min(1, "Campo obbligatorio").max(max, `Massimo ${max} caratteri`);
const quantita = z.coerce
  .number({ error: "Numero non valido" })
  .int("Numero intero")
  .min(0, "Non può essere negativo")
  .max(10000, "Valore troppo alto");
const email = z.string().trim().toLowerCase().pipe(z.email("Email non valida"));
const importo = (campo: string) => z.string().transform((v, ctx) => {
  const c = euroInCentesimi(v);
  if (c === null || c > 10_000_000) {
    ctx.addIssue({ code: "custom", message: `Importo non valido: ${campo}` });
    return 0;
  }
  return c;
});
export const schemaPrenotazione = z
  .object({
    id: z.uuid(),
    evento_id: z.uuid(),
    cognome_nome: testo(120),
    telefono: z.string().trim().max(40, "Massimo 40 caratteri").default(""),
    posti: z.string().trim().max(200, "Massimo 200 caratteri").default(""),
    provenienza: z.string().trim().max(200, "Massimo 200 caratteri").default(""),
    note: z.string().trim().max(1000, "Massimo 1000 caratteri").default(""),
    righe: z.array(z.object({ tariffa_id: z.uuid(), quantita })).max(50, "Troppe tariffe"),
    pacchetti: quantita,
    ristorante: z.enum(RISTORANTI).nullable(),
    pasto: z.enum(PASTI).nullable(),
    pagamento: z.enum(PAGAMENTI).nullable().default(null), // salvato solo in modifica
  })
  .superRefine((d, ctx) => {
    if (new Set(d.righe.map((r) => r.tariffa_id)).size !== d.righe.length)
      ctx.addIssue({ code: "custom", path: ["righe"], message: "Tariffa ripetuta" });
    if (d.righe.reduce((s, r) => s + r.quantita, 0) + d.pacchetti === 0)
      ctx.addIssue({ code: "custom", path: ["righe"], message: "Inserisci almeno una persona" });
    if (d.pacchetti > 0) {
      if (!d.ristorante) ctx.addIssue({ code: "custom", path: ["ristorante"], message: "Scegli il ristorante" });
      if (!d.pasto) ctx.addIssue({ code: "custom", path: ["pasto"], message: "Scegli pranzo o cena" });
    }
  })
  // le righe a 0 non si salvano; senza pacchetti ristorante e pasto devono essere null (vincolo DB)
  .transform((d) => ({
    ...d,
    righe: d.righe.filter((r) => r.quantita > 0),
    ...(d.pacchetti > 0 ? {} : { ristorante: null, pasto: null }),
  }));
export type DatiPrenotazione = z.infer<typeof schemaPrenotazione>;

export const schemaLocale = z.object({
  nome: testo(80),
  capienza: z.coerce
    .number({ error: "Numero non valido" })
    .int("Numero intero")
    .positive("Deve essere maggiore di 0")
    .max(10000, "Valore troppo alto"),
});

// Prezzi come testo dal form (virgola o punto); il messaggio d'errore nomina la tariffa.
export const schemaOpera = z
  .object({
    titolo: testo(120),
    tariffe: z
      .array(z.object({ id: z.uuid().optional(), nome: testo(40), prezzo: z.string(), nascosta: z.boolean() }))
      .min(1, "Serve almeno una tariffa")
      .max(30, "Massimo 30 tariffe"),
    prezzo_pacchetto_teatro: importo("Pacchetto quota teatro"),
    prezzo_pacchetto_ristorante: importo("Pacchetto quota ristorante"),
    pacchetto_nascosto: z.boolean(),
  })
  .transform((d, ctx) => {
    const visti = new Set<string>();
    const tariffe = d.tariffe.map((t, i) => {
      const chiave = t.nome.toLowerCase();
      if (chiave === "pacchetti")
        ctx.addIssue({ code: "custom", path: ["tariffe", i, "nome"], message: "Nome riservato: Pacchetti" });
      else if (visti.has(chiave))
        ctx.addIssue({ code: "custom", path: ["tariffe", i, "nome"], message: `Tariffa ripetuta: ${chiave}` });
      visti.add(chiave);
      const prezzo = euroInCentesimi(t.prezzo);
      if (prezzo === null || prezzo > 10_000_000)
        ctx.addIssue({ code: "custom", path: ["tariffe", i, "prezzo"], message: `Importo non valido: ${t.nome}` });
      return { ...t, prezzo: prezzo ?? 0 };
    });
    if (d.pacchetto_nascosto && tariffe.every((t) => t.nascosta))
      ctx.addIssue({ code: "custom", path: ["tariffe"], message: "Lascia visibile almeno una tariffa" });
    return { ...d, tariffe };
  });
export type DatiOpera = z.infer<typeof schemaOpera>;

export const schemaEvento = z.object({
  opera_id: z.uuid(),
  locale_id: z.uuid(),
  data_ora: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Data e ora non valide")
    .refine((v) => {
      const [a, m, g, h, mi] = v.split(/[-T:]/).map(Number);
      const d = new Date(Date.UTC(a, m - 1, g));
      return d.getUTCMonth() === m - 1 && d.getUTCDate() === g && h <= 23 && mi <= 59;
    }, "Data e ora non valide"),
});

// Utente «api»: niente email né password (la chiave è generata). Gli altri: email obbligatoria.
export const schemaUtente = z.object({
  nome: testo(80),
  email: z.string().trim().toLowerCase().optional(),
  // "" o assente in modifica = password invariata (undefined)
  password: z
    .string()
    .transform((v) => (v === "" ? undefined : v))
    .pipe(z.string().min(8, "Almeno 8 caratteri").optional())
    .optional(),
  ruolo: z.enum(["admin", "operatore", "visualizzatore", "api"]),
}).transform((d, ctx) => {
  if (d.ruolo === "api") return { ...d, email: null, password: undefined };
  const e = email.safeParse(d.email ?? "");
  if (!e.success) {
    ctx.addIssue({ code: "custom", message: "Email non valida", path: ["email"] });
    return z.NEVER;
  }
  return { ...d, email: e.data };
});

export const schemaLogin = z.object({
  email: z.string().trim().toLowerCase(),
  password: z.string().min(1, "Inserisci la password"),
});

export const schemaPrimoAccesso = z
  .object({
    nome: testo(80),
    email,
    password: z.string().min(8, "Almeno 8 caratteri"),
    conferma: z.string(),
  })
  .refine((d) => d.password === d.conferma, {
    message: "Le password non coincidono",
    path: ["conferma"],
  });

// Ordine LiveTicket letto da n8n (POST /api/liveticket): data/ora locali Europe/Rome, tutto ciò che può mancare è null.
const opz = <T extends z.ZodType>(s: T) => s.nullish().transform((v) => v ?? null);
export const schemaOrdineLiveticket = z.object({
  codice: z.string().regex(/^lvtckt-\d+$/, "Codice non valido"),
  nome: z.string().trim().max(120).default(""),
  cognome: z.string().trim().max(120).default(""),
  telefono: opz(z.string().trim().max(40)),
  spettacolo: z.string().trim().max(200).default(""),
  data: opz(z.iso.date()),
  ora: opz(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Ora non valida")),
  biglietti_dichiarati: opz(z.number().int().min(0).max(10000)),
  biglietti: z.array(z.object({ posto: z.string().trim().max(200), tariffa: z.string().trim().max(200) })).max(200),
  importo_pagato: opz(z.number().int().min(0).max(10_000_000)),
  anomalie: z.array(z.string().max(300)).max(50).default([]),
  email_id: z.string().max(500).default(""),
  email_data: z.string().max(200).default(""),
});

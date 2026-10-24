import { z } from "zod";
import { euroInCentesimi, PASTI, RISTORANTI } from "./calcoli";

const testo = (max: number) =>
  z.string().trim().min(1, "Campo obbligatorio").max(max, `Massimo ${max} caratteri`);
const quantita = z.coerce
  .number({ error: "Numero non valido" })
  .int("Numero intero")
  .min(0, "Non può essere negativo")
  .max(10000, "Valore troppo alto");
const email = z.string().trim().toLowerCase().pipe(z.email("Email non valida"));
const importo = z.string().transform((v, ctx) => {
  const c = euroInCentesimi(v);
  if (c === null || c > 10_000_000) {
    ctx.addIssue({ code: "custom", message: "Importo non valido" });
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
    adulti: quantita,
    ridotti: quantita,
    bambini: quantita,
    pacchetti: quantita,
    omaggi: quantita,
    ristorante: z.enum(RISTORANTI).nullable(),
    pasto: z.enum(PASTI).nullable(),
  })
  .superRefine((d, ctx) => {
    if (d.adulti + d.ridotti + d.bambini + d.pacchetti + d.omaggi === 0)
      ctx.addIssue({ code: "custom", path: ["adulti"], message: "Inserisci almeno una persona" });
    if (d.pacchetti > 0) {
      if (!d.ristorante) ctx.addIssue({ code: "custom", path: ["ristorante"], message: "Scegli il ristorante" });
      if (!d.pasto) ctx.addIssue({ code: "custom", path: ["pasto"], message: "Scegli pranzo o cena" });
    }
  })
  // senza pacchetti ristorante e pasto devono essere null (vincolo DB)
  .transform((d) => (d.pacchetti > 0 ? d : { ...d, ristorante: null, pasto: null }));
export type DatiPrenotazione = z.infer<typeof schemaPrenotazione>;

export const schemaLocale = z.object({
  nome: testo(80),
  capienza: z.coerce
    .number({ error: "Numero non valido" })
    .int("Numero intero")
    .positive("Deve essere maggiore di 0")
    .max(10000, "Valore troppo alto"),
});

export const schemaOpera = z.object({
  titolo: testo(120),
  prezzo_adulto: importo,
  prezzo_ridotto: importo,
  prezzo_bambino: importo,
  prezzo_pacchetto_teatro: importo,
  prezzo_pacchetto_ristorante: importo,
});

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

export const schemaUtente = z.object({
  nome: testo(80),
  email,
  // "" o assente in modifica = password invariata (undefined)
  password: z
    .string()
    .transform((v) => (v === "" ? undefined : v))
    .pipe(z.string().min(8, "Almeno 8 caratteri").optional())
    .optional(),
  ruolo: z.enum(["admin", "operatore"]),
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

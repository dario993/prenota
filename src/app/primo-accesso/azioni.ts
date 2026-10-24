"use server";

import { redirect } from "next/navigation";
import { creaPrimoAdmin } from "@/lib/auth";
import { schemaPrimoAccesso } from "@/lib/schemi";

export async function azioneCreaPrimoAdmin(input: unknown): Promise<{ errore: string }> {
  const dati = schemaPrimoAccesso.safeParse(input);
  if (!dati.success) return { errore: "Dati non validi" };
  const { nome, email, password } = dati.data;
  if (!(await creaPrimoAdmin({ nome, email, password }))) {
    return { errore: "Esiste già un utente: accedi" };
  }
  redirect("/");
}

"use server";

import { redirect } from "next/navigation";
import { accedi } from "@/lib/auth";
import { schemaLogin } from "@/lib/schemi";

export async function azioneAccedi(input: unknown): Promise<{ errore: string }> {
  const dati = schemaLogin.safeParse(input);
  if (!dati.success || !(await accedi(dati.data.email, dati.data.password))) {
    return { errore: "Email o password errati" };
  }
  redirect("/");
}

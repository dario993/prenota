"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { schemaPrimoAccesso } from "@/lib/schemi";
import { btnPrimario, campo, erroreCampo, etichetta, scheda } from "@/components/stili";
import { azioneCreaPrimoAdmin } from "./azioni";

type Campi = { nome: string; email: string; password: string; conferma: string };

export function FormPrimoAccesso() {
  const [errore, setErrore] = useState("");
  const { register, handleSubmit, formState } = useForm<Campi>({
    resolver: zodResolver(schemaPrimoAccesso),
  });
  const err = formState.errors;

  const invia = handleSubmit(async (dati) => {
    setErrore("");
    const r = await azioneCreaPrimoAdmin(dati);
    if (r?.errore) setErrore(r.errore);
  });

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <form method="post" onSubmit={invia} className={`${scheda} w-full max-w-sm space-y-4 p-6`}>
        <div>
          <h1 className="text-title">Crea il primo amministratore</h1>
          <p className="mt-1 text-caption text-ink-muted">Con questo accesso potrai aggiungere locali, opere, eventi e altri utenti.</p>
        </div>
        <label className={etichetta}>
          Nome
          <input type="text" autoComplete="name" aria-invalid={!!err.nome} className={campo} {...register("nome")} />
          {err.nome && <span className={erroreCampo}>{err.nome.message}</span>}
        </label>
        <label className={etichetta}>
          Email
          <input type="text" inputMode="email" autoComplete="username" aria-invalid={!!err.email} className={campo} {...register("email")} />
          {err.email && <span className={erroreCampo}>{err.email.message}</span>}
        </label>
        <label className={etichetta}>
          Password
          <input type="password" autoComplete="new-password" aria-invalid={!!err.password} className={campo} {...register("password")} />
          {err.password && <span className={erroreCampo}>{err.password.message}</span>}
        </label>
        <label className={etichetta}>
          Conferma password
          <input type="password" autoComplete="new-password" aria-invalid={!!err.conferma} className={campo} {...register("conferma")} />
          {err.conferma && <span className={erroreCampo}>{err.conferma.message}</span>}
        </label>
        {errore && <p role="alert" className="text-caption text-danger">{errore}</p>}
        <button type="submit" disabled={formState.isSubmitting} className={`${btnPrimario} w-full`}>
          {formState.isSubmitting ? "Invio…" : "Crea e accedi"}
        </button>
      </form>
    </main>
  );
}

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { schemaLogin } from "@/lib/schemi";
import { btnPrimario, campo, erroreCampo, etichetta, scheda } from "@/components/stili";
import { azioneAccedi } from "./azioni";

type Campi = { email: string; password: string };

export function FormLogin() {
  const [errore, setErrore] = useState("");
  const { register, handleSubmit, formState } = useForm<Campi>({
    resolver: zodResolver(schemaLogin),
  });

  const invia = handleSubmit(async (dati) => {
    setErrore("");
    const r = await azioneAccedi(dati);
    if (r?.errore) setErrore(r.errore);
  });

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <form method="post" onSubmit={invia} className={`${scheda} w-full max-w-sm space-y-4 p-6`}>
        <h1 className="text-title">Prenota</h1>
        <label className={etichetta}>
          Email
          <input
            type="text"
            inputMode="email"
            autoComplete="username"
            className={campo}
            {...register("email")}
          />
        </label>
        <label className={etichetta}>
          Password
          <input
            type="password"
            autoComplete="current-password"
            aria-invalid={!!formState.errors.password}
            className={campo}
            {...register("password")}
          />
          {formState.errors.password && (
            <span className={erroreCampo}>{formState.errors.password.message}</span>
          )}
        </label>
        {errore && <p role="alert" className="text-caption text-danger">{errore}</p>}
        <button type="submit" disabled={formState.isSubmitting} className={`${btnPrimario} w-full`}>
          {formState.isSubmitting ? "Invio…" : "Accedi"}
        </button>
      </form>
    </main>
  );
}

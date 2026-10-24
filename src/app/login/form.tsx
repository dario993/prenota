"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { schemaLogin } from "@/lib/schemi";
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
    <main className="flex flex-1 items-center justify-center p-4">
      <form onSubmit={invia} className="w-full max-w-sm space-y-4">
        <h1 className="text-center text-3xl font-bold text-accento">Prenota</h1>
        <label className="block text-sm">
          Email
          <input
            type="text"
            inputMode="email"
            autoComplete="username"
            className="mt-1 w-full rounded border border-gray-300 p-3"
            {...register("email")}
          />
        </label>
        <label className="block text-sm">
          Password
          <input
            type="password"
            autoComplete="current-password"
            className="mt-1 w-full rounded border border-gray-300 p-3"
            {...register("password")}
          />
          {formState.errors.password && (
            <span className="text-red-600">{formState.errors.password.message}</span>
          )}
        </label>
        {errore && <p role="alert" className="text-sm text-red-600">{errore}</p>}
        <button
          type="submit"
          disabled={formState.isSubmitting}
          className="w-full rounded bg-accento p-3 font-medium text-white hover:bg-accento-scuro disabled:opacity-60"
        >
          Accedi
        </button>
      </form>
    </main>
  );
}

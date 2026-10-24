"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { schemaPrimoAccesso } from "@/lib/schemi";
import { azioneCreaPrimoAdmin } from "./azioni";

type Campi = { nome: string; email: string; password: string; conferma: string };

const classeCampo = "mt-1 w-full rounded border border-gray-300 p-3";

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
    <main className="flex flex-1 items-center justify-center p-4">
      <form onSubmit={invia} className="w-full max-w-sm space-y-4">
        <h1 className="text-center text-2xl font-bold text-accento">Crea il primo amministratore</h1>
        <label className="block text-sm">
          Nome
          <input type="text" autoComplete="name" className={classeCampo} {...register("nome")} />
          {err.nome && <span className="text-red-600">{err.nome.message}</span>}
        </label>
        <label className="block text-sm">
          Email
          <input type="text" inputMode="email" autoComplete="username" className={classeCampo} {...register("email")} />
          {err.email && <span className="text-red-600">{err.email.message}</span>}
        </label>
        <label className="block text-sm">
          Password
          <input type="password" autoComplete="new-password" className={classeCampo} {...register("password")} />
          {err.password && <span className="text-red-600">{err.password.message}</span>}
        </label>
        <label className="block text-sm">
          Conferma password
          <input type="password" autoComplete="new-password" className={classeCampo} {...register("conferma")} />
          {err.conferma && <span className="text-red-600">{err.conferma.message}</span>}
        </label>
        {errore && <p role="alert" className="text-sm text-red-600">{errore}</p>}
        <button
          type="submit"
          disabled={formState.isSubmitting}
          className="w-full rounded bg-accento p-3 font-medium text-white hover:bg-accento-scuro disabled:opacity-60"
        >
          Crea amministratore
        </button>
      </form>
    </main>
  );
}

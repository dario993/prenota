"use client";
import { QueryClient } from "@tanstack/react-query";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import type { DatiPrenotazione } from "./schemi";

const GIORNO = 24 * 60 * 60 * 1000;

export function creaQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { gcTime: GIORNO, staleTime: 30_000 } } });
}

// Solo nel browser: il layout root viene reso anche sul server.
export const persister =
  typeof window === "undefined"
    ? undefined
    : createSyncStoragePersister({ storage: window.localStorage, key: "prenota-cache" });

const messaggioErrore = async (r: Response): Promise<string> => {
  const corpo: unknown = await r.json().catch(() => null);
  const errore = (corpo as { errore?: unknown } | null)?.errore;
  return typeof errore === "string" ? errore : "Errore imprevisto, riprova";
};

export async function getJson<T>(url: string): Promise<T> {
  const r = await fetch(url).catch(() => {
    throw new Error("Rete non disponibile");
  });
  if (r.status === 401) {
    window.location.href = "/login";
    throw new Error("Sessione scaduta");
  }
  if (!r.ok) throw new Error(await messaggioErrore(r));
  return r.json() as Promise<T>;
}

// POST di una nuova prenotazione: id generato dal client, il reinvio con lo stesso id non duplica.
export async function inviaPrenotazione(d: DatiPrenotazione): Promise<{ id: string }> {
  const r = await fetch("/api/prenotazioni", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(d),
  }).catch(() => {
    throw new Error("Rete non disponibile");
  });
  if (r.status === 401) throw new Error("Sessione scaduta");
  if (!r.ok) throw new Error(await messaggioErrore(r));
  return r.json() as Promise<{ id: string }>;
}


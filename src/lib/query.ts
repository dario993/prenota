"use client";
import { QueryClient } from "@tanstack/react-query";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

const GIORNO = 24 * 60 * 60 * 1000;

export function creaQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { gcTime: GIORNO, staleTime: 30_000 } } });
}

// Solo nel browser: il layout root viene reso anche sul server.
export const persister =
  typeof window === "undefined"
    ? undefined
    : createSyncStoragePersister({ storage: window.localStorage, key: "prenota-cache" });

export async function getJson<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (r.status === 401) {
    window.location.href = "/login";
    throw new Error("Sessione scaduta");
  }
  if (!r.ok) throw new Error((await r.text()) || `Errore ${r.status}`);
  return r.json() as Promise<T>;
}

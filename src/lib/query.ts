"use client";
import { useSyncExternalStore } from "react";
import {
  QueryClient, onlineManager, useMutationState, type Mutation,
} from "@tanstack/react-query";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { toast } from "sonner";
import type { DatiPrenotazione } from "./schemi";

const GIORNO = 24 * 60 * 60 * 1000;

export const CHIAVE_NUOVA = ["nuova-prenotazione"] as const;

// Una nuova prenotazione è "in coda" finché è pending (anche in pausa) o finita in errore:
// entrambe vanno salvate sul telefono, non solo quelle in pausa (default di TanStack).
const daConservare = (m: Mutation) => m.state.status === "pending" || m.state.status === "error";

export function creaQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { gcTime: GIORNO, staleTime: 30_000 },
      dehydrate: { shouldDehydrateMutation: daConservare },
    },
  });
}

// Solo nel browser: il layout root viene reso anche sul server.
// throttleTime 0: una prenotazione messa in coda finisce su localStorage subito, prima che una
// navigazione completa (senza rete Next ricarica la pagina dalla cache) possa interrompere la scrittura.
// serialize: un Error diventa {} in JSON; così il motivo di una prenotazione rifiutata sopravvive al riavvio.
const CHIAVE_CACHE = "prenota-cache";
export const persister =
  typeof window === "undefined"
    ? undefined
    : createSyncStoragePersister({
      storage: window.localStorage, key: CHIAVE_CACHE, throttleTime: 0,
      serialize: (c) => JSON.stringify(c, (_k, v: unknown) => (v instanceof Error ? { message: v.message } : v)),
    });

// Al logout: nessun dato del vecchio utente resta sul telefono (cache, pagine salvate dal service worker).
export async function svuotaDatiLocali(qc: QueryClient): Promise<void> {
  qc.clear();
  await globalThis.caches?.delete("prenota-v1").catch(() => {});
  localStorage.removeItem(CHIAVE_CACHE);
}

// TanStack parte sempre "online" e ascolta solo gli eventi: se l'app si apre già senza rete deve saperlo.
if (typeof window !== "undefined") onlineManager.setOnline(navigator.onLine);

export class ErroreSessione extends Error {}
// problema temporaneo: rete assente o che non risponde, errore 5xx del server
export class ErroreRete extends Error {}
const temporaneo = (e: unknown) => e instanceof ErroreSessione || e instanceof ErroreRete;

let avvisoSessione = false;
function chiediLogin() {
  if (avvisoSessione) return;
  avvisoSessione = true;
  // login nella stessa scheda: la coda è su localStorage e riparte quando l'app torna aperta dopo il login
  toast.error("Accedi di nuovo per inviare le prenotazioni in attesa", {
    id: "sessione", duration: Infinity,
    action: { label: "Accedi", onClick: () => { window.location.href = "/login"; } },
  });
}

// Deve stare in setMutationDefaults (non nel form): dopo un riavvio dell'app vale solo questo.
export function registraMutazioni(qc: QueryClient): void {
  qc.setMutationDefaults(CHIAVE_NUOVA, {
    mutationFn: inviaPrenotazione,
    gcTime: Infinity, // una prenotazione non inviata non deve sparire da sola
    // sessione scaduta, rete che "c'è ma non va", 5xx: si riprova senza fine, ogni 30 s;
    // gli altri 4xx (dati rifiutati, evento cancellato) non migliorano riprovando: subito "non inviata"
    retry: (_n, err) => temporaneo(err),
    retryDelay: 30_000,
    onSuccess: (_r, d: DatiPrenotazione) => {
      if (avvisoSessione) toast.dismiss("sessione");
      avvisoSessione = false;
      toast.success(`Prenotazione inviata: ${d.cognome_nome}`);
      void qc.invalidateQueries({ queryKey: ["eventi"] });
      void qc.invalidateQueries({ queryKey: ["provenienze"] });
      // atteso: resta "in attesa" finché l'elenco dal server non la contiene, senza sparire per un attimo;
      // poi la mutation riuscita esce dalla cache (con gcTime infinito resterebbe in memoria per sempre)
      return qc.invalidateQueries({ queryKey: ["evento", d.evento_id] }).then(() => {
        const cache = qc.getMutationCache();
        for (const m of cache.findAll({ mutationKey: CHIAVE_NUOVA, predicate: (x) => (x.state.variables as DatiPrenotazione)?.id === d.id }))
          cache.remove(m);
      });
    },
    onError: (e, d: DatiPrenotazione) => toast.error(`Prenotazione di ${d.cognome_nome} non inviata: ${e.message}`),
  });
}

// Alla riapertura (chiamata dal menu, cioè solo con una sessione): riparte tutto ciò che era in coda,
// anche un invio interrotto a metà (non in pausa).
export function riprendiCoda(qc: QueryClient): void {
  for (const m of qc.getMutationCache().findAll({ mutationKey: CHIAVE_NUOVA, status: "pending" }))
    void m.continue().catch(() => {});
}

export type InAttesa = DatiPrenotazione & { stato: "pending" | "error"; errore?: string; mutationId: number };

export function useInAttesa(eventoId?: string): InAttesa[] {
  return useMutationState({
    filters: {
      mutationKey: CHIAVE_NUOVA,
      predicate: (m) =>
        (m.state.status === "pending" || m.state.status === "error") &&
        (!eventoId || (m.state.variables as DatiPrenotazione).evento_id === eventoId),
    },
    select: (m) => ({
      ...(m.state.variables as DatiPrenotazione),
      stato: m.state.status as "pending" | "error",
      errore: m.state.error?.message,
      mutationId: m.mutationId,
    }),
  });
}

export function useOnline(): boolean {
  return useSyncExternalStore(
    (cb) => onlineManager.subscribe(cb),
    () => onlineManager.isOnline(),
    () => true,
  );
}

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
    throw new ErroreRete("Rete non disponibile");
  });
  if (r.status === 401) {
    chiediLogin();
    throw new ErroreSessione("Sessione scaduta");
  }
  if (r.status >= 500) throw new ErroreRete(await messaggioErrore(r));
  if (!r.ok) throw new Error(await messaggioErrore(r));
  return r.json() as Promise<{ id: string }>;
}


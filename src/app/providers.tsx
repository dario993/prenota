"use client";
import { useState } from "react";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Toaster } from "sonner";
import { creaQueryClient, persister, registraMutazioni } from "@/lib/query";

// Sul server (render del layout root) il persister non esiste: uno vuoto.
const nessunPersister = {
  persistClient: async () => {},
  restoreClient: async () => undefined,
  removeClient: async () => {},
};

export function Providers({ children }: { children: React.ReactNode }) {
  // le mutation devono avere la loro funzione prima del ripristino da localStorage
  const [client] = useState(() => {
    const qc = creaQueryClient();
    registraMutazioni(qc);
    return qc;
  });
  return (
    <PersistQueryClientProvider
      client={client}
      // maxAge infinito: un telefono rimasto spento giorni non deve perdere le prenotazioni in coda
      persistOptions={{ persister: persister ?? nessunPersister, maxAge: Infinity, buster: "1" }}
    >
      {children}
      <Toaster position="top-center" richColors />
    </PersistQueryClientProvider>
  );
}

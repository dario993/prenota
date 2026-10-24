"use client";
import { useState } from "react";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Toaster } from "sonner";
import { creaQueryClient, persister } from "@/lib/query";

// Sul server (render del layout root) il persister non esiste: uno vuoto.
const nessunPersister = {
  persistClient: async () => {},
  restoreClient: async () => undefined,
  removeClient: async () => {},
};

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(creaQueryClient);
  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{ persister: persister ?? nessunPersister, maxAge: 24 * 60 * 60 * 1000, buster: "1" }}
      onSuccess={() => {}}
    >
      {children}
      <Toaster position="top-center" richColors />
    </PersistQueryClientProvider>
  );
}

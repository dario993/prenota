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
      {/* messaggi temporanei in basso, sopra la barra di navigazione; colori dai token (stati-e-messaggi.md) */}
      <Toaster position="bottom-center" richColors closeButton theme="system" duration={4000}
        mobileOffset={{ bottom: "calc(64px + env(safe-area-inset-bottom) + 8px)" }}
        toastOptions={{ className: "!rounded-md !shadow-overlay !text-body !font-sans" }}
        style={{
          "--success-bg": "var(--success-soft)", "--success-text": "var(--ink)", "--success-border": "var(--success-soft)",
          "--error-bg": "var(--danger-soft)", "--error-text": "var(--ink)", "--error-border": "var(--danger)",
          "--info-bg": "var(--toast-bg)", "--info-text": "var(--toast-ink)", "--info-border": "var(--toast-bg)",
          "--normal-bg": "var(--toast-bg)", "--normal-text": "var(--toast-ink)", "--normal-border": "var(--toast-bg)",
          "--width": "min(640px, calc(100vw - 32px))",
        } as React.CSSProperties} />
    </PersistQueryClientProvider>
  );
}

"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { ERRORE_IMPREVISTO, type Esito } from "@/lib/esito";

export function BottoneAttiva({ azione, attivo, nome }: { azione: () => Promise<Esito>; attivo: boolean; nome: string }) {
  const router = useRouter();
  const [pending, avvia] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      aria-label={`${attivo ? "Disattiva" : "Attiva"} ${nome}`}
      className="min-h-11 px-3 text-sm text-red-600 hover:underline disabled:opacity-60"
      onClick={() => {
        if (attivo && !confirm(`Disattivare "${nome}"? Perderà subito l'accesso.`)) return;
        avvia(async () => {
          try {
            const r = await azione();
            if ("errore" in r) return void toast.error(r.errore);
            toast.success(attivo ? "Disattivato" : "Attivato");
            router.refresh();
          } catch {
            toast.error(ERRORE_IMPREVISTO);
          }
        });
      }}
    >
      {attivo ? "Disattiva" : "Attiva"}
    </button>
  );
}

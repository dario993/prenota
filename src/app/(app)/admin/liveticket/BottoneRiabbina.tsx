"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { btnPrimario } from "@/components/stili";
import { ERRORE_IMPREVISTO } from "@/lib/esito";
import { riabbina } from "./azioni";

export function BottoneRiabbina() {
  const router = useRouter();
  const [pending, avvia] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className={btnPrimario}
      onClick={() => avvia(async () => {
        try {
          const { aggiornati } = await riabbina();
          toast.success(aggiornati === 0 ? "Nessun ordine da aggiornare" : aggiornati === 1 ? "1 ordine aggiornato" : `${aggiornati} ordini aggiornati`);
          router.refresh();
        } catch {
          toast.error(ERRORE_IMPREVISTO);
        }
      })}
    >
      {pending ? "Riabbino…" : "Riabbina"}
    </button>
  );
}

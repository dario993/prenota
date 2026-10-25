"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ERRORE_IMPREVISTO } from "@/lib/esito";
import { btnPrimario, btnSecondario, campo, etichetta, scheda } from "@/components/stili";
import { creaChiave } from "./azioni";

// Crea la chiave e la mostra una sola volta, da copiare subito.
export function NuovaChiave() {
  const router = useRouter();
  const [pending, avvia] = useTransition();
  const [chiave, setChiave] = useState<string | null>(null);

  function invia(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const nome = String(new FormData(form).get("nome") ?? "");
    avvia(async () => {
      try {
        const r = await creaChiave(nome);
        if ("errore" in r) return void toast.error(r.errore);
        setChiave(r.chiave);
        form.reset();
        router.refresh();
      } catch {
        toast.error(ERRORE_IMPREVISTO);
      }
    });
  }

  return (
    <div className={`${scheda} max-w-160 space-y-4`}>
      <form onSubmit={invia} className="flex flex-wrap items-end gap-2">
        <label className={`${etichetta} min-w-0 flex-1`}>Nome della chiave
          <input name="nome" required maxLength={80} placeholder="es. Claude" className={campo} />
        </label>
        <button disabled={pending} className={`${btnPrimario} min-w-28`}>{pending ? "Invio…" : "Crea chiave"}</button>
      </form>
      {chiave && (
        <div className="space-y-2">
          <p className="text-caption text-ink-muted">Copiala adesso: non verrà più mostrata.</p>
          <code className="block break-all rounded-sm bg-surface-sunken p-3 text-caption">{chiave}</code>
          <button
            type="button"
            className={btnSecondario}
            onClick={() => navigator.clipboard.writeText(chiave).then(() => toast.success("Copiata"), () => toast.error("Copia non riuscita"))}
          >
            Copia
          </button>
        </div>
      )}
    </div>
  );
}

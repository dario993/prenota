"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { ERRORE_IMPREVISTO, type Esito } from "@/lib/esito";
import { btnDistruttivo, btnPrimario, btnSecondario, scheda } from "./stili";

// Form admin: onSubmit (non <form action>: React svuoterebbe i campi anche in caso di errore) + Server Action che ritorna Esito; l'esito va in un toast.
// `dopo`: percorso a cui tornare dopo un salvataggio riuscito (es. uscire dalla modifica).
export function FormAzione({
  azione, dopo, testo = "Salva", annulla, children, className,
}: {
  azione: (fd: FormData) => Promise<Esito>;
  dopo?: string;
  testo?: string;
  annulla?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const [pending, avvia] = useTransition();
  function invia(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    avvia(async () => {
      let r: Esito;
      try {
        r = await azione(fd);
      } catch {
        return void toast.error(ERRORE_IMPREVISTO);
      }
      if ("errore" in r) return void toast.error(r.errore);
      toast.success("Salvato");
      form.reset();
      if (dopo) router.replace(dopo);
    });
  }
  return (
    <form onSubmit={invia} className={className ?? `${scheda} max-w-160 space-y-4`}>
      {children}
      <div className="flex flex-wrap items-center gap-2 pt-2">
        <button disabled={pending} className={`${btnPrimario} min-w-28`}>
          {pending ? "Invio…" : testo}
        </button>
        {annulla && <Link href={annulla} className={btnSecondario}>Annulla</Link>}
      </div>
    </form>
  );
}

// Bottone d'azione con conferma opzionale; di default è "Elimina" (distruttivo).
export function BottoneElimina({
  azione, conferma, nome, etichetta = "Elimina", successo = "Eliminato", variante = "pericolo",
}: {
  azione: () => Promise<Esito>;
  conferma?: string;
  nome: string;
  etichetta?: string;
  successo?: string;
  variante?: "pericolo" | "normale";
}) {
  const router = useRouter();
  const [pending, avvia] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      aria-label={`${etichetta} ${nome}`}
      className={variante === "pericolo" ? btnDistruttivo : btnSecondario}
      onClick={() => {
        if (conferma && !confirm(conferma)) return;
        avvia(async () => {
          try {
            const r = await azione();
            if ("errore" in r) return void toast.error(r.errore);
            toast.success(successo);
            router.refresh();
          } catch {
            toast.error(ERRORE_IMPREVISTO);
          }
        });
      }}
    >
      {etichetta}
    </button>
  );
}


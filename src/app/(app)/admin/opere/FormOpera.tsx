"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { ERRORE_IMPREVISTO, type Esito } from "@/lib/esito";
import { btnDistruttivo, btnPrimario, btnSecondario, campo, etichetta, scheda } from "@/components/stili";

// Valori come li scrive l'admin (prezzi in testo con la virgola); la validazione è sul server (schemaOpera).
export type ValoriOpera = {
  titolo: string;
  tariffe: { id?: string; nome: string; prezzo: string; nascosta: boolean }[];
  prezzo_pacchetto_teatro: string;
  prezzo_pacchetto_ristorante: string;
  pacchetto_nascosto: boolean;
};

const spunta = "flex min-h-11 items-center gap-2 text-label text-ink";

export function FormOpera({ iniziale, salva }: { iniziale: ValoriOpera; salva: (dati: ValoriOpera) => Promise<Esito> }) {
  const router = useRouter();
  const [pending, avvia] = useTransition();
  const { register, control, handleSubmit } = useForm<ValoriOpera>({ defaultValues: iniziale });
  const { fields, append, remove } = useFieldArray({ control, name: "tariffe", keyName: "chiave" });

  // in caso di errore i campi restano compilati: si torna all'elenco solo se salvato
  const invia = handleSubmit((dati) => avvia(async () => {
    let r: Esito;
    try {
      r = await salva(dati);
    } catch {
      return void toast.error(ERRORE_IMPREVISTO);
    }
    if ("errore" in r) return void toast.error(r.errore);
    toast.success("Salvato");
    router.replace("/admin/opere");
  }));

  return (
    <form onSubmit={(e) => void invia(e)} className="max-w-160 space-y-6">
      <div className={`${scheda} space-y-4`}>
        <label className={etichetta}>Titolo
          <input {...register("titolo")} required maxLength={120} className={campo} />
        </label>
      </div>

      <fieldset className={`${scheda} space-y-4`}>
        <legend className="px-1 text-label">Tariffe</legend>
        {fields.map((f, i) => (
          <div key={f.chiave} className="grid grid-cols-[minmax(0,1fr)_7rem] items-end gap-3 border-b border-line pb-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_7rem_auto_auto]">
            <label className={etichetta}>Nome
              <input {...register(`tariffe.${i}.nome`)} required maxLength={40} className={campo} />
            </label>
            <label className={etichetta}>Prezzo (€)
              <input {...register(`tariffe.${i}.prezzo`)} required inputMode="decimal" className={`${campo} tabular-nums`} />
            </label>
            <label className={spunta}>
              <input type="checkbox" {...register(`tariffe.${i}.nascosta`)} className="size-5 accent-(--accent)" />Nascosta
            </label>
            <button type="button" onClick={() => remove(i)} aria-label={`Elimina la tariffa ${i + 1}`} className={btnDistruttivo}>
              <Trash2 size={20} aria-hidden />Elimina
            </button>
          </div>
        ))}
        <button type="button" onClick={() => append({ nome: "", prezzo: "", nascosta: false })} className={btnSecondario}>
          <Plus size={20} aria-hidden />Aggiungi tariffa
        </button>
        <p className="text-caption text-ink-muted">
          Le tariffe nascoste non compaiono quando si prenota, ma le prenotazioni che le usano restano valide.
          Una tariffa già usata non si può eliminare: nascondila.
        </p>
      </fieldset>

      <fieldset className={`${scheda} space-y-4`}>
        <legend className="px-1 text-label">Pacchetto</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={etichetta}>Quota teatro (€)
            <input {...register("prezzo_pacchetto_teatro")} required inputMode="decimal" className={`${campo} tabular-nums`} />
          </label>
          <label className={etichetta}>Quota ristorante (€)
            <input {...register("prezzo_pacchetto_ristorante")} required inputMode="decimal" className={`${campo} tabular-nums`} />
          </label>
        </div>
        <label className={spunta}>
          <input type="checkbox" {...register("pacchetto_nascosto")} className="size-5 accent-(--accent)" />Nascosto
        </label>
        <p className="text-caption text-ink-muted">
          Il pacchetto costa la somma delle due quote. Cambiare il tariffario non modifica le prenotazioni già salvate.
        </p>
      </fieldset>

      <div className="flex flex-wrap items-center gap-2">
        <button disabled={pending} className={`${btnPrimario} min-w-28`}>{pending ? "Invio…" : "Salva"}</button>
        <Link href="/admin/opere" className={btnSecondario}>Annulla</Link>
      </div>
    </form>
  );
}

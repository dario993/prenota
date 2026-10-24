"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { onlineManager, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { z } from "zod";
import { Contatore } from "@/components/Contatore";
import { getJson, useOnline, CHIAVE_NUOVA } from "@/lib/query";
import { schemaPrenotazione, type DatiPrenotazione } from "@/lib/schemi";
import {
  persone, prezziDi, incassoTeatro, incassoRistorante, riepilogoEvento, formattaEuro,
  RISTORANTI, PASTI, NOMI_RISTORANTI, NOMI_PASTI,
  type DettaglioEvento, type Prenotazione, type Quantita,
} from "@/lib/calcoli";
import { modificaPrenotazione, eliminaPrenotazione } from "./azioni";

type Campi = z.input<typeof schemaPrenotazione>;
const QUANTITA = [["adulti", "Adulti"], ["ridotti", "Ridotti gruppi"], ["bambini", "Bambini"],
  ["pacchetti", "Pacchetti"], ["omaggi", "Omaggi"]] as const;
const campo = "mt-1 w-full rounded-lg border border-gray-300 bg-white p-3";
const scelta = "flex-1 cursor-pointer rounded-lg border border-gray-300 bg-white p-3 text-center font-medium has-checked:border-accento has-checked:bg-accento has-checked:text-white has-focus-visible:ring-2 has-focus-visible:ring-accento";

const Errore = ({ id, msg }: { id: string; msg?: string }) =>
  msg ? <span id={`errore-${id}`} role="alert" className="text-sm text-red-600">{msg}</span> : null;

// Riletto all'apertura (prezzi attuali, persone per l'avviso di capienza); in modifica lo fa già ModificaPrenotazione.
const useEvento = (id: string, rileggi = true) =>
  useQuery({ queryKey: ["evento", id], queryFn: () => getJson<DettaglioEvento>(`/api/eventi/${id}`),
    refetchOnMount: rileggi ? "always" : true });

function Messaggio({ testo }: { testo: string }) {
  return <main className="mx-auto max-w-2xl p-4 lg:p-8"><p className="text-gray-500">{testo}</p></main>;
}

// Pagina di modifica: cerca la prenotazione nel dettaglio evento (dalla cache o dalla rete).
export function ModificaPrenotazione({ eventoId, pid }: { eventoId: string; pid: string }) {
  const { data, isFetching, error } = useEvento(eventoId);
  const p = data?.prenotazioni.find((x) => x.id === pid);
  if (p) return <FormPrenotazione eventoId={eventoId} iniziale={p} />;
  if (isFetching) return <Messaggio testo="Caricamento…" />;
  return <Messaggio testo={error?.message ?? "Prenotazione non trovata"} />;
}

export function FormPrenotazione({ eventoId, iniziale }: { eventoId: string; iniziale?: Prenotazione }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { data, isPending, error } = useEvento(eventoId, !iniziale);
  const { data: provenienze } = useQuery({ queryKey: ["provenienze"], queryFn: () => getJson<string[]>("/api/provenienze") });
  const [id] = useState(() => iniziale?.id ?? crypto.randomUUID());
  const [eliminando, setEliminando] = useState(false);

  const { register, handleSubmit, setValue, control, formState: { errors, isSubmitting, isSubmitted } } =
    useForm<Campi, unknown, DatiPrenotazione>({
      resolver: zodResolver(schemaPrenotazione),
      defaultValues: {
        id, evento_id: eventoId,
        cognome_nome: iniziale?.cognome_nome ?? "", telefono: iniziale?.telefono ?? "",
        adulti: iniziale?.adulti ?? 0, ridotti: iniziale?.ridotti ?? 0, bambini: iniziale?.bambini ?? 0,
        pacchetti: iniziale?.pacchetti ?? 0, omaggi: iniziale?.omaggi ?? 0,
        ristorante: iniziale?.ristorante ?? null, pasto: iniziale?.pasto ?? null,
        posti: iniziale?.posti ?? "", provenienza: iniziale?.provenienza ?? "", note: iniziale?.note ?? "",
      },
    });
  const valori = useWatch({ control });
  const aria = (k: keyof typeof errors) =>
    ({ "aria-invalid": !!errors[k], "aria-describedby": errors[k] ? `errore-${k}` : undefined });
  const inCorso = useRef(false); // il doppio tocco arriva prima che il pulsante si disattivi
  const q = Object.fromEntries(QUANTITA.map(([k]) => [k, Number(valori[k]) || 0])) as unknown as Quantita;

  const fatto = (messaggio: string) => {
    toast.success(messaggio);
    for (const k of [["evento", eventoId], ["eventi"], ["provenienze"]]) qc.invalidateQueries({ queryKey: k });
    router.push(`/eventi/${eventoId}`);
  };
  const online = useOnline();
  // funzione, toast e aggiornamento dell'elenco stanno in registraMutazioni: valgono anche dopo un riavvio
  const nuova = useMutation<{ id: string }, Error, DatiPrenotazione>({ mutationKey: CHIAVE_NUOVA });
  const torna = (avviso?: string) => {
    if (avviso) toast.info(avviso);
    router.push(`/eventi/${eventoId}`);
  };
  // primo invio fallito con la rete accesa: un errore temporaneo (rete che non risponde, sessione scaduta, 5xx)
  // resta in coda e riprova da solo; un rifiuto (4xx) ha già il suo toast e resta in elenco come "non inviata".
  // In entrambi i casi il form non resta bloccato ad aspettare.
  const fallita = nuova.failureCount > 0;
  useEffect(() => {
    if (fallita) torna(nuova.isError ? undefined : "Invio non riuscito, riprovo automaticamente");
  }, [fallita]); // eslint-disable-line react-hooks/exhaustive-deps

  async function salva(d: DatiPrenotazione) {
    if (inCorso.current) return;
    inCorso.current = true;
    if (!iniziale) {
      // senza rete la mutation va in pausa e non chiama né onSuccess né onError: si torna subito all'evento
      const senzaRete = !onlineManager.isOnline();
      nuova.mutate(d, { onSuccess: () => router.push(`/eventi/${eventoId}`) });
      if (senzaRete) torna("Salvata sul telefono, verrà inviata quando torna la rete");
      return;
    }
    const r = await modificaPrenotazione(d).catch(() => ({ errore: "Rete non disponibile" }));
    inCorso.current = false;
    if ("errore" in r) toast.error(r.errore);
    else fatto("Prenotazione salvata");
  }

  async function elimina() {
    if (!iniziale || !confirm(`Eliminare la prenotazione di ${iniziale.cognome_nome}?`)) return;
    setEliminando(true);
    const r = await eliminaPrenotazione(iniziale.id).catch(() => ({ errore: "Rete non disponibile" }));
    setEliminando(false);
    if ("errore" in r) toast.error(r.errore);
    else fatto("Prenotazione eliminata");
  }

  if (!data) return <Messaggio testo={isPending ? "Caricamento…" : (error?.message ?? "Errore imprevisto, riprova")} />;

  // Modifica: prezzi congelati della prenotazione; nuova: tariffario attuale dell'opera.
  const prezzi = prezziDi(iniziale ?? data.evento);
  const teatro = incassoTeatro({ ...prezzi, ...q });
  const ristorante = incassoRistorante({ ...prezzi, ...q });
  const altre = riepilogoEvento(data.prenotazioni.filter((p) => p.id !== id), data.evento.capienza);
  const oltre = altre.persone + persone(q) - data.evento.capienza;
  const occupato = isSubmitting || nuova.isPending || eliminando;
  const bloccata = !!iniziale && !online; // modifica ed eliminazione richiedono la rete

  return (
    <main className="mx-auto max-w-2xl p-4 lg:p-8">
      <Link href={`/eventi/${eventoId}`} className="text-sm text-accento hover:underline">← {data.evento.titolo}</Link>
      <h1 className="mb-4 text-xl font-semibold lg:text-2xl">{iniziale ? "Modifica prenotazione" : "Nuova prenotazione"}</h1>
      <form onSubmit={(e) => void handleSubmit(salva)(e)} noValidate className="space-y-4">
        <label className="block text-sm">
          Cognome Nome
          <input autoComplete="off" className={campo} {...register("cognome_nome")} {...aria("cognome_nome")} />
          <Errore id="cognome_nome" msg={errors.cognome_nome?.message} />
        </label>
        <label className="block text-sm">
          Telefono
          <input type="tel" autoComplete="off" className={campo} {...register("telefono")} {...aria("telefono")} />
          <Errore id="telefono" msg={errors.telefono?.message} />
        </label>

        <fieldset {...aria("adulti")} className="space-y-2 rounded-lg border border-gray-200 bg-white p-3">
          <legend className="px-1 text-sm">Quantità</legend>
          {QUANTITA.map(([k, etichetta]) => (
            <Contatore key={k} etichetta={etichetta} valore={q[k]}
              onChange={(n) => setValue(k, n, { shouldValidate: isSubmitted })} />
          ))}
          <Errore id="adulti" msg={errors.adulti?.message} />
        </fieldset>

        {q.pacchetti > 0 && (
          <fieldset className="space-y-3 rounded-lg border border-gray-200 bg-white p-3">
            <legend className="px-1 text-sm">Ristorante del pacchetto</legend>
            <div role="radiogroup" aria-label="Ristorante" {...aria("ristorante")} className="flex gap-2">
              {RISTORANTI.map((r) => (
                <label key={r} className={scelta}>
                  <input type="radio" value={r} className="sr-only" {...register("ristorante")} />{NOMI_RISTORANTI[r]}
                </label>
              ))}
            </div>
            <Errore id="ristorante" msg={errors.ristorante?.message} />
            <div role="radiogroup" aria-label="Pasto" {...aria("pasto")} className="flex gap-2">
              {PASTI.map((p) => (
                <label key={p} className={scelta}>
                  <input type="radio" value={p} className="sr-only" {...register("pasto")} />{NOMI_PASTI[p]}
                </label>
              ))}
            </div>
            <Errore id="pasto" msg={errors.pasto?.message} />
          </fieldset>
        )}

        <label className="block text-sm">
          Posti prenotati
          <input autoComplete="off" placeholder="es. K1-4, L5" className={campo} {...register("posti")} {...aria("posti")} />
          <Errore id="posti" msg={errors.posti?.message} />
        </label>
        <label className="block text-sm">
          Provenienza
          <input list="provenienze" autoComplete="off" className={campo} {...register("provenienza")} {...aria("provenienza")} />
          <datalist id="provenienze">{provenienze?.map((p) => <option key={p} value={p} />)}</datalist>
          <Errore id="provenienza" msg={errors.provenienza?.message} />
        </label>
        <label className="block text-sm">
          Note
          <textarea rows={2} className={campo} {...register("note")} {...aria("note")} />
          <Errore id="note" msg={errors.note?.message} />
        </label>

        <section aria-label="Totali" className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
          <div className="flex justify-between"><span>Persone</span><b data-testid="form-persone">{persone(q)}</b></div>
          <div className="flex justify-between"><span>Teatro</span><span data-testid="form-teatro">{formattaEuro(teatro)}</span></div>
          <div className="flex justify-between"><span>Ristorante</span><span data-testid="form-ristorante">{formattaEuro(ristorante)}</span></div>
          <div className="flex justify-between font-semibold"><span>Totale</span><span data-testid="form-totale">{formattaEuro(teatro + ristorante)}</span></div>
        </section>
        {oltre > 0 && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 font-semibold text-red-700">Supera la capienza di {oltre} {oltre === 1 ? "posto" : "posti"}</p>
        )}

        <div className="flex gap-3">
          {iniziale && (
            <button type="button" onClick={elimina} disabled={occupato || bloccata}
              className="rounded-lg border border-red-300 px-4 py-3 font-medium text-red-700 disabled:opacity-60">Elimina</button>
          )}
          <button type="submit" disabled={occupato || bloccata}
            className="flex-1 rounded-lg bg-accento p-3 font-medium text-white hover:bg-accento-scuro disabled:opacity-60">{bloccata ? "Serve la rete" : "Salva"}</button>
        </div>
      </form>
    </main>
  );
}

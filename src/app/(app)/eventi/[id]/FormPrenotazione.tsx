"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { onlineManager, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, Trash2 } from "lucide-react";
import type { z } from "zod";
import { Contatore } from "@/components/Contatore";
import { Stato } from "@/components/Stato";
import { btnDistruttivo, btnPrimario, btnSecondario, campo, erroreCampo, etichetta, scelta } from "@/components/stili";
import { chiaveEvento, getJson, useInAttesa, useOnline, CHIAVE_NUOVA, SERVE_RETE } from "@/lib/query";
import { schemaPrenotazione, type DatiPrenotazione } from "@/lib/schemi";
import {
  persone, prezziPacchettoDi, incassoTeatro, incassoRistorante, riepilogoEvento, righeConPrezzi, tariffeDelModulo,
  formattaEuro, formattaDataOra, RISTORANTI, PASTI, NOMI_RISTORANTI, NOMI_PASTI,
  type DettaglioEvento, type Prenotazione,
} from "@/lib/calcoli";
import { modificaPrenotazione, eliminaPrenotazione } from "./azioni";

type Campi = z.input<typeof schemaPrenotazione>;
const textarea = campo.replace("h-12", "min-h-24 py-3");

const Errore = ({ id, msg }: { id: string; msg?: string }) =>
  msg ? <span id={`errore-${id}`} role="alert" className={erroreCampo}>{msg}</span> : null;

// Riletto all'apertura (prezzi attuali, persone per l'avviso di capienza); in modifica lo fa già ModificaPrenotazione.
const useEvento = (id: string, rileggi = true) =>
  useQuery({ queryKey: chiaveEvento(id), queryFn: () => getJson<DettaglioEvento>(`/api/eventi/${id}`),
    refetchOnMount: rileggi ? "always" : true });

// Pagina di modifica: cerca la prenotazione nel dettaglio evento. Si aspetta la rilettura dal server: il modulo
// nasce dai dati iniziali e, partendo da una copia vecchia, salvando cancellerebbe le righe aggiunte nel frattempo
// (senza rete la modifica è comunque bloccata, quindi la copia in cache basta solo per mostrarla).
export function ModificaPrenotazione({ eventoId, pid }: { eventoId: string; pid: string }) {
  const { data, isFetching, error, fetchStatus } = useEvento(eventoId);
  const p = data?.prenotazioni.find((x) => x.id === pid);
  if (p && !isFetching) return <FormPrenotazione eventoId={eventoId} iniziale={p} />;
  if (!data && fetchStatus === "paused") return <Stato testo={SERVE_RETE} />;
  if (isFetching) return <Stato testo="Caricamento…" />;
  return <Stato testo={error?.message ?? "Prenotazione non trovata"} nonTrovato />;
}

export function FormPrenotazione({ eventoId, iniziale }: { eventoId: string; iniziale?: Prenotazione }) {
  const { data, isPending, error, fetchStatus } = useEvento(eventoId, !iniziale);
  if (!data) {
    if (fetchStatus === "paused") return <Stato testo={SERVE_RETE} />;
    if (isPending) return <Stato testo="Caricamento…" />;
    return <Stato testo={error?.message ?? "Errore imprevisto, riprova"} nonTrovato />;
  }
  return <Modulo eventoId={eventoId} iniziale={iniziale} data={data} />;
}

// Il form nasce quando il tariffario è noto: un contatore per tariffa (visibili + nascoste già usate in modifica).
function Modulo({ eventoId, iniziale, data }: { eventoId: string; iniziale?: Prenotazione; data: DettaglioEvento }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { evento } = data;
  const [tariffe] = useState(() => tariffeDelModulo(evento.tariffe, iniziale?.righe));
  const conPacchetto = !evento.pacchetto_nascosto || (iniziale?.pacchetti ?? 0) > 0;
  const inAttesa = useInAttesa(eventoId);
  const { data: provenienze } = useQuery({ queryKey: ["provenienze"], queryFn: () => getJson<string[]>("/api/provenienze") });
  const [id] = useState(() => iniziale?.id ?? crypto.randomUUID());
  const [eliminando, setEliminando] = useState(false);

  const { register, handleSubmit, setValue, control, formState: { errors, isSubmitting, isSubmitted } } =
    useForm<Campi, unknown, DatiPrenotazione>({
      resolver: zodResolver(schemaPrenotazione),
      defaultValues: {
        id, evento_id: eventoId,
        cognome_nome: iniziale?.cognome_nome ?? "", telefono: iniziale?.telefono ?? "",
        righe: tariffe.map((t) => ({
          tariffa_id: t.id, quantita: iniziale?.righe.find((r) => r.tariffa_id === t.id)?.quantita ?? 0,
        })),
        pacchetti: iniziale?.pacchetti ?? 0,
        ristorante: iniziale?.ristorante ?? null, pasto: iniziale?.pasto ?? null,
        posti: iniziale?.posti ?? "", provenienza: iniziale?.provenienza ?? "", note: iniziale?.note ?? "",
      },
    });
  const valori = useWatch({ control });
  const aria = (k: keyof typeof errors) =>
    ({ "aria-invalid": !!errors[k], "aria-describedby": errors[k] ? `errore-${k}` : undefined });
  const inCorso = useRef(false); // il doppio tocco arriva prima che il pulsante si disattivi
  // quantità scritte finora, con i prezzi: congelati per le righe già salvate, attuali per le altre
  const righe = righeConPrezzi(
    (valori.righe ?? []).map((r) => ({ tariffa_id: r?.tariffa_id ?? "", quantita: Number(r?.quantita) || 0 })),
    evento.tariffe, iniziale?.righe);
  const q = { righe, pacchetti: Number(valori.pacchetti) || 0 };

  const fatto = (messaggio: string) => {
    toast.success(messaggio);
    for (const k of [chiaveEvento(eventoId), ["eventi"], ["provenienze"]]) qc.invalidateQueries({ queryKey: k });
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

  // Modifica: quote del pacchetto congelate nella prenotazione; nuova: quelle attuali dell'opera.
  const prezzi = prezziPacchettoDi(iniziale ?? evento);
  const teatro = incassoTeatro({ ...prezzi, ...q });
  const ristorante = incassoRistorante({ ...prezzi, ...q });
  // altre prenotazioni dell'evento: dal server più quelle in coda sul telefono (come nel riepilogo dell'evento),
  // senza quella che si sta scrivendo/modificando e senza doppioni tra coda e server
  const sulServer = new Set(data.prenotazioni.map((p) => p.id));
  const inCoda = inAttesa.filter((p) => p.stato === "pending" && !sulServer.has(p.id))
    .map((p) => ({ ...p, righe: righeConPrezzi(p.righe, evento.tariffe), ...prezziPacchettoDi(evento) }));
  const altre = riepilogoEvento([...data.prenotazioni, ...inCoda].filter((p) => p.id !== id), evento.capienza, evento.tariffe);
  const oltre = altre.persone + persone(q) - evento.capienza;
  const occupato = isSubmitting || nuova.isPending || eliminando;
  const bloccata = !!iniziale && !online; // modifica ed eliminazione richiedono la rete
  const prezzoDi = (tariffa_id: string) =>
    iniziale?.righe.find((r) => r.tariffa_id === tariffa_id)?.prezzo ?? evento.tariffe.find((t) => t.id === tariffa_id)?.prezzo ?? 0;
  const erroreQuantita = errors.righe?.message ?? errors.righe?.root?.message;

  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-6 lg:px-6">
      {/* evento di riferimento sempre visibile mentre si scorre il modulo */}
      <div className="sticky top-0 z-20 -mx-4 -mt-6 mb-4 border-b border-line bg-surface px-4 py-2 shadow-sm lg:-mx-6 lg:px-6">
        <Link href={`/eventi/${eventoId}`} className="inline-flex min-h-11 items-center gap-1 text-heading text-accent hover:underline">
          <ChevronLeft size={20} aria-hidden />{evento.titolo}
        </Link>
        <p className="pl-6 text-label text-ink">{formattaDataOra(new Date(evento.data_ora))} · {evento.locale}</p>
      </div>
      <div className="max-w-160">
        <h1 className="mb-6 text-title lg:text-display">{iniziale ? "Modifica prenotazione" : "Nuova prenotazione"}</h1>
        <form onSubmit={(e) => void handleSubmit(salva)(e)} noValidate className="space-y-4 pb-36 lg:pb-0">
          <label className={etichetta}>
            Cognome Nome
            <input autoComplete="off" className={campo} {...register("cognome_nome")} {...aria("cognome_nome")} />
            <Errore id="cognome_nome" msg={errors.cognome_nome?.message} />
          </label>
          <label className={etichetta}>
            Telefono
            <input type="tel" autoComplete="off" className={campo} {...register("telefono")} {...aria("telefono")} />
            <Errore id="telefono" msg={errors.telefono?.message} />
          </label>

          <fieldset aria-invalid={!!erroreQuantita} aria-describedby={erroreQuantita ? "errore-righe" : undefined}
            className="space-y-3 rounded-lg border border-line bg-surface p-4">
            <legend className="px-1 text-label">Quantità</legend>
            {tariffe.map((t, i) => (
              <Contatore key={t.id} etichetta={t.nome} valore={Number(valori.righe?.[i]?.quantita) || 0}
                prezzo={prezzoDi(t.id) ? formattaEuro(prezzoDi(t.id)) : "gratuito"}
                onChange={(n) => setValue(`righe.${i}.quantita`, n, { shouldValidate: isSubmitted })} />
            ))}
            {conPacchetto && (
              <Contatore etichetta="Pacchetti" valore={q.pacchetti}
                prezzo={formattaEuro(prezzi.prezzo_pacchetto_teatro + prezzi.prezzo_pacchetto_ristorante)}
                onChange={(n) => setValue("pacchetti", n, { shouldValidate: isSubmitted })} />
            )}
            <Errore id="righe" msg={erroreQuantita} />
          </fieldset>

          {q.pacchetti > 0 && (
            <fieldset className="space-y-3 rounded-lg border border-line bg-surface p-4">
              <legend className="px-1 text-label">Ristorante del pacchetto</legend>
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

          <label className={etichetta}>
            Posti prenotati
            <input autoComplete="off" placeholder="es. K1-4, L5" className={`${campo} font-mono`} {...register("posti")} {...aria("posti")} />
            <Errore id="posti" msg={errors.posti?.message} />
          </label>
          <label className={etichetta}>
            Provenienza
            <input list="provenienze" autoComplete="off" className={campo} {...register("provenienza")} {...aria("provenienza")} />
            <datalist id="provenienze">{provenienze?.map((p) => <option key={p} value={p} />)}</datalist>
            <Errore id="provenienza" msg={errors.provenienza?.message} />
          </label>
          <label className={etichetta}>
            Note
            <textarea rows={2} className={textarea} {...register("note")} {...aria("note")} />
            <Errore id="note" msg={errors.note?.message} />
          </label>

          {/* telefono: barra fissa sopra la navigazione con totali e Salva; desktop: in fondo al modulo */}
          <section aria-label="Totali"
            className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-10 bg-surface px-4 pb-3 pt-3 shadow-bar lg:static lg:rounded-lg lg:border lg:border-line lg:p-4 lg:shadow-none">
            {oltre > 0 && (
              <p role="status" className="mb-3 rounded-md bg-warning-soft px-3 py-2 text-label text-warning">
                Supera la capienza di {oltre} {oltre === 1 ? "posto" : "posti"}
              </p>
            )}
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-caption text-ink-muted">
                  <span data-testid="form-persone" className="tabular-nums">{persone(q)}</span> {persone(q) === 1 ? "persona" : "persone"}
                  {" · "}Teatro <span data-testid="form-teatro" className="tabular-nums">{formattaEuro(teatro)}</span>
                  {" · "}Ristorante <span data-testid="form-ristorante" className="tabular-nums">{formattaEuro(ristorante)}</span>
                </div>
                <div className="text-figure-sm tabular-nums">
                  <span className="sr-only">Totale </span><span data-testid="form-totale">{formattaEuro(teatro + ristorante)}</span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <button type="submit" disabled={occupato || bloccata} className={`${btnPrimario} min-w-28`}>
                  {occupato ? "Invio…" : "Salva"}
                </button>
                {bloccata && <p className="mt-1 text-caption text-ink-muted">Serve la rete</p>}
              </div>
            </div>
          </section>

          <Link href={`/eventi/${eventoId}`} className={btnSecondario}>Annulla</Link>

          {iniziale && (
            <div className="mt-8 border-t border-line pt-6">
              <button type="button" onClick={elimina} disabled={occupato || bloccata} className={btnDistruttivo}>
                <Trash2 size={20} aria-hidden />Elimina
              </button>
              {bloccata && <p className="mt-1 text-caption text-ink-muted">Serve la rete</p>}
            </div>
          )}
        </form>
      </div>
    </main>
  );
}

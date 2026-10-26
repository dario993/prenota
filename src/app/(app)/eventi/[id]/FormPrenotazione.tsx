"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { onlineManager, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, ChevronLeft, Trash2 } from "lucide-react";
import type { z } from "zod";
import { Contatore } from "@/components/Contatore";
import { Stato } from "@/components/Stato";
import {
  btnDistruttivo, btnPrimario, btnSecondario, campo, erroreCampo, etichetta, legendaPannello, linkIndietro, scelta, scheda, segmenti, titoloPannello,
} from "@/components/stili";
import { BarraTelefono } from "@/components/BarraTelefono";
import { DataBiglietto } from "@/components/DataBiglietto";
import { BarraCapienza } from "@/components/BarraCapienza";
import { chiaveEvento, getJson, useInAttesa, useOnline, CHIAVE_NUOVA, SERVE_RETE } from "@/lib/query";
import { schemaPrenotazione, type DatiPrenotazione } from "@/lib/schemi";
import {
  persone, prezziPacchettoDi, incassoTeatro, incassoRistorante, riepilogoEvento, righeConPrezzi, tariffeDelModulo,
  formattaEuro, partiData, RISTORANTI, PASTI, PAGAMENTI, NOMI_CONTRASSEGNI, NOMI_PAGAMENTI, NOMI_RISTORANTI, NOMI_PASTI,
  type DettaglioEvento, type Prenotazione,
} from "@/lib/calcoli";
import { modificaPrenotazione, eliminaPrenotazione } from "./azioni";
import { Cronologia } from "./Cronologia";

type Campi = z.input<typeof schemaPrenotazione>;
const textarea = campo.replace("h-12", "min-h-24 py-3").replace("lg:h-11", "");

const Errore = ({ id, msg }: { id: string; msg?: string }) =>
  msg ? <span id={`errore-${id}`} role="alert" className={erroreCampo}>{msg}</span> : null;

// Riletto all'apertura (prezzi attuali, persone per l'avviso di capienza); in modifica lo fa già ModificaPrenotazione.
const useEvento = (id: string, rileggi = true) =>
  useQuery({ queryKey: chiaveEvento(id), queryFn: () => getJson<DettaglioEvento>(`/api/eventi/${id}`),
    refetchOnMount: rileggi ? "always" : true });

// Pagina di modifica: cerca la prenotazione nel dettaglio evento. Si aspetta la prima rilettura dal server: il modulo
// nasce dai dati iniziali e, partendo da una copia vecchia, salvando cancellerebbe le righe aggiunte nel frattempo
// (senza rete la modifica è comunque bloccata, quindi la copia in cache basta solo per mostrarla). Le riletture
// successive (ritorno sull'app, rete che torna) non smontano il modulo: si perderebbe quanto scritto.
export function ModificaPrenotazione({ eventoId, pid, solaLettura = false }: { eventoId: string; pid: string; solaLettura?: boolean }) {
  const { data, isFetching, isFetchedAfterMount, error, fetchStatus } = useEvento(eventoId);
  const p = data?.prenotazioni.find((x) => x.id === pid);
  if (p && (isFetchedAfterMount || fetchStatus === "paused")) return <FormPrenotazione eventoId={eventoId} iniziale={p} solaLettura={solaLettura} />;
  if (!data && fetchStatus === "paused") return <Stato testo={SERVE_RETE} />;
  if (isFetching) return <Stato testo="Caricamento…" />;
  return <Stato testo={error?.message ?? "Prenotazione non trovata"} nonTrovato />;
}

export function FormPrenotazione({ eventoId, iniziale, solaLettura = false }: { eventoId: string; iniziale?: Prenotazione; solaLettura?: boolean }) {
  const { data, isPending, error, fetchStatus } = useEvento(eventoId, !iniziale);
  if (!data) {
    if (fetchStatus === "paused") return <Stato testo={SERVE_RETE} />;
    if (isPending) return <Stato testo="Caricamento…" />;
    return <Stato testo={error?.message ?? "Errore imprevisto, riprova"} nonTrovato />;
  }
  return <Modulo eventoId={eventoId} iniziale={iniziale} data={data} solaLettura={solaLettura} />;
}

// Il form nasce quando il tariffario è noto: un contatore per tariffa (visibili + nascoste già usate in modifica).
// solaLettura (visualizzatore): campi disattivati, niente Salva né Elimina
function Modulo({ eventoId, iniziale, data, solaLettura }: { eventoId: string; iniziale?: Prenotazione; data: DettaglioEvento; solaLettura: boolean }) {
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
        pagamento: iniziale?.pagamento ?? null,
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

  const d = partiData(new Date(evento.data_ora));
  const pers = persone(q);
  const dettaglio = [
    ...righe.map((r) => ({ k: r.tariffa_id, testo: `${r.quantita} × ${tariffe.find((t) => t.id === r.tariffa_id)?.nome ?? ""}`, euro: r.quantita * r.prezzo })),
    ...(q.pacchetti ? [{ k: "pacchetti", euro: teatro + ristorante - righe.reduce((s, r) => s + r.quantita * r.prezzo, 0),
      testo: `${q.pacchetti} × Pacchetti${valori.ristorante && valori.pasto ? ` ${NOMI_RISTORANTI[valori.ristorante]} ${NOMI_PASTI[valori.pasto].toLowerCase()}` : ""}` }] : []),
  ];
  const liberiDopo = evento.capienza - altre.persone - pers;
  const salvaTesto = occupato ? "Invio…" : iniziale ? "Salva modifiche" : "Salva prenotazione";
  const pannello = `${scheda} min-w-0`;

  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-6 lg:px-6">
      {/* telefono: evento sempre visibile in alto mentre si scorre il modulo, con Annulla */}
      <BarraTelefono titolo={`${evento.titolo} · ${d.settimana} ${d.giorno} ${d.mese}`}>
        <Link href={`/eventi/${eventoId}`} className={`${btnSecondario} !h-10 !px-3 !text-label`}>{solaLettura ? "Chiudi" : "Annulla"}</Link>
      </BarraTelefono>
      <Link href={`/eventi/${eventoId}`} className={linkIndietro}>
        <ChevronLeft size={16} aria-hidden />{evento.titolo} · {d.lunga}
      </Link>
      <h1 className="text-title">{solaLettura ? "Prenotazione" : iniziale ? "Modifica prenotazione" : "Nuova prenotazione"}</h1>
      <p className="mt-1 text-[15px] leading-[22px] text-ink-muted">
        {iniziale
          ? <>Stato <span className="font-medium text-ink">{iniziale.contrassegno ? NOMI_CONTRASSEGNI[iniziale.contrassegno] : "nessuno"}</span></>
          : altre.postiLiberi >= 0
            ? <>Restano <span className="font-medium text-ink tabular-nums">{altre.postiLiberi}</span> posti su {evento.capienza} per {d.lunga}.</>
            : <>Capienza già superata di <span className="font-medium text-warning tabular-nums">{-altre.postiLiberi}</span> posti.</>}
      </p>
      <form id="modulo-prenotazione" onSubmit={(e) => void handleSubmit(salva)(e)} noValidate
        className="mt-6 grid items-start gap-6 pb-40 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:pb-0">
        <fieldset disabled={solaLettura} className="grid min-w-0 gap-6">
          <section aria-labelledby="t-cliente" className={pannello}>
            <h2 id="t-cliente" className={`${titoloPannello} mb-4`}>Cliente</h2>
            <div className="grid items-start gap-4 sm:grid-cols-2">
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
            </div>
          </section>
          <fieldset aria-invalid={!!erroreQuantita} aria-describedby={erroreQuantita ? "errore-righe" : undefined} className={pannello}>
            <legend className={legendaPannello}>
              <span className="flex items-baseline justify-between gap-3">Biglietti
                <span className="text-label font-normal text-ink-muted tabular-nums">{pers} {pers === 1 ? "persona" : "persone"}</span></span>
            </legend>
            <div>
              {tariffe.map((t, i) => {
                const n = Number(valori.righe?.[i]?.quantita) || 0;
                return (
                  <Contatore key={t.id} etichetta={t.nome} valore={n}
                    prezzo={prezzoDi(t.id) ? formattaEuro(prezzoDi(t.id)) : "gratuito"} subtotale={n ? formattaEuro(n * prezzoDi(t.id)) : "–"}
                    onChange={(v) => setValue(`righe.${i}.quantita`, v, { shouldValidate: isSubmitted })} />
                );
              })}
              {conPacchetto && (
                <Contatore etichetta="Pacchetti" valore={q.pacchetti}
                  prezzo={`${formattaEuro(prezzi.prezzo_pacchetto_teatro + prezzi.prezzo_pacchetto_ristorante)} · teatro ${formattaEuro(prezzi.prezzo_pacchetto_teatro)} + ristorante ${formattaEuro(prezzi.prezzo_pacchetto_ristorante)}`}
                  subtotale={q.pacchetti ? formattaEuro(q.pacchetti * (prezzi.prezzo_pacchetto_teatro + prezzi.prezzo_pacchetto_ristorante)) : "–"}
                  onChange={(n) => setValue("pacchetti", n, { shouldValidate: isSubmitted })} />
              )}
              <Errore id="righe" msg={erroreQuantita} />
              {q.pacchetti > 0 && (
                <div className="mt-2 border-t border-line pt-4">
                  <h3 className="mb-2.5 text-label font-semibold">Ristorante del pacchetto</h3>
                  <div className="grid items-start gap-3 sm:grid-cols-2">
                    <div>
                      <div role="radiogroup" aria-label="Ristorante" {...aria("ristorante")} className={segmenti}>
                        {RISTORANTI.map((r) => (
                          <label key={r} className={scelta}>
                            <input type="radio" value={r} className="sr-only" {...register("ristorante")} />{NOMI_RISTORANTI[r]}
                          </label>
                        ))}
                      </div>
                      <Errore id="ristorante" msg={errors.ristorante?.message} />
                    </div>
                    <div>
                      <div role="radiogroup" aria-label="Pasto" {...aria("pasto")} className={segmenti}>
                        {PASTI.map((p) => (
                          <label key={p} className={scelta}>
                            <input type="radio" value={p} className="sr-only" {...register("pasto")} />{NOMI_PASTI[p]}
                          </label>
                        ))}
                      </div>
                      <Errore id="pasto" msg={errors.pasto?.message} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </fieldset>
          <section aria-labelledby="t-altro" className={pannello}>
            <h2 id="t-altro" className={`${titoloPannello} mb-4`}>Posti e note</h2>
            <div className="grid items-start gap-4 sm:grid-cols-2">
              <label className={etichetta}>
                Posti prenotati
                <input autoComplete="off" placeholder="es. K1-4, L5" className={campo} {...register("posti")} {...aria("posti")} />
                <Errore id="posti" msg={errors.posti?.message} />
              </label>
              <label className={etichetta}>
                Provenienza
                <input list="provenienze" autoComplete="off" className={campo} {...register("provenienza")} {...aria("provenienza")} />
                <datalist id="provenienze">{provenienze?.map((p) => <option key={p} value={p} />)}</datalist>
                <Errore id="provenienza" msg={errors.provenienza?.message} />
              </label>
            </div>
            <label className={`${etichetta} mt-4`}>
              Note
              <textarea rows={2} className={textarea} {...register("note")} {...aria("note")} />
              <Errore id="note" msg={errors.note?.message} />
            </label>
            {/* solo nel dettaglio: a segmenti come Ristorante e Pasto, ma si può togliere (nessuna scelta) */}
            {iniziale && (
              <fieldset className="mt-4 border-t border-line pt-4">
                <legend className="float-left mb-2.5 w-full text-label font-semibold">Pagamento</legend>
                <div className={`${segmenti} clear-left sm:w-[calc(50%-8px)]`}>
                  {PAGAMENTI.map((v) => (
                    <label key={v} className={`${scelta} gap-1.5`}>
                      <input type="checkbox" className="sr-only" checked={valori.pagamento === v}
                        onChange={(e) => setValue("pagamento", e.target.checked ? v : null)} />
                      {valori.pagamento === v && <Check size={16} aria-hidden className="text-accent" />}
                      {NOMI_PAGAMENTI[v]}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
          </section>
          {iniziale && <Cronologia pid={iniziale.id} tariffe={evento.tariffe} />}
          {iniziale && !solaLettura && (
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={elimina} disabled={occupato || bloccata} className={btnDistruttivo}>
                <Trash2 size={16} aria-hidden />Elimina prenotazione
              </button>
              <span className="text-caption text-ink-muted">{bloccata ? "Serve la rete" : "Chiede conferma prima di eliminare."}</span>
            </div>
          )}
        </fieldset>

        {/* il riepilogo come un biglietto: resta fermo mentre si scorre (desktop largo) */}
        <aside aria-labelledby="t-riepilogo" className={`${pannello} xl:sticky xl:top-4`}>
          <div className="flex items-center gap-3.5 pb-4">
            <DataBiglietto dataOra={evento.data_ora} piena />
            <div className="min-w-0">
              <h2 id="t-riepilogo" className={titoloPannello}>{evento.titolo}</h2>
              <p className="text-label font-normal text-ink-muted first-letter:uppercase">{d.lunga}, {d.ora}<br />{evento.locale}</p>
            </div>
          </div>
          <p className="border-t border-dashed border-line-control pb-1.5 pt-3.5 text-[18px] font-semibold">
            {valori.cognome_nome?.trim() || <span className="font-normal text-ink-muted">Cognome Nome</span>}
          </p>
          <dl className="text-label font-normal">
            {dettaglio.length === 0 && <div className="border-t border-line py-1.5 text-ink-muted">Nessun biglietto</div>}
            {dettaglio.map((v) => (
              <div key={v.k} className="flex justify-between gap-3 border-t border-line py-1.5">
                <dt>{v.testo}</dt><dd className="font-medium tabular-nums">{formattaEuro(v.euro)}</dd>
              </div>
            ))}
            {dettaglio.length > 0 && <>
              <div className="flex justify-between gap-3 border-t border-line py-1.5 pl-3 text-ink-muted">
                <dt>Teatro</dt><dd className="tabular-nums" data-testid="form-teatro">{formattaEuro(teatro)}</dd>
              </div>
              <div className="flex justify-between gap-3 border-t border-line py-1.5 pl-3 text-ink-muted">
                <dt>Ristorante</dt><dd className="tabular-nums" data-testid="form-ristorante">{formattaEuro(ristorante)}</dd>
              </div>
            </>}
          </dl>
          <div className="mt-1 flex items-baseline justify-between border-t border-line pb-1 pt-3">
            <span className="font-semibold">Totale <span className="font-normal text-ink-muted">· <span data-testid="form-persone" className="tabular-nums">{pers}</span> {pers === 1 ? "persona" : "persone"}</span></span>
            <span className="text-[30px] font-medium leading-[34px] tracking-tight tabular-nums" data-testid="form-totale">{formattaEuro(teatro + ristorante)}</span>
          </div>
          <div className="mt-4 border-t border-line pt-4">
            <div className="mb-2.5 flex items-baseline justify-between gap-3">
              <h3 className="text-label font-semibold">Capienza</h3>
              <span className="text-label font-normal text-ink-muted tabular-nums">{liberiDopo >= 0 ? `${liberiDopo} liberi dopo questa` : ""}</span>
            </div>
            <BarraCapienza persone={altre.persone + pers} capienza={evento.capienza} />
            <p className="mt-2 text-[13px] text-ink-muted">
              Già prenotati <span className="font-semibold text-ink tabular-nums">{altre.persone}</span> · questa prenotazione{" "}
              <span className="font-semibold text-ink tabular-nums">{pers}</span> · su <span className="tabular-nums">{evento.capienza}</span>
            </p>
            {oltre > 0 && (
              <p role="status" className="mt-2.5 rounded-md bg-warning-soft px-3 py-2 text-label text-warning">
                Supera la capienza di {oltre} {oltre === 1 ? "posto" : "posti"}: si può salvare lo stesso.
              </p>
            )}
          </div>
          {!solaLettura && <div className="mt-5 grid grid-cols-[1fr_auto] gap-2 max-lg:hidden">
            <button type="submit" disabled={occupato || bloccata} className={`${btnPrimario} lg:h-11 lg:text-[15px]`}>{salvaTesto}</button>
            <Link href={`/eventi/${eventoId}`} className={`${btnSecondario} lg:h-11 lg:text-[15px]`}>Annulla</Link>
          </div>}
          {bloccata && <p className="mt-1 text-caption text-ink-muted max-lg:hidden">Serve la rete per salvare le modifiche</p>}
        </aside>

        {/* telefono: barra fissa sopra la navigazione con persone, totale e Salva */}
        <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-10 flex items-center justify-between gap-3 border-t border-line bg-surface px-4 py-2.5 lg:hidden">
          <div className="min-w-0">
            <div className="text-caption text-ink-muted tabular-nums">{pers} {pers === 1 ? "persona" : "persone"}{bloccata && " · serve la rete"}</div>
            <div className="text-[22px] font-semibold leading-[26px] tabular-nums">{formattaEuro(teatro + ristorante)}</div>
          </div>
          {!solaLettura && <button type="submit" disabled={occupato || bloccata} className={`${btnPrimario} min-w-30`}>{occupato ? "Invio…" : "Salva"}</button>}
        </div>
      </form>
    </main>
  );
}

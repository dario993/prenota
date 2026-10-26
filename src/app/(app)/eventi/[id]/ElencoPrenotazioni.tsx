"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ArrowUpDown, GripVertical, Plus, Search } from "lucide-react";
import { StatoInAttesa } from "@/components/InAttesa";
import { btnPrimario, btnSecondario, pallinoContrassegno } from "@/components/stili";
import { chiaveEvento, useOnline, type InAttesa } from "@/lib/query";
import type { Esito } from "@/lib/esito";
import {
  CONTRASSEGNI, NOMI_CONTRASSEGNI, descriviBiglietti, indiceDestinazione, persone, spostaElemento,
  type Contrassegno, type DettaglioEvento, type Prenotazione, type Tariffa,
} from "@/lib/calcoli";
import { contrassegnaPrenotazione, riordinaPrenotazioni } from "./azioni";

const tel = (t: string) => `tel:${t.replace(/[^\d+]/g, "")}`;

// Le prenotazioni in coda sul telefono (in_attesa) hanno anche stato/errore e non si aprono.
type Voce = Prenotazione & Partial<Pick<InAttesa, "stato" | "errore" | "mutationId">>;

// biglietti in una colonna sola: le tariffe cambiano da un'opera all'altra (il ristorante è nel testo del pacchetto)
const COLONNE = [["N."], ["Nome"], ["Telefono"], ["Biglietti"], ["Posti"], ["Note"], ["Stato"], ["Persone", 1]] as const;

// tacca colorata a sinistra della riga, staccata dai bordi: le righe vicine non si toccano (anche in stampa); senza stato niente
const tacca = (p: Voce, sopra: string) => p.contrassegno &&
  <span aria-hidden className={`absolute left-0 ${sopra} w-1 rounded-full ${pallinoContrassegno[p.contrassegno]}`} />;

// trascinamento in corso: posizioni in coordinate di pagina (l'elenco può scorrere mentre si trascina)
type Trascina = { id: string; da: number; a: number; dy: number; alt: number; y0: number; centri: number[] };

export function ElencoPrenotazioni({ eventoId, prenotazioni, tariffe }: { eventoId: string; prenotazioni: Voce[]; tariffe: Tariffa[] }) {
  const router = useRouter();
  const qc = useQueryClient();
  const online = useOnline();
  const [cerca, setCerca] = useState("");
  const [riordina, setRiordina] = useState(false);
  const [tr, setTr] = useState<Trascina | null>(null);
  const q = cerca.trim().toLowerCase();
  // numero di riga sull'elenco intero (ordine del server, poi quelle in coda): resta lo stesso anche cercando
  const numero = new Map(prenotazioni.map((p, i) => [p.id, i + 1]));
  const lista = prenotazioni.filter((p) => p.cognome_nome.toLowerCase().includes(q) || p.telefono.includes(q));
  const sulServer = prenotazioni.filter((p) => !p.in_attesa);
  const frecce = riordina && !q;
  const href = (p: Prenotazione) => `/eventi/${eventoId}/prenotazioni/${p.id}`;
  // senza rete la modifica non è possibile: non si apre nemmeno la pagina
  const apri = (e: React.MouseEvent) => {
    if (online) return true;
    e.preventDefault();
    toast.info("Serve la rete per modificare una prenotazione");
    return false;
  };
  // aggiorna subito l'elenco in cache, poi salva e ricarica dal server
  const salva = async (nuove: Prenotazione[], azione: () => Promise<Esito>) => {
    if (!online) return void toast.info("Serve la rete per modificare una prenotazione");
    qc.setQueryData<DettaglioEvento>(chiaveEvento(eventoId), (d) => d && { ...d, prenotazioni: nuove });
    const r = await azione().catch(() => ({ errore: "Rete non disponibile" }));
    if ("errore" in r) toast.error(r.errore);
    void qc.invalidateQueries({ queryKey: chiaveEvento(eventoId) });
  };
  const sposta = (da: number, a: number) => {
    if (a < 0 || a >= sulServer.length || a === da) return;
    const nuove = spostaElemento(sulServer, da, a);
    void salva(nuove, () => riordinaPrenotazioni(eventoId, nuove.map((x) => x.id)));
  };
  // maniglia: dito o mouse (Pointer Events); le altre righe si scostano per fare posto a quella trascinata
  const afferra = (e: React.PointerEvent<HTMLElement>, da: number) => {
    const righe = [...e.currentTarget.closest("[data-elenco]")!.querySelectorAll("[data-riga]")].map((r) => r.getBoundingClientRect());
    const spazio = righe.length > 1 ? righe[1].top - righe[0].bottom : 0;
    e.currentTarget.setPointerCapture(e.pointerId);
    setTr({ id: sulServer[da].id, da, a: da, dy: 0, alt: righe[da].height + spazio, y0: e.clientY + scrollY,
      centri: righe.map((r) => r.top + scrollY + r.height / 2) });
  };
  const trascina = (e: React.PointerEvent) => {
    if (!tr) return;
    // vicino ai bordi lo schermo scorre (in basso c'è la barra di navigazione del telefono)
    if (e.clientY < 80) scrollBy(0, -12);
    else if (e.clientY > innerHeight - 120) scrollBy(0, 12);
    const dy = e.clientY + scrollY - tr.y0;
    setTr({ ...tr, dy, a: indiceDestinazione(tr.centri, tr.da, tr.centri[tr.da] + dy) });
  };
  const lascia = () => {
    if (tr) sposta(tr.da, tr.a);
    setTr(null);
  };
  const scostamento = (p: Voce): React.CSSProperties | undefined => {
    if (!tr) return;
    if (p.id === tr.id) return { transform: `translateY(${tr.dy}px)`, position: "relative", zIndex: 10 };
    const i = sulServer.findIndex((x) => x.id === p.id);
    const y = tr.da < tr.a && i > tr.da && i <= tr.a ? -tr.alt : tr.a < tr.da && i >= tr.a && i < tr.da ? tr.alt : 0;
    return { transform: `translateY(${y}px)`, transition: "transform 150ms" };
  };
  const trascinata = (p: Voce) => (tr?.id === p.id ? "shadow-overlay" : "");
  const contrassegna = (p: Voce, c: Contrassegno | null) =>
    void salva(sulServer.map((x) => (x.id === p.id ? { ...x, contrassegno: c } : x)), () => contrassegnaPrenotazione(p.id, c));

  const statoDi = (p: Voce) => p.stato && p.mutationId !== undefined &&
    <StatoInAttesa p={{ stato: p.stato, errore: p.errore, mutationId: p.mutationId, cognome_nome: p.cognome_nome }} />;
  // pallino del colore dello stato + scelta compatta: il bordo compare al passaggio del mouse (sempre su telefono)
  const sceltaContrassegno = (p: Voce) => !p.in_attesa && (
    <span className="relative inline-flex items-center print:hidden">
      <span aria-hidden className={`pointer-events-none absolute left-2.5 size-2.5 rounded-full ${p.contrassegno ? pallinoContrassegno[p.contrassegno] : "bg-line-control/50"}`} />
      <select value={p.contrassegno ?? ""} onChange={(e) => contrassegna(p, (e.target.value || null) as Contrassegno | null)}
        aria-label={`Stato di ${p.cognome_nome}`}
        className={`h-10 rounded-md border border-line-control bg-surface pl-7 pr-2 text-label font-normal lg:-my-1.5 lg:h-9 lg:border-transparent lg:hover:border-line-control ${p.contrassegno ? "text-ink" : "text-ink-muted"}`}>
        <option value="">Nessuno stato</option>
        {CONTRASSEGNI.map((c) => <option key={c} value={c}>{NOMI_CONTRASSEGNI[c]}</option>)}
      </select>
    </span>
  );
  // maniglia in testa, subito dopo il numero
  const maniglia = (p: Voce) => {
    const i = sulServer.findIndex((x) => x.id === p.id);
    return frecce && i >= 0 && (
      <button type="button" onPointerDown={(e) => afferra(e, i)} onPointerMove={trascina} onPointerUp={lascia} onPointerCancel={() => setTr(null)}
        aria-label={`Trascina per spostare ${p.cognome_nome}`} title="Trascina per spostare"
        className="inline-flex size-9 shrink-0 cursor-grab touch-none select-none items-center justify-center rounded-md text-ink-muted active:cursor-grabbing print:hidden"><GripVertical size={22} aria-hidden /></button>
    );
  };
  const pulsantiSposta = (p: Voce) => {
    const i = sulServer.findIndex((x) => x.id === p.id);
    return frecce && i >= 0 && (
      <span className="inline-flex gap-1 print:hidden">
        <button type="button" onClick={() => sposta(i, i - 1)} disabled={i === 0} aria-label={`Sposta su ${p.cognome_nome}`}
          className="inline-flex size-10 items-center justify-center rounded-md border border-line-control disabled:opacity-30"><ArrowUp size={18} aria-hidden /></button>
        <button type="button" onClick={() => sposta(i, i + 1)} disabled={i === sulServer.length - 1} aria-label={`Sposta giù ${p.cognome_nome}`}
          className="inline-flex size-10 items-center justify-center rounded-md border border-line-control disabled:opacity-30"><ArrowDown size={18} aria-hidden /></button>
      </span>
    );
  };
  const contenutoScheda = (p: Voce) => (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 space-y-0.5">
        <div className="flex items-center font-semibold">
          <span className="mr-2.5 w-6 shrink-0 font-normal tabular-nums text-ink-muted">{numero.get(p.id)}</span>{maniglia(p)}
          <span className={`min-w-0 ${p.contrassegno === "annullato" ? "text-ink-muted line-through" : ""}`}>{p.cognome_nome}</span>
        </div>
        <div className="space-y-0.5 pl-8.5 text-caption">
          {p.telefono && <div className="tabular-nums">{p.telefono}</div>}
          <div>{descriviBiglietti(p, tariffe)}</div>
          {p.posti && <div><span className="text-ink-muted">Posti </span>{p.posti}</div>}
          {p.note && <div className="text-ink-muted">{p.note}</div>}
          {statoDi(p)}
        </div>
      </div>
      <div className="text-[17px] font-semibold tabular-nums">{persone(p)}</div>
    </div>
  );
  const attive = prenotazioni.filter((p) => p.contrassegno !== "annullato" && p.stato !== "error");
  return (
    <section aria-labelledby="t-prenotazioni">
      {/* come nella proposta: titolo a scheda sottolineata; sotto ricerca e Riordina, il conto a destra */}
      <div className="border-b border-line print:hidden">
        <h2 id="t-prenotazioni" className="-mb-px inline-block border-b-2 border-ink py-2.5 text-label font-semibold">
          Prenotazioni<span className="ml-1.5 font-normal text-ink-muted tabular-nums">{prenotazioni.length}</span>
        </h2>
      </div>
      <div className="mb-2 mt-5 flex flex-wrap items-center gap-2 print:hidden">
        <div className="relative w-full lg:w-[300px]">
          <Search size={16} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input type="search" value={cerca} onChange={(e) => setCerca(e.target.value)} placeholder="Cerca per nome o telefono" aria-label="Cerca per nome o telefono"
            className="h-12 w-full rounded-md border border-line-control bg-surface pl-9 pr-3 text-body text-ink placeholder:text-ink-muted lg:h-9 lg:text-label lg:font-normal" />
        </div>
        {sulServer.length > 1 && (
          <button type="button" aria-pressed={riordina} onClick={() => setRiordina(!riordina)}
            className={`${btnSecondario} ${riordina ? "border-accent bg-accent-soft" : ""}`}>
            <ArrowUpDown size={16} aria-hidden />{riordina ? "Fine" : "Riordina"}
          </button>
        )}
        <span className="text-label font-normal text-ink-muted tabular-nums lg:ml-auto">
          {attive.reduce((s, p) => s + persone(p), 0)} persone in {attive.length} {attive.length === 1 ? "prenotazione" : "prenotazioni"}
        </span>
      </div>
      {riordina && q && <p className="mb-4 text-caption text-ink-muted print:hidden">Svuota la ricerca per spostare le prenotazioni.</p>}
      {lista.length === 0 && (
        <div className="py-8 text-center text-ink-muted">
          {prenotazioni.length ? <p>Nessun risultato per «{cerca.trim()}»</p> : (
            <>
              <p>Nessuna prenotazione</p>
              <Link href={`/eventi/${eventoId}/prenotazioni/nuova`} className={`${btnPrimario} mt-4`}><Plus size={20} aria-hidden />Nuova prenotazione</Link>
            </>
          )}
        </div>
      )}
      <ul data-elenco className="lg:hidden print:!hidden">
        {lista.map((p) => (
          <li key={p.id} data-riga={p.in_attesa ? undefined : p.id} style={scostamento(p)}
            className={`relative border-b border-line bg-surface pl-3.5 ${trascinata(p)}`}>
            {tacca(p, "inset-y-3.5")}
            {p.in_attesa ? (
              <div className="py-3">{contenutoScheda(p)}</div>
            ) : (
              <>
                {/* riordinando la scheda non si apre: la maniglia sta dentro e un tocco non deve portare altrove */}
                {frecce ? <div className="pb-2 pt-3">{contenutoScheda(p)}</div>
                  : <Link href={href(p)} onClick={apri} className="block pb-2 pt-3">{contenutoScheda(p)}</Link>}
                <div className="flex items-center justify-between gap-2 pb-3 pl-8.5">{sceltaContrassegno(p)}{pulsantiSposta(p)}</div>
              </>
            )}
          </li>
        ))}
      </ul>
      {lista.length > 0 && (
        <div className="hidden overflow-x-auto lg:block print:!block print:overflow-visible"><table className="w-full text-[15px] leading-[22px] print:text-label">
          <thead className="text-left text-[13px] text-ink-muted">
            <tr>{COLONNE.map(([c, numerico]) => (
              <th key={c} scope="col" className={`px-3 py-2 font-normal print:px-2 print:py-1 ${numerico ? "text-right" : ""}`}>{c}</th>))}
              {frecce && <th scope="col" className="px-3 py-3 font-medium print:hidden"><span className="sr-only">Sposta</span></th>}
            </tr>
          </thead>
          <tbody data-elenco>
            {lista.map((p) => (
              <tr key={p.id} data-riga={p.in_attesa ? undefined : p.id} style={scostamento(p)} onClick={(e) => {
                if (p.in_attesa || (e.target as HTMLElement).closest("a, button, select") || !apri(e)) return;
                router.push(href(p));
              }} className={`border-t border-line bg-surface align-top transition-colors duration-150 print:break-inside-avoid [&>td]:print:px-2 [&>td]:print:py-1 ${trascinata(p)} ${p.in_attesa ? "" : "cursor-pointer hover:bg-surface-sunken/60"} ${p.contrassegno === "annullato" ? "text-ink-muted" : ""}`}>
                <td className="relative py-3 pl-4 pr-3 tabular-nums text-ink-muted">
                  {tacca(p, "inset-y-3")}
                  <div className="flex items-center justify-end gap-1">{numero.get(p.id)}{maniglia(p)}</div>
                </td>
                <td className={`px-3 py-3 font-semibold ${p.contrassegno === "annullato" ? "[&_a]:line-through" : ""}`}>
                  {p.in_attesa ? <div className="space-y-1">{p.cognome_nome}<div>{statoDi(p)}</div></div>
                    : <Link href={href(p)} onClick={apri} className="hover:underline">{p.cognome_nome}</Link>}
                </td>
                <td className="whitespace-nowrap px-3 py-3">{p.telefono && <a href={tel(p.telefono)} className="tabular-nums underline decoration-line-control underline-offset-4 hover:decoration-current print:no-underline">{p.telefono}</a>}</td>
                <td className="px-3 py-3 tabular-nums">{descriviBiglietti(p, tariffe)}</td>
                <td className="whitespace-nowrap px-3 py-3 tabular-nums">{p.posti}</td>
                <td className="max-w-48 break-words px-3 py-3 text-ink-muted">{p.note}</td>
                <td className="px-3 py-2">{sceltaContrassegno(p)}<span className="hidden print:inline">{p.contrassegno && NOMI_CONTRASSEGNI[p.contrassegno]}</span></td>
                <td className="px-3 py-3 text-right text-[17px] font-semibold tabular-nums">{persone(p)}</td>
                {frecce && <td className="px-3 py-2 print:hidden">{pulsantiSposta(p)}</td>}
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
    </section>
  );
}

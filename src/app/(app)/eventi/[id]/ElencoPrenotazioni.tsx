"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ArrowUpDown, GripVertical, Plus, Printer, Search } from "lucide-react";
import { StatoInAttesa } from "@/components/InAttesa";
import { barraContrassegno, btnPrimario, btnSecondario } from "@/components/stili";
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
const COLONNE = [["N."], ["Nome"], ["Telefono"], ["Biglietti"], ["Posti"], ["Note"], ["Stato"], ["Totale", 1]] as const;

// colore sul bordo sinistro della scheda o della riga (anche in stampa); senza stato resta neutro
const barra = (p: Voce) => (p.contrassegno ? barraContrassegno[p.contrassegno] : "");

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
  const sceltaContrassegno = (p: Voce) => !p.in_attesa && (
    <select value={p.contrassegno ?? ""} onChange={(e) => contrassegna(p, (e.target.value || null) as Contrassegno | null)}
      aria-label={`Stato di ${p.cognome_nome}`} className="h-10 rounded-md border border-line-control bg-surface px-2 text-label text-ink print:hidden">
      <option value="">Nessuno stato</option>
      {CONTRASSEGNI.map((c) => <option key={c} value={c}>{NOMI_CONTRASSEGNI[c]}</option>)}
    </select>
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
      <div className="min-w-0 space-y-1">
        <div className="flex items-center font-semibold">
          <span className="mr-2 tabular-nums text-ink-muted">{numero.get(p.id)}</span>{maniglia(p)}<span className="min-w-0">{p.cognome_nome}</span>
        </div>
        {p.telefono && <div className="text-caption text-ink-muted">{p.telefono}</div>}
        <div className="text-label">{descriviBiglietti(p, tariffe)}</div>
        {p.posti && <div className="font-mono text-label text-ink-muted">{p.posti}</div>}
        {p.note && <div className="text-caption text-ink-muted">{p.note}</div>}
        {statoDi(p)}
      </div>
      <div className="text-figure-sm tabular-nums">{persone(p)}</div>
    </div>
  );
  return (
    <section aria-label="Prenotazioni">
      <div className="mb-4 flex flex-wrap gap-2 print:hidden">
        <div className="relative min-w-60 flex-1">
          <Search size={20} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input type="search" value={cerca} onChange={(e) => setCerca(e.target.value)} placeholder="Cerca per nome o telefono" aria-label="Cerca per nome o telefono"
            className="h-12 w-full rounded-md bg-surface-sunken pl-10 pr-3 text-body text-ink placeholder:text-ink-muted" />
        </div>
        {sulServer.length > 1 && (
          <button type="button" aria-pressed={riordina} onClick={() => setRiordina(!riordina)}
            className={`${btnSecondario} ${riordina ? "border-accent bg-accent-soft" : ""}`}>
            <ArrowUpDown size={20} aria-hidden />{riordina ? "Fine" : "Riordina"}
          </button>
        )}
        {prenotazioni.length > 0 && (
          <button type="button" className={btnSecondario} onClick={() => window.print()}>
            <Printer size={20} aria-hidden />Stampa / PDF
          </button>
        )}
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
      <ul data-elenco className="grid gap-2 lg:hidden print:!hidden">
        {lista.map((p) => (
          <li key={p.id} data-riga={p.in_attesa ? undefined : p.id} style={scostamento(p)}
            className={`rounded-lg border border-l-4 border-line bg-surface ${barra(p)} ${trascinata(p)}`}>
            {p.in_attesa ? (
              <div className="p-4">{contenutoScheda(p)}</div>
            ) : (
              <>
                {/* riordinando la scheda non si apre: la maniglia sta dentro e un tocco non deve portare altrove */}
                {frecce ? <div className="p-4 pb-2">{contenutoScheda(p)}</div>
                  : <Link href={href(p)} onClick={apri} className="block p-4 pb-2">{contenutoScheda(p)}</Link>}
                <div className="flex items-center justify-between gap-2 px-4 pb-3">{sceltaContrassegno(p)}{pulsantiSposta(p)}</div>
              </>
            )}
          </li>
        ))}
      </ul>
      {lista.length > 0 && (
        <div className="hidden overflow-x-auto rounded-lg border border-line bg-surface lg:block print:!block print:overflow-visible print:rounded-none"><table className="w-full text-body print:text-label">
          <thead className="bg-surface-sunken text-left text-label text-ink-muted">
            <tr>{COLONNE.map(([c, numerico]) => (
              <th key={c} scope="col" className={`px-3 py-3 font-medium print:px-2 print:py-1 ${numerico ? "text-right" : ""}`}>{c}</th>))}
              {frecce && <th scope="col" className="px-3 py-3 font-medium print:hidden"><span className="sr-only">Sposta</span></th>}
            </tr>
          </thead>
          <tbody data-elenco>
            {lista.map((p) => (
              <tr key={p.id} data-riga={p.in_attesa ? undefined : p.id} style={scostamento(p)} onClick={(e) => {
                if (p.in_attesa || (e.target as HTMLElement).closest("a, button, select") || !apri(e)) return;
                router.push(href(p));
              }} className={`border-t border-line bg-surface align-top print:break-inside-avoid [&>td]:print:px-2 [&>td]:print:py-1 ${trascinata(p)} ${p.in_attesa ? "" : "cursor-pointer hover:bg-surface-sunken"}`}>
                <td className={`border-l-4 px-3 py-3 tabular-nums text-ink-muted ${barra(p)}`}>
                  <div className="flex items-center justify-end gap-1">{numero.get(p.id)}{maniglia(p)}</div>
                </td>
                <td className="px-3 py-3 font-semibold">
                  {p.in_attesa ? <div className="space-y-1">{p.cognome_nome}<div>{statoDi(p)}</div></div>
                    : <Link href={href(p)} onClick={apri} className="hover:text-accent">{p.cognome_nome}</Link>}
                </td>
                <td className="whitespace-nowrap px-3 py-3">{p.telefono && <a href={tel(p.telefono)} className="text-accent hover:underline print:text-ink">{p.telefono}</a>}</td>
                <td className="px-3 py-3 tabular-nums">{descriviBiglietti(p, tariffe)}</td>
                <td className="px-3 py-3 font-mono text-label">{p.posti}</td>
                <td className="max-w-48 break-words px-3 py-3 text-ink-muted">{p.note}</td>
                <td className="px-3 py-2">{sceltaContrassegno(p)}<span className="hidden print:inline">{p.contrassegno && NOMI_CONTRASSEGNI[p.contrassegno]}</span></td>
                <td className="px-3 py-3 text-right font-semibold tabular-nums">{persone(p)}</td>
                {frecce && <td className="px-3 py-2 print:hidden">{pulsantiSposta(p)}</td>}
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
    </section>
  );
}

"use client";
import { Minus, Plus } from "lucide-react";

const MASSIMO = 10000; // come lo schema della prenotazione

// testo scritto → intero tra 0 e MASSIMO (vuoto o non numerico = 0)
const intero = (v: string) => Math.min(MASSIMO, Math.max(0, Math.trunc(Number(v)) || 0));

export function Contatore({ etichetta, prezzo, valore, onChange }: {
  etichetta: string; prezzo?: string; valore: number; onChange: (n: number) => void;
}) {
  const tasto = "flex size-12 shrink-0 items-center justify-center rounded-md border border-line-control bg-surface text-ink hover:bg-surface-sunken disabled:opacity-50";
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-body">{etichetta}</div>
        {prezzo && <div className="text-caption text-ink-muted">{prezzo}</div>}
      </div>
      <div className="flex items-center gap-2">
        <button type="button" className={tasto} aria-label={`Meno ${etichetta}`} disabled={valore <= 0} onClick={() => onChange(Math.max(0, valore - 1))}>
          <Minus size={20} aria-hidden />
        </button>
        {/* si può anche scrivere il numero (gruppi da 35, 60…): tutto selezionato al tocco per sostituirlo */}
        <input type="number" inputMode="numeric" min={0} max={MASSIMO} step={1} aria-label={etichetta}
          value={valore} onChange={(e) => onChange(intero(e.target.value))} onFocus={(e) => e.target.select()}
          className="h-12 w-16 rounded-md border border-line-control bg-surface text-center text-figure-sm tabular-nums text-ink [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
        <button type="button" className={tasto} aria-label={`Più ${etichetta}`} disabled={valore >= MASSIMO} onClick={() => onChange(Math.min(MASSIMO, valore + 1))}>
          <Plus size={20} aria-hidden />
        </button>
      </div>
    </div>
  );
}

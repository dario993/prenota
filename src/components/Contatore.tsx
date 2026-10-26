"use client";
import { Minus, Plus } from "lucide-react";

const MASSIMO = 10000; // come lo schema della prenotazione

// testo scritto → intero tra 0 e MASSIMO (vuoto o non numerico = 0)
const intero = (v: string) => Math.min(MASSIMO, Math.max(0, Math.trunc(Number(v)) || 0));

// Una riga: nome e prezzo a sinistra, − numero + al centro, `subtotale` a destra (da sm in su).
export function Contatore({ etichetta, prezzo, subtotale, valore, onChange }: {
  etichetta: string; prezzo?: string; subtotale?: string; valore: number; onChange: (n: number) => void;
}) {
  const tasto = "flex size-12 shrink-0 items-center justify-center rounded-md border border-line-control bg-surface text-ink transition-[background-color,transform] duration-150 hover:bg-surface-sunken active:scale-95 disabled:opacity-35 disabled:hover:bg-surface disabled:active:scale-100 lg:size-10";
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 border-t border-line py-2.5 sm:grid-cols-[minmax(0,1fr)_auto_88px]">
      <div className="min-w-0">
        <div className="text-[15px] font-medium leading-snug">{etichetta}</div>
        {prezzo && <div className="text-[13px] text-ink-muted tabular-nums">{prezzo}</div>}
      </div>
      <div className="flex items-center gap-1.5">
        <button type="button" className={tasto} aria-label={`Meno ${etichetta}`} disabled={valore <= 0} onClick={() => onChange(Math.max(0, valore - 1))}>
          <Minus size={16} aria-hidden />
        </button>
        {/* si può anche scrivere il numero (gruppi da 35, 60…): tutto selezionato al tocco per sostituirlo */}
        <input type="number" inputMode="numeric" min={0} max={MASSIMO} step={1} aria-label={etichetta}
          value={valore} onChange={(e) => onChange(intero(e.target.value))} onFocus={(e) => e.target.select()}
          className="h-12 w-15 rounded-md border border-line-control bg-surface text-center text-[18px] font-semibold tabular-nums text-ink [appearance:textfield] lg:h-10 lg:w-14 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
        <button type="button" className={tasto} aria-label={`Più ${etichetta}`} disabled={valore >= MASSIMO} onClick={() => onChange(Math.min(MASSIMO, valore + 1))}>
          <Plus size={16} aria-hidden />
        </button>
      </div>
      <span className="hidden text-right font-medium tabular-nums sm:block">{subtotale}</span>
    </div>
  );
}

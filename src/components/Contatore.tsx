"use client";
import { Minus, Plus } from "lucide-react";

const MASSIMO = 10000; // come lo schema della prenotazione

// testo scritto → intero tra 0 e MASSIMO (vuoto o non numerico = 0)
const intero = (v: string) => Math.min(MASSIMO, Math.max(0, Math.trunc(Number(v)) || 0));

export function Contatore({ etichetta, valore, onChange }: { etichetta: string; valore: number; onChange: (n: number) => void }) {
  const tasto = "flex size-11 items-center justify-center rounded-full border border-gray-300 text-accento disabled:text-gray-300";
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm">{etichetta}</span>
      <div className="flex items-center gap-3">
        <button type="button" className={tasto} aria-label={`Meno ${etichetta}`} disabled={valore <= 0} onClick={() => onChange(Math.max(0, valore - 1))}>
          <Minus size={20} aria-hidden />
        </button>
        {/* si può anche scrivere il numero (gruppi da 35, 60…): tutto selezionato al tocco per sostituirlo */}
        <input type="number" inputMode="numeric" min={0} max={MASSIMO} step={1} aria-label={etichetta}
          value={valore} onChange={(e) => onChange(intero(e.target.value))} onFocus={(e) => e.target.select()}
          className="h-11 w-16 rounded-lg border border-gray-300 bg-white text-center text-lg font-semibold tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
        <button type="button" className={tasto} aria-label={`Più ${etichetta}`} disabled={valore >= MASSIMO} onClick={() => onChange(Math.min(MASSIMO, valore + 1))}>
          <Plus size={20} aria-hidden />
        </button>
      </div>
    </div>
  );
}

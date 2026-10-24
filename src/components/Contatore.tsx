"use client";
import { Minus, Plus } from "lucide-react";

export function Contatore({ etichetta, valore, onChange }: { etichetta: string; valore: number; onChange: (n: number) => void }) {
  const tasto = "flex size-11 items-center justify-center rounded-full border border-gray-300 text-accento disabled:text-gray-300";
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm">{etichetta}</span>
      <div className="flex items-center gap-3">
        <button type="button" className={tasto} aria-label={`Meno ${etichetta}`} disabled={valore <= 0} onClick={() => onChange(Math.max(0, valore - 1))}>
          <Minus size={20} aria-hidden />
        </button>
        <output aria-label={etichetta} className="w-8 text-center text-lg font-semibold tabular-nums">{valore}</output>
        <button type="button" className={tasto} aria-label={`Più ${etichetta}`} onClick={() => onChange(valore + 1)}>
          <Plus size={20} aria-hidden />
        </button>
      </div>
    </div>
  );
}

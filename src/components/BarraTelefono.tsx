import Link from "next/link";
import { Marchio } from "./Marchio";

// Solo telefono: barra fissa in alto con marchio, titolo della pagina e al massimo un'azione (es. «Nuova»).
// Va messa come primo figlio di un <main> con px-4 py-6.
export function BarraTelefono({ titolo, children }: { titolo: string; children?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-20 -mx-4 -mt-6 mb-4 flex h-14 items-center gap-3 border-b border-line bg-surface px-4 lg:hidden print:hidden">
      <Link href="/" aria-label="Prenota, eventi"><Marchio /></Link>
      <span className="min-w-0 flex-1 truncate text-[17px] font-semibold">{titolo}</span>
      {children}
    </header>
  );
}

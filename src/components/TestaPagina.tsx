import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { linkIndietro } from "./stili";

// Testa di pagina: «‹ indietro» facoltativo, titolo, frase sotto e azioni a destra (su telefono vanno sotto).
export function TestaPagina({ titolo, sottotitolo, indietro, children }: {
  titolo: string; sottotitolo?: React.ReactNode; indietro?: { href: string; testo: string }; children?: React.ReactNode;
}) {
  return (
    <div>
      {indietro && (
        <Link href={indietro.href} className={linkIndietro}><ChevronLeft size={16} aria-hidden />{indietro.testo}</Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <h1 className="text-title">{titolo}</h1>
          {sottotitolo && <p className="mt-1 text-[15px] leading-[22px] text-ink-muted print:text-ink">{sottotitolo}</p>}
        </div>
        {children && <div className="flex flex-wrap items-center gap-2 print:hidden">{children}</div>}
      </div>
    </div>
  );
}

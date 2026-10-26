import Link from "next/link";
import { BarraTelefono } from "@/components/BarraTelefono";
import { TestaPagina } from "@/components/TestaPagina";
import { Building2, ChevronRight, Clapperboard, Ticket, Users } from "lucide-react";
import { richiediAdmin } from "@/lib/auth";
import { paginaAdmin } from "@/components/stili";
import { TemaToggle } from "@/components/TemaToggle";

const LINK = [
  ["/admin/locali", "Locali", "Luoghi e capienza", Building2],
  ["/admin/opere", "Opere", "Titoli e tariffario", Clapperboard],
  ["/admin/eventi", "Eventi (admin)", "Opera, locale, data e ora", Ticket],
  ["/admin/utenti", "Utenti", "Accessi, ruoli e API key", Users],
] as const;

export default async function Admin() {
  await richiediAdmin();
  return (
    <main className={paginaAdmin}>
      <BarraTelefono titolo="Admin" />
      <TestaPagina titolo="Admin" sottotitolo="Per un nuovo spettacolo: locale, poi opera, poi evento." />
      <ul className="grid gap-3 lg:grid-cols-2">
        {LINK.map(([href, testo, descrizione, Icona]) => (
          <li key={href}>
            <Link href={href} className="flex items-center gap-3.5 rounded-lg border border-line bg-surface p-5 transition-colors duration-150 hover:bg-surface-sunken/60">
              <Icona size={20} strokeWidth={1.75} aria-hidden className="shrink-0 text-ink-muted" />
              <span className="min-w-0 flex-1">
                <span className="block text-[17px] font-semibold leading-snug">{testo}</span>
                <span className="block text-caption text-ink-muted">{descrizione}</span>
              </span>
              <ChevronRight size={20} aria-hidden className="text-ink-muted" />
            </Link>
          </li>
        ))}
        {/* su telefono il tema non sta nel menu in basso (vedi Nav) */}
        <li className="lg:hidden">
          <TemaToggle className="flex w-full items-center gap-3.5 rounded-lg border border-line bg-surface p-5 text-[17px] font-semibold transition-colors duration-150 hover:bg-surface-sunken/60 [&>svg]:size-5 [&>svg]:text-ink-muted" />
        </li>
      </ul>
    </main>
  );
}

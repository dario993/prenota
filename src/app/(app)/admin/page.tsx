import Link from "next/link";
import { Building2, ChevronRight, Clapperboard, Ticket, Users } from "lucide-react";
import { richiediAdmin } from "@/lib/auth";
import { paginaAdmin } from "@/components/stili";
import { TemaToggle } from "@/components/TemaToggle";

const LINK = [
  ["/admin/locali", "Locali", "Luoghi e capienza", Building2],
  ["/admin/opere", "Opere", "Titoli e tariffario", Clapperboard],
  ["/admin/eventi", "Eventi (admin)", "Opera, locale, data e ora", Ticket],
  ["/admin/utenti", "Utenti", "Accessi e ruoli", Users],
] as const;

export default async function Admin() {
  await richiediAdmin();
  return (
    <main className={paginaAdmin}>
      <div>
        <h1 className="text-title lg:text-display">Admin</h1>
        <p className="mt-1 text-caption text-ink-muted">Per un nuovo spettacolo: locale, poi opera, poi evento.</p>
      </div>
      <ul className="grid gap-3 lg:grid-cols-2">
        {LINK.map(([href, testo, descrizione, Icona]) => (
          <li key={href}>
            <Link href={href} className="flex items-center gap-3 rounded-lg border border-line bg-surface p-4 transition-colors duration-150 hover:border-line-control">
              <Icona size={24} aria-hidden className="shrink-0 text-ink-muted" />
              <span className="min-w-0 flex-1">
                <span className="block text-heading">{testo}</span>
                <span className="block text-caption text-ink-muted">{descrizione}</span>
              </span>
              <ChevronRight size={20} aria-hidden className="text-ink-muted" />
            </Link>
          </li>
        ))}
        {/* su telefono il tema non sta nel menu in basso (vedi Nav) */}
        <li className="lg:hidden">
          <TemaToggle className="flex w-full items-center gap-3 rounded-lg border border-line bg-surface p-4 text-heading transition-colors duration-150 hover:border-line-control [&>svg]:text-ink-muted" />
        </li>
      </ul>
    </main>
  );
}

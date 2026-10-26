"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useEffect } from "react";
import { useIsRestoring, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useInAttesa, riprendiCoda, svuotaDatiLocali } from "@/lib/query";
import { TemaToggle } from "./TemaToggle";
import { Marchio } from "./Marchio";
import { CalendarDays, Building2, Clapperboard, Ticket, TicketCheck, Users, Settings, LogOut } from "lucide-react";

type Voce = { href: string; testo: string; Icona: typeof CalendarDays; solo?: "desktop" | "mobile" };

const VOCI_ADMIN: Voce[] = [
  { href: "/admin", testo: "Admin", Icona: Settings, solo: "mobile" },
  { href: "/admin/locali", testo: "Locali", Icona: Building2, solo: "desktop" },
  { href: "/admin/opere", testo: "Opere", Icona: Clapperboard, solo: "desktop" },
  { href: "/admin/eventi", testo: "Eventi", Icona: Ticket, solo: "desktop" },
  { href: "/admin/liveticket", testo: "LiveTicket", Icona: TicketCheck, solo: "desktop" },
  { href: "/admin/utenti", testo: "Utenti", Icona: Users, solo: "desktop" },
];

export function Nav({ admin, esci }: { admin: boolean; esci?: () => Promise<void> }) {
  const pathname = usePathname();
  const coda = useInAttesa();
  const inAttesa = coda.length;
  const conErrori = coda.some((p) => p.stato === "error");
  const qc = useQueryClient();
  const ripristino = useIsRestoring();
  // il menu esiste solo con una sessione valida: qui (e non sul login) riparte la coda salvata sul telefono
  useEffect(() => {
    if (!ripristino) riprendiCoda(qc);
  }, [ripristino, qc]);
  // Uscire con prenotazioni non inviate le farebbe partire con il prossimo utente: si blocca.
  // Altrimenti si svuota tutto ciò che è salvato sul telefono prima del logout sul server.
  const esciPulito = esci && (async () => {
    if (inAttesa) {
      toast.error(`Ci sono ${inAttesa} prenotazioni non ancora inviate: torna online e attendi l'invio prima di uscire.`);
      return;
    }
    await svuotaDatiLocali(qc);
    await esci();
  });
  const voci: Voce[] = [{ href: "/", testo: "Eventi", Icona: CalendarDays }, ...(admin ? VOCI_ADMIN : [])];
  const attiva = (v: Voce) => {
    if (v.href === "/") return pathname === "/" || pathname.startsWith("/eventi");
    if (v.solo === "mobile") return pathname.startsWith("/admin");
    return pathname.startsWith(v.href);
  };
  // telefono: barra in basso (icona sopra la parola); desktop: colonna sulla cornice, voce attiva come pillola grigio-blu
  const base =
    "flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 px-2 text-label transition-colors duration-150 lg:h-9 lg:min-h-0 lg:flex-none lg:flex-row lg:justify-start lg:gap-2.5 lg:rounded-md lg:px-2.5 lg:text-[15px] lg:font-normal";
  const voce = (v: Voce) => (
    <Link
      key={v.href}
      href={v.href}
      aria-current={attiva(v) ? "page" : undefined}
      className={clsx(
        base,
        attiva(v) ? "text-accent lg:bg-active lg:font-medium lg:text-ink" : "text-ink-muted hover:text-ink",
        v.solo === "desktop" && "hidden lg:flex",
        v.solo === "mobile" && "lg:hidden",
      )}
    >
      <span className="relative">
        <v.Icona strokeWidth={1.75} aria-hidden className="size-6 lg:size-5" />
        {v.href === "/" && !!inAttesa && (
          <span data-testid="badge-attesa" aria-label={`${inAttesa} prenotazioni in attesa di invio`}
            className={clsx("absolute -right-3 -top-2 min-w-5 rounded-full px-1.5 text-center text-label leading-5 tabular-nums",
              conErrori ? "bg-danger text-on-danger" : "bg-accent text-on-accent")}>{inAttesa}</span>
        )}
      </span>
      {v.testo}
    </Link>
  );
  return (
    <nav
      aria-label="Principale"
      className="fixed inset-x-0 bottom-0 z-10 flex h-[calc(64px+env(safe-area-inset-bottom))] bg-bg pb-[env(safe-area-inset-bottom)] shadow-bar lg:sticky lg:top-0 lg:h-screen lg:w-57 lg:flex-col lg:gap-0.5 lg:p-3 lg:shadow-none print:hidden"
    >
      <Link href="/" className="hidden items-center gap-2.5 px-2 pb-5 pt-1.5 text-[17px] font-semibold text-ink lg:flex">
        <Marchio />Prenota
      </Link>
      {voce(voci[0])}
      {admin && <p className="hidden px-2.5 pb-1.5 pt-6 text-caption text-ink-muted lg:block">Amministrazione</p>}
      {voci.slice(1).map(voce)}
      <TemaToggle className={clsx(base, "hidden text-ink-muted hover:text-ink lg:mt-auto lg:flex [&>svg]:size-5")} />
      {esciPulito && (
        <form action={esciPulito} className="flex flex-1 lg:flex-none">
          <button className={clsx(base, "w-full text-ink-muted hover:text-ink")}>
            <LogOut strokeWidth={1.75} aria-hidden className="size-6 lg:size-5" />
            Esci
          </button>
        </form>
      )}
    </nav>
  );
}

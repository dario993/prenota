"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { CalendarDays, Building2, Clapperboard, Ticket, Users, Settings, LogOut } from "lucide-react";

type Voce = { href: string; testo: string; Icona: typeof CalendarDays; solo?: "desktop" | "mobile" };

const VOCI_ADMIN: Voce[] = [
  { href: "/admin", testo: "Admin", Icona: Settings, solo: "mobile" },
  { href: "/admin/locali", testo: "Locali", Icona: Building2, solo: "desktop" },
  { href: "/admin/opere", testo: "Opere", Icona: Clapperboard, solo: "desktop" },
  { href: "/admin/eventi", testo: "Eventi (admin)", Icona: Ticket, solo: "desktop" },
  { href: "/admin/utenti", testo: "Utenti", Icona: Users, solo: "desktop" },
];

export function Nav({ admin, inAttesa, esci }: { admin: boolean; inAttesa?: number; esci?: () => Promise<void> }) {
  const pathname = usePathname();
  const voci: Voce[] = [{ href: "/", testo: "Eventi", Icona: CalendarDays }, ...(admin ? VOCI_ADMIN : [])];
  const attiva = (v: Voce) => {
    if (v.href === "/") return pathname === "/" || pathname.startsWith("/eventi");
    if (v.solo === "mobile") return pathname.startsWith("/admin");
    return pathname.startsWith(v.href);
  };
  const base =
    "flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 px-2 text-xs lg:flex-none lg:flex-row lg:justify-start lg:gap-3 lg:rounded-md lg:px-3 lg:text-sm";
  return (
    <nav
      aria-label="Principale"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] lg:static lg:h-screen lg:w-60 lg:flex-col lg:gap-1 lg:border-r lg:border-t-0 lg:p-3 lg:pb-3 print:hidden"
    >
      <span className="hidden px-3 py-4 text-lg font-bold text-accento lg:block">Prenota</span>
      {voci.map((v) => (
        <Link
          key={v.href}
          href={v.href}
          aria-current={attiva(v) ? "page" : undefined}
          className={clsx(
            base,
            attiva(v) ? "font-semibold text-accento lg:bg-blue-50" : "text-gray-600 hover:text-accento",
            v.solo === "desktop" && "hidden lg:flex",
            v.solo === "mobile" && "lg:hidden",
          )}
        >
          <span className="relative">
            <v.Icona size={22} aria-hidden />
            {v.href === "/" && !!inAttesa && (
              <span className="absolute -right-2 -top-1.5 rounded-full bg-amber-500 px-1 text-[10px] leading-4 text-white">{inAttesa}</span>
            )}
          </span>
          {v.testo}
        </Link>
      ))}
      {esci && (
        <form action={esci} className="flex flex-1 lg:mt-auto lg:flex-none">
          <button className={clsx(base, "w-full text-gray-600 hover:text-accento")}>
            <LogOut size={22} aria-hidden />
            Esci
          </button>
        </form>
      )}
    </nav>
  );
}

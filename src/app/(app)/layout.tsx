import { redirect } from "next/navigation";
import { esci, richiediUtente } from "@/lib/auth";
import { Nav } from "@/components/Nav";

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const utente = await richiediUtente();
  async function azioneEsci() {
    "use server";
    await esci();
    redirect("/login");
  }
  return (
    <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)] print:block">
      <Nav admin={utente.ruolo === "admin"} esci={azioneEsci} />
      {/* sotto: navigazione (64px + area sicura) e space-12 di respiro */}
      <div className="w-full pb-[calc(112px+env(safe-area-inset-bottom))] lg:pb-12 print:pb-0">{children}</div>
    </div>
  );
}

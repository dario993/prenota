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
    <div className="lg:grid lg:grid-cols-[228px_minmax(0,1fr)] print:block">
      <Nav admin={utente.ruolo === "admin"} esci={azioneEsci} />
      {/* il foglio: su desktop bianco, staccato di 8px dalla cornice, angoli 16px, bordo sottile e nessuna ombra;
          sotto su telefono: navigazione (64px + area sicura) e space-12 di respiro */}
      <div className="min-h-screen w-full min-w-0 bg-surface pb-[calc(112px+env(safe-area-inset-bottom))] lg:my-2 lg:mr-2 lg:min-h-[calc(100vh-16px)] lg:rounded-2xl lg:border lg:border-line lg:pb-12 print:m-0 print:min-h-0 print:border-0 print:pb-0">{children}</div>
    </div>
  );
}

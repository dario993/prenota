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
    <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      <Nav admin={utente.ruolo === "admin"} esci={azioneEsci} />
      <div className="mx-auto w-full max-w-7xl pb-20 lg:pb-0">{children}</div>
    </div>
  );
}

import { redirect } from "next/navigation";
import { esci, richiediUtente } from "@/lib/auth";

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  await richiediUtente();
  async function azioneEsci() {
    "use server";
    await esci();
    redirect("/login");
  }
  return (
    <>
      <header className="flex items-center justify-between border-b p-3">
        <span className="font-bold text-accento">Prenota</span>
        <form action={azioneEsci}>
          <button className="text-sm text-gray-600 underline">Esci</button>
        </form>
      </header>
      {children}
    </>
  );
}

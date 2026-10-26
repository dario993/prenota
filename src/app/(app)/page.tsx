import { richiediUtente } from "@/lib/auth";
import { Eventi } from "./ListaEventi";
import { BarraTelefono } from "@/components/BarraTelefono";

export default async function Home() {
  await richiediUtente();
  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-6 lg:px-6">
      <BarraTelefono titolo="Prenota" />
      <Eventi />
    </main>
  );
}

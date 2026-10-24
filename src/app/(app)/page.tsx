import { richiediUtente } from "@/lib/auth";
import { EventiPassati, ListaEventi } from "./ListaEventi";
import { NonInviate } from "@/components/InAttesa";

export default async function Home() {
  await richiediUtente();
  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-6 lg:px-6">
      <h1 className="mb-4 text-title lg:text-display">Prossimi eventi</h1>
      <NonInviate />
      <ListaEventi />
      <EventiPassati />
    </main>
  );
}

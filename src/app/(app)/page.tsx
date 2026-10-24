import { richiediUtente } from "@/lib/auth";
import { ListaEventi } from "./ListaEventi";

export default async function Home() {
  await richiediUtente();
  return (
    <main className="mx-auto max-w-5xl p-4 lg:p-8">
      <h1 className="mb-4 text-xl font-semibold lg:text-2xl">Prossimi eventi</h1>
      <ListaEventi />
    </main>
  );
}

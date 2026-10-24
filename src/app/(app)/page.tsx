import { richiediUtente } from "@/lib/auth";

export default async function Home() {
  const utente = await richiediUtente();
  return <main className="p-4">Ciao {utente.nome}</main>;
}

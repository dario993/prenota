import { richiediUtente } from "@/lib/auth";
import { PaginaEvento } from "./PaginaEvento";

export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  const utente = await richiediUtente();
  const { id } = await params;
  return <PaginaEvento id={id} solaLettura={utente.ruolo === "visualizzatore"} />;
}

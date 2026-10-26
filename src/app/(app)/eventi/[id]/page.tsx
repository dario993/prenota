import { richiediUtente } from "@/lib/auth";
import { PaginaEvento } from "./PaginaEvento";

export default async function Pagina({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const utente = await richiediUtente();
  const { id } = await params;
  const { tab } = await searchParams;
  return <PaginaEvento id={id} solaLettura={utente.ruolo === "visualizzatore"} tabIniziale={tab === "liveticket" ? "liveticket" : "prenotazioni"} />;
}

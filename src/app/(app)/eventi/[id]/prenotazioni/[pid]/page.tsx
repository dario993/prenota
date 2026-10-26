import { richiediUtente } from "@/lib/auth";
import { ModificaPrenotazione } from "../../FormPrenotazione";

export default async function Pagina({ params }: { params: Promise<{ id: string; pid: string }> }) {
  const utente = await richiediUtente();
  const { id, pid } = await params;
  return <ModificaPrenotazione eventoId={id} pid={pid} solaLettura={utente.ruolo === "visualizzatore"} />;
}

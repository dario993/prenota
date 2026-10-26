import { redirect } from "next/navigation";
import { richiediUtente } from "@/lib/auth";
import { FormPrenotazione } from "../../FormPrenotazione";

export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  const utente = await richiediUtente();
  const { id } = await params;
  if (utente.ruolo === "visualizzatore") redirect(`/eventi/${id}`);
  return <FormPrenotazione eventoId={id} />;
}

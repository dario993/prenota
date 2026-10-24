import { richiediUtente } from "@/lib/auth";
import { FormPrenotazione } from "../../FormPrenotazione";

export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  await richiediUtente();
  const { id } = await params;
  return <FormPrenotazione eventoId={id} />;
}

import { richiediUtente } from "@/lib/auth";
import { PaginaEvento } from "./PaginaEvento";

export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  await richiediUtente();
  const { id } = await params;
  return <PaginaEvento id={id} />;
}

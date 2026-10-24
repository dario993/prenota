import { richiediUtente } from "@/lib/auth";
import { PaginaRistoranti } from "./PaginaRistoranti";

export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  await richiediUtente();
  const { id } = await params;
  return <PaginaRistoranti id={id} />;
}

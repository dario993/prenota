import { redirect } from "next/navigation";
import { ciSonoUtenti } from "@/lib/auth";
import { FormPrimoAccesso } from "./form";

export const dynamic = "force-dynamic";

export default async function PaginaPrimoAccesso() {
  if (await ciSonoUtenti()) redirect("/login");
  return <FormPrimoAccesso />;
}

import { redirect } from "next/navigation";
import { ciSonoUtenti } from "@/lib/auth";
import { FormLogin } from "./form";

export const dynamic = "force-dynamic";

export default async function PaginaLogin() {
  if (!(await ciSonoUtenti())) redirect("/primo-accesso");
  return <FormLogin />;
}

"use server";

import { revalidatePath } from "next/cache";
import { verificaAdmin } from "@/lib/auth";
import { riabbinaOrdini } from "@/lib/liveticket-db";

export async function riabbina(): Promise<{ aggiornati: number }> {
  await verificaAdmin();
  const aggiornati = await riabbinaOrdini();
  revalidatePath("/admin/liveticket");
  return { aggiornati };
}

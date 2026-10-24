import Link from "next/link";
import { richiediAdmin } from "@/lib/auth";

const LINK = [
  ["/admin/locali", "Locali"],
  ["/admin/opere", "Opere"],
  ["/admin/eventi", "Eventi (admin)"],
  ["/admin/utenti", "Utenti"],
] as const;

export default async function Admin() {
  await richiediAdmin();
  return (
    <main className="mx-auto max-w-4xl space-y-3 p-4">
      <h1 className="text-xl font-bold">Admin</h1>
      {LINK.map(([href, testo]) => (
        <Link key={href} href={href} className="block min-h-11 rounded border border-gray-200 p-4 font-medium hover:text-accento">
          {testo}
        </Link>
      ))}
    </main>
  );
}

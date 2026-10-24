import Link from "next/link";

// Testo al posto del contenuto (caricamento, senza rete, errore). Con `nonTrovato` titolo e link agli eventi.
export function Stato({ testo, nonTrovato = false }: { testo: string; nonTrovato?: boolean }) {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-6 lg:px-6">
      {nonTrovato ? (
        <>
          <h1 className="text-heading">{testo}</h1>
          <Link href="/" className="mt-2 inline-flex min-h-11 items-center text-accent hover:underline">Torna agli eventi</Link>
        </>
      ) : (
        <p className="text-ink-muted">{testo}</p>
      )}
    </main>
  );
}

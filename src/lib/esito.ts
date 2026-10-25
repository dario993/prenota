// chiave: solo alla creazione di un utente «api», da mostrare una volta
export type Esito = { ok: true; chiave?: string } | { errore: string };
export const ERRORE_IMPREVISTO = "Errore imprevisto, riprova";

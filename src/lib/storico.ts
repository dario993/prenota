import "server-only";
import type postgres from "postgres";

// Voce di cronologia con la copia della prenotazione così com'è ora (dopo l'azione), righe tariffa comprese.
// Va chiamata nella stessa transazione della modifica.
export async function registraStorico(
  tx: postgres.TransactionSql, prenotazioneId: string, utenteId: string, azione: "creata" | "modificata" | "stato",
) {
  await tx`
    insert into prenotazioni_storico (prenotazione_id, utente_id, azione, contrassegno, dati)
    select p.id, ${utenteId}::uuid, ${azione}::text, p.contrassegno,
      jsonb_build_object('cognome_nome', p.cognome_nome, 'telefono', p.telefono, 'pacchetti', p.pacchetti,
        'ristorante', p.ristorante, 'pasto', p.pasto, 'posti', p.posti, 'provenienza', p.provenienza, 'note', p.note,
        'contrassegno', p.contrassegno, 'pagamento', p.pagamento, 'prezzo_pacchetto_teatro', p.prezzo_pacchetto_teatro,
        'prezzo_pacchetto_ristorante', p.prezzo_pacchetto_ristorante,
        'righe', coalesce((select jsonb_agg(jsonb_build_object('tariffa_id', r.tariffa_id, 'quantita', r.quantita, 'prezzo', r.prezzo))
                           from prenotazioni_tariffe r where r.prenotazione_id = p.id), '[]'))
    from prenotazioni p where p.id = ${prenotazioneId}`;
}

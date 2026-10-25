-- 004: cronologia. Colonna «dati» (copia della prenotazione) se la tabella esisteva senza; per le prenotazioni senza
-- cronologia (nate prima) una voce «creata» da creata_il/creata_da, senza copia. Idempotente.
alter table prenotazioni_storico add column if not exists dati jsonb;
insert into prenotazioni_storico (prenotazione_id, utente_id, il, azione, contrassegno)
select p.id, p.creata_da, p.creata_il, 'creata', null
from prenotazioni p
where not exists (select 1 from prenotazioni_storico s where s.prenotazione_id = p.id);

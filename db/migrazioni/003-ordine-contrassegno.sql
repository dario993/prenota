-- 003: ordine manuale dell'elenco e contrassegno colorato (stampato, prenotato, modificato, annullato;
-- null = nessuno stato). Idempotente.
alter table prenotazioni add column if not exists ordine integer;
alter table prenotazioni add column if not exists contrassegno text
  check (contrassegno in ('prenotato', 'stampato', 'modificato', 'annullato'));
alter table prenotazioni alter column contrassegno drop not null, alter column contrassegno drop default;

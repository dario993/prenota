-- 008: azione «spostata» nella cronologia (prenotazione passata a un'altra data della stessa opera). Idempotente.
alter table prenotazioni_storico drop constraint if exists prenotazioni_storico_azione_check;
alter table prenotazioni_storico add constraint prenotazioni_storico_azione_check
  check (azione in ('creata', 'modificata', 'stato', 'spostata'));

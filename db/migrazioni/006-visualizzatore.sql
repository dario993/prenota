-- 006: ruolo «visualizzatore» (vede come l'operatore, non modifica nulla). Idempotente.
alter table utenti drop constraint if exists utenti_ruolo_check;
alter table utenti add constraint utenti_ruolo_check check (ruolo in ('admin', 'operatore', 'visualizzatore', 'api'));

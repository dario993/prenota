-- 002: ruolo «api» per gli utenti di accesso remoto (chiave al posto della password, email facoltativa). Idempotente.
-- La tabella chiavi_api della prima versione non serve più: le chiavi sono utenti.
drop table if exists chiavi_api;
alter table utenti drop constraint if exists utenti_ruolo_check;
alter table utenti add constraint utenti_ruolo_check check (ruolo in ('admin', 'operatore', 'api'));
alter table utenti alter column email drop not null;
alter table utenti drop constraint if exists utenti_email_check;
alter table utenti add constraint utenti_email_check check (ruolo = 'api' or email is not null);

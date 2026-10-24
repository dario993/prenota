-- 001: dai cinque tipi fissi (adulti, ridotti, bambini, omaggi + pacchetto) al tariffario libero per opera.
-- Idempotente: fa qualcosa solo se prenotazioni ha ancora la colonna "adulti". Le tabelle nuove le crea schema.sql.
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = current_schema() and table_name = 'prenotazioni' and column_name = 'adulti') then
    alter table opere add column if not exists pacchetto_nascosto boolean not null default false;

    insert into tariffe (opera_id, nome, prezzo, ordine)
    select o.id, t.nome, t.prezzo, t.ordine
    from opere o, lateral (values ('Adulti', o.prezzo_adulto, 1), ('Ridotti gruppi', o.prezzo_ridotto, 2),
                                  ('Bambini', o.prezzo_bambino, 3), ('Omaggi', 0, 4)) as t (nome, prezzo, ordine);

    -- una riga per ogni quantità > 0, con il prezzo congelato della prenotazione
    insert into prenotazioni_tariffe (prenotazione_id, tariffa_id, quantita, prezzo)
    select p.id, t.id, q.quantita, q.prezzo
    from prenotazioni p
    join eventi e on e.id = p.evento_id
    cross join lateral (values ('Adulti', p.adulti, p.prezzo_adulto), ('Ridotti gruppi', p.ridotti, p.prezzo_ridotto),
                               ('Bambini', p.bambini, p.prezzo_bambino), ('Omaggi', p.omaggi, 0)) as q (nome, quantita, prezzo)
    join tariffe t on t.opera_id = e.opera_id and t.nome = q.nome
    where q.quantita > 0;

    alter table prenotazioni drop column adulti, drop column ridotti, drop column bambini, drop column omaggi,
      drop column prezzo_adulto, drop column prezzo_ridotto, drop column prezzo_bambino;
    alter table opere drop column prezzo_adulto, drop column prezzo_ridotto, drop column prezzo_bambino;
  end if;
end
$$;

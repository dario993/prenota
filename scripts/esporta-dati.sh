#!/bin/sh
# Esporta i dati dell'app (non utenti né sessioni) come SQL da caricare su un altro database già allo schema attuale.
# Ripetibile: righe con lo stesso id già presenti si saltano; tutto in una transazione. creata_da diventa null
# (gli utenti non si copiano). Uso: npm run -s db:esporta > dati.sql
set -eu
DATABASE_URL=${DATABASE_URL:-$(grep '^DATABASE_URL=' .env.local | cut -d= -f2-)}
psql "$DATABASE_URL" -X -q -At -v ON_ERROR_STOP=1 <<'SQL'
select 'begin;';
select format('insert into %I select * from json_populate_recordset(null::%I, %L) on conflict do nothing;', t, t, j)
from (
  select 1 as n, 'locali' as t, (select coalesce(json_agg(r), '[]') from locali r) as j
  union all select 2, 'opere', (select coalesce(json_agg(r), '[]') from opere r)
  union all select 3, 'tariffe', (select coalesce(json_agg(r), '[]') from tariffe r)
  union all select 4, 'eventi', (select coalesce(json_agg(r), '[]') from eventi r)
  union all select 5, 'prenotazioni', (select coalesce(json_agg(to_jsonb(r) - 'creata_da'), '[]') from prenotazioni r)
  union all select 6, 'prenotazioni_tariffe', (select coalesce(json_agg(r), '[]') from prenotazioni_tariffe r)
) x order by n;
select 'commit;';
SQL

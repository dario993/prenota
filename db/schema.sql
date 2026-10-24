-- Schema Prenota. Idempotente: si applica con `npm run db:init`.

create table if not exists utenti (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text not null unique,
  password_hash text not null,
  ruolo text not null check (ruolo in ('admin', 'operatore')),
  attivo boolean not null default true
);

create table if not exists sessioni (
  id text primary key,
  utente_id uuid not null references utenti (id) on delete cascade,
  scade_il timestamptz not null
);

create table if not exists locali (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  capienza integer not null check (capienza > 0)
);

create table if not exists opere (
  id uuid primary key default gen_random_uuid(),
  titolo text not null,
  prezzo_adulto integer not null check (prezzo_adulto >= 0),
  prezzo_ridotto integer not null check (prezzo_ridotto >= 0),
  prezzo_bambino integer not null check (prezzo_bambino >= 0),
  prezzo_pacchetto_teatro integer not null default 2200 check (prezzo_pacchetto_teatro >= 0),
  prezzo_pacchetto_ristorante integer not null default 2700 check (prezzo_pacchetto_ristorante >= 0)
);

create table if not exists eventi (
  id uuid primary key default gen_random_uuid(),
  opera_id uuid not null references opere (id) on delete restrict,
  locale_id uuid not null references locali (id) on delete restrict,
  data_ora timestamptz not null
);

create table if not exists prenotazioni (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventi (id) on delete restrict,
  cognome_nome text not null,
  telefono text not null default '',
  adulti integer not null default 0 check (adulti >= 0),
  ridotti integer not null default 0 check (ridotti >= 0),
  bambini integer not null default 0 check (bambini >= 0),
  pacchetti integer not null default 0 check (pacchetti >= 0),
  omaggi integer not null default 0 check (omaggi >= 0),
  ristorante text check (ristorante in ('GIAMAICA', 'CASALE')),
  pasto text check (pasto in ('PRANZO', 'CENA')),
  posti text not null default '',
  provenienza text not null default '',
  note text not null default '',
  prezzo_adulto integer not null check (prezzo_adulto >= 0),
  prezzo_ridotto integer not null check (prezzo_ridotto >= 0),
  prezzo_bambino integer not null check (prezzo_bambino >= 0),
  prezzo_pacchetto_teatro integer not null check (prezzo_pacchetto_teatro >= 0),
  prezzo_pacchetto_ristorante integer not null check (prezzo_pacchetto_ristorante >= 0),
  creata_da uuid references utenti (id),
  creata_il timestamptz not null default now(),
  aggiornata_il timestamptz not null default now(),
  check (adulti + ridotti + bambini + pacchetti + omaggi > 0),
  check ((pacchetti > 0) = (ristorante is not null and pasto is not null)),
  check (pacchetti > 0 or (ristorante is null and pasto is null))
);

create index if not exists prenotazioni_evento_id_idx on prenotazioni (evento_id);
create index if not exists eventi_data_ora_idx on eventi (data_ora);

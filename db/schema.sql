-- Schema Prenota (stato finale). Idempotente: si applica con `npm run db:init`, poi db/migrazioni/*.sql in ordine.

create table if not exists utenti (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text unique, -- null solo per gli utenti «api»
  password_hash text not null,
  ruolo text not null check (ruolo in ('admin', 'operatore', 'visualizzatore', 'api')), -- api: accesso remoto con chiave, senza login
  attivo boolean not null default true,
  constraint utenti_email_check check (ruolo = 'api' or email is not null)
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
  prezzo_pacchetto_teatro integer not null default 2200 check (prezzo_pacchetto_teatro >= 0),
  prezzo_pacchetto_ristorante integer not null default 2700 check (prezzo_pacchetto_ristorante >= 0),
  pacchetto_nascosto boolean not null default false
);

-- Tariffario libero per opera (il pacchetto resta sull'opera). Nascosta = non compare nel modulo di prenotazione.
create table if not exists tariffe (
  id uuid primary key default gen_random_uuid(),
  opera_id uuid not null references opere (id) on delete cascade,
  nome text not null,
  prezzo integer not null check (prezzo >= 0),
  nascosta boolean not null default false,
  ordine integer not null
);
create unique index if not exists tariffe_opera_nome_idx on tariffe (opera_id, lower(nome));

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
  pacchetti integer not null default 0 check (pacchetti >= 0),
  ristorante text check (ristorante in ('GIAMAICA', 'CASALE')),
  pasto text check (pasto in ('PRANZO', 'CENA')),
  posti text not null default '',
  provenienza text not null default '',
  note text not null default '',
  -- posizione scelta a mano nell'elenco; null = in fondo, in ordine di inserimento
  ordine integer,
  -- null = nessuno stato (appena inserita)
  contrassegno text check (contrassegno in ('prenotato', 'stampato', 'modificato', 'annullato')),
  -- null = nessuna scelta; si sceglie solo nel dettaglio della prenotazione
  pagamento text check (pagamento in ('da_pagare', 'bonifico')),
  prezzo_pacchetto_teatro integer not null check (prezzo_pacchetto_teatro >= 0),
  prezzo_pacchetto_ristorante integer not null check (prezzo_pacchetto_ristorante >= 0),
  creata_da uuid references utenti (id),
  creata_il timestamptz not null default now(),
  aggiornata_il timestamptz not null default now(),
  check ((pacchetti > 0) = (ristorante is not null and pasto is not null)),
  check (pacchetti > 0 or (ristorante is null and pasto is null))
);

-- Quantità per tariffa con prezzo congelato al primo inserimento; "restrict" impedisce di eliminare una tariffa usata.
create table if not exists prenotazioni_tariffe (
  prenotazione_id uuid not null references prenotazioni (id) on delete cascade,
  tariffa_id uuid not null references tariffe (id) on delete restrict,
  quantita integer not null check (quantita > 0),
  prezzo integer not null check (prezzo >= 0),
  primary key (prenotazione_id, tariffa_id)
);

-- Cronologia: chi e quando ha creato, modificato o cambiato lo stato; contrassegno = lo stato dopo l'azione.
create table if not exists prenotazioni_storico (
  id bigint generated always as identity primary key,
  prenotazione_id uuid not null references prenotazioni (id) on delete cascade,
  utente_id uuid references utenti (id),
  il timestamptz not null default now(),
  azione text not null check (azione in ('creata', 'modificata', 'stato')),
  contrassegno text,
  dati jsonb -- copia della prenotazione dopo l'azione; null per le voci ricostruite da 004
);

create index if not exists prenotazioni_storico_prenotazione_id_idx on prenotazioni_storico (prenotazione_id);
create index if not exists prenotazioni_evento_id_idx on prenotazioni (evento_id);
create index if not exists eventi_data_ora_idx on eventi (data_ora);

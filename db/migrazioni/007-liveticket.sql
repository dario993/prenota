-- 007: ordini LiveTicket (arrivano da n8n). Idempotente.
create table if not exists liveticket_ordini (
  codice text primary key,               -- lvtckt-…
  cognome_nome text not null default '',
  telefono text not null default '',
  spettacolo text not null default '',
  data_ora timestamptz,                  -- null se non letta
  evento_id uuid references eventi (id) on delete set null, -- null = senza evento
  biglietti_dichiarati integer,
  -- una riga per biglietto: {posto, tariffa, tariffa_id|null, ristorante|null, pasto|null, prezzo}
  -- prezzo in centesimi, congelato all'arrivo dal tariffario dell'opera (o pacchetto teatro), senza commissione
  biglietti jsonb not null default '[]',
  importo_pagato integer,                -- «€ X per i biglietti» di LiveTicket, centesimi, solo per controllo
  anomalie text[] not null default '{}',
  email_id text not null default '',
  email_data text not null default '',
  ricevuto_il timestamptz not null default now(),
  aggiornato_il timestamptz not null default now()
);
create index if not exists liveticket_ordini_evento_id_idx on liveticket_ordini (evento_id);

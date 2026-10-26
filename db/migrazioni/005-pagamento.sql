-- 005: pagamento scelto nel dettaglio della prenotazione (da pagare, bonifico; null = nessuno). Idempotente.
alter table prenotazioni add column if not exists pagamento text check (pagamento in ('da_pagare', 'bonifico'));

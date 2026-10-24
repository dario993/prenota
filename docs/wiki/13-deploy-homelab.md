# 13. Deploy homelab

> Stato: da implementare

Come per StageTrack: immagine Docker pubblicata su **ghcr** e avviata sull'homelab.

## Immagine

- `next.config.ts` con `output: "standalone"`.
- `Dockerfile` multi-stage: `npm ci` → `npm run build` → immagine finale con solo `.next/standalone`, `.next/static`,
  `public`.
- Build per l'homelab: `docker build --platform linux/amd64 -t ghcr.io/dario993/prenota:latest .` e `docker push`.

## docker-compose (sull'homelab)

Due servizi:

- **app** – l'immagine `prenota`, variabili `DATABASE_URL`, `NODE_ENV=production`;
- **db** – `postgres:17` con **volume persistente** per i dati.

Al primo avvio: `db:init` e `crea-admin` eseguiti nel container dell'app.

## HTTPS

Obbligatorio: senza HTTPS non funzionano Condividi, copia negli appunti e service worker, e il cookie `Secure` non viene
inviato. L'app sta dietro lo **stesso reverse proxy** usato per StageTrack, con certificato TLS.

## Backup

`pg_dump` giornaliero del database in una cartella dell'homelab (cron), con conservazione degli ultimi N giorni.
Ripristino: `psql < backup.sql` su un database vuoto.

## Aggiornare

1. build e push della nuova immagine;
2. sull'homelab `docker compose pull && docker compose up -d`;
3. se ci sono migrazioni, applicarle prima di riavviare l'app.

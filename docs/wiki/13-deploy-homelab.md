# 13. Deploy homelab

> Stato: fatto (file scritti e app standalone verificata in locale; il `docker build` va ancora provato la prima volta sull'homelab)

Come per StageTrack: immagine Docker pubblicata su **ghcr** e avviata sull'homelab, con Postgres in un container a parte.

## Immagine

- `next.config.ts` con `output: "standalone"`.
- `Dockerfile` multi-stage su `node:22-alpine`: `npm ci` → `npm run build` → immagine finale con `.next/standalone`,
  `.next/static`, `public`, più `db/schema.sql`, `scripts/`, `src/lib/password.mjs` e `node_modules/postgres`
  (servono agli script `db-init` e `crea-admin`). Gira come utente `node`, `PORT=3000`, `HOSTNAME=0.0.0.0`.
- Dal proprio computer: `npm run docker:build` poi `npm run docker:push`
  (o `npm run docker:deploy`). Equivale a
  `docker build --platform linux/amd64 -t ghcr.io/dario993/prenota:latest .` e `docker push`.

## docker-compose (sull'homelab)

Copiare sull'homelab `docker-compose.yml` e `scripts/backup.sh`, e creare accanto un file `.env`
(vedi `.env.example`, non versionare i segreti reali):

```
POSTGRES_PASSWORD=una-password-lunga
```

Servizi:

- **app** – `ghcr.io/dario993/prenota:latest`, `DATABASE_URL=postgres://prenota:${POSTGRES_PASSWORD}@db:5432/prenota`,
  porta interna 3000 (pubblicata come 3001 sull'host: cambiarla se occupata);
- **db** – `postgres:17`, volume persistente `prenota-db`, `POSTGRES_DB=prenota`; l'app parte quando il db è pronto.

### Primo avvio

```bash
docker compose up -d db
docker compose run --rm app node scripts/db-init.mjs
docker compose run --rm -e ADMIN_EMAIL=... -e ADMIN_NOME=... -e ADMIN_PASSWORD=... app node scripts/crea-admin.mjs
docker compose up -d
```

`db-init` si può rilanciare: lo schema usa `if not exists` (i messaggi NOTICE «already exists» sono normali).

## HTTPS

Obbligatorio: senza HTTPS non funzionano Condividi, copia negli appunti e service worker, e il cookie `Secure` non viene
inviato (il login non entra). L'app sta dietro lo **stesso reverse proxy** usato per StageTrack, con certificato TLS:
il proxy deve puntare a `prenota-app:3000` (se condivide la rete Docker) o a `host:3001`, e inoltrare gli header
`Host` e `X-Forwarded-Proto`.

## Backup

`scripts/backup.sh` (da lanciare sull'homelab nella cartella del compose) esegue
`docker compose exec -T db pg_dump -U prenota prenota | gzip > backups/prenota-AAAA-MM-GG.sql.gz` e cancella i file
più vecchi di 30 giorni. Cron d'esempio, ogni notte alle 03:00:

```
0 3 * * * /srv/prenota/scripts/backup.sh >> /srv/prenota/backups/backup.log 2>&1
```

Ripristino su un database vuoto:
`gunzip -c backups/prenota-AAAA-MM-GG.sql.gz | docker compose exec -T db psql -U prenota prenota`.

## Aggiornare

1. sul proprio computer `npm run docker:deploy`;
2. sull'homelab `docker compose pull && docker compose up -d`;
3. se lo schema è cambiato, applicare la migrazione prima di riavviare l'app (nessun sistema di migrazioni: vedi
   [Database](08-database.md)).

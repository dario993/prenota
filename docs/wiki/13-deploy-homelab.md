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
(vedi `.env.example`, non versionare i segreti reali; senza `POSTGRES_PASSWORD` compose si rifiuta di partire):

```
POSTGRES_PASSWORD=una-password-lunga
```

Servizi:

- **app** – `ghcr.io/dario993/prenota:latest`, `DATABASE_URL=postgres://prenota:${POSTGRES_PASSWORD}@db:5432/prenota`,
  porta interna 3000, pubblicata solo su `127.0.0.1:3001` dell'host (non raggiungibile dalla rete: serve un proxy sullo stesso host; se il proxy sta su un'altra macchina o in Docker, usa la rete condivisa e `prenota-app:3000`);
- **db** – `postgres:17`, volume persistente `prenota-db`, `POSTGRES_DB=prenota`; l'app parte quando il db è pronto.

### Primo avvio

```bash
docker compose up -d db
docker compose run --rm app node scripts/db-init.mjs
docker compose up -d
```

Al primo accesso dal browser l'app chiede di creare il primo admin: non serve più `crea-admin`, che resta come recupero (`docker compose run --rm -e ADMIN_EMAIL=... -e ADMIN_NOME=... -e ADMIN_PASSWORD=... app node scripts/crea-admin.mjs`).

`db-init` si può rilanciare: lo schema usa `if not exists` (i messaggi NOTICE «already exists» sono normali).

### Rete del proxy esistente

Se il reverse proxy gira in Docker con una sua rete (es. `proxy`), si collega l'app a quella rete e il proxy punta a
`prenota-app:3000`. In questo caso la porta pubblicata non serve: togliere il blocco `ports` dal servizio `app`.

```yaml
services:
  app:
    # ports: rimosso, ci arriva il proxy dalla rete condivisa
    networks:
      - prenota-net
      - proxy

networks:
  prenota-net:
    driver: bridge
  proxy:
    external: true   # rete già creata dal proxy (nome da verificare con `docker network ls`)
```

Il db resta solo su `prenota-net`, non raggiungibile dal proxy.

## Portainer (da repository)

Alternativa al compose + immagine su ghcr: Portainer clona il repository e costruisce l'immagine sull'homelab
(`docker-compose.portainer.yml`, con `build: .`).

1. Portainer → *Stacks* → *Add stack* → **Build method: Repository**.
2. Repository URL `https://github.com/dario993/prenota`, reference `refs/heads/feat/app` (`refs/heads/main` dopo il merge),
   Compose path `docker-compose.portainer.yml`.
3. Environment variables: `POSTGRES_PASSWORD` (obbligatoria; senza, il deploy si ferma con un messaggio).
4. Facoltativo: *GitOps updates* (polling) per ricostruire quando il ramo cambia; altrimenti *Pull and redeploy* a mano.
5. *Deploy the stack*. Il container dell'app esegue `node scripts/db-init.mjs && node server.js`: a ogni avvio applica
   lo schema (idempotente, solo `create ... if not exists`) e le migrazioni di `db/migrazioni/` (idempotenti: un
   database vecchio viene convertito, uno già aggiornato resta com'è), poi parte il server. L'app è su porta `3005` dell'host.

HTTPS: nel reverse proxy punta `prenota.hsdscp.duckdns.org` a `http://IP-HOMELAB:3005` con Let's Encrypt. Il proxy deve
inoltrare l'header `Host` originale (le Server Action di Next confrontano `Origin` e `Host`) e `X-Forwarded-Proto`.

La prima visita crea il primo admin da `/primo-accesso`: farla subito dopo il deploy.

Backup, da cron sull'host:
`docker exec prenota-db pg_dump -U prenota prenota | gzip > /percorso/prenota-$(date +%F).sql.gz`.

## HTTPS

In produzione il cookie di sessione è `Secure`: il login funziona solo via HTTPS (dominio pubblico), non con `http://IP:porta`.

Obbligatorio: senza HTTPS non funzionano Condividi, copia negli appunti e service worker, e il cookie `Secure` non viene
inviato (il login non entra). L'app sta dietro lo **stesso reverse proxy** usato per StageTrack, con certificato TLS:
il proxy deve puntare a `prenota-app:3000` (se condivide la rete Docker) o a `127.0.0.1:3001`, e inoltrare gli header
`Host` e `X-Forwarded-Proto`.

## Backup

`scripts/backup.sh` (da lanciare sull'homelab nella cartella del compose) esegue
`docker compose exec -T db pg_dump -U prenota prenota | gzip` e salva il risultato in `backups/prenota-AAAA-MM-GG.sql.gz`.
Scrive prima in un file temporaneo, lo verifica (gzip valido e non vuoto) e solo allora lo rinomina; i file più vecchi di 30 giorni si cancellano solo dopo un
backup riuscito. Se il dump fallisce lo script esce con errore (visibile nel log di cron) e non tocca i backup esistenti. Cron d'esempio, ogni notte alle 03:00:

```
0 3 * * * /srv/prenota/scripts/backup.sh >> /srv/prenota/backups/backup.log 2>&1
```

Ripristino su un database vuoto:
`gunzip -c backups/prenota-AAAA-MM-GG.sql.gz | docker compose exec -T db psql -U prenota prenota`.

## Aggiornare

1. sul proprio computer `npm run docker:deploy`;
2. sull'homelab `docker compose pull && docker compose up -d`;
3. le migrazioni dello schema partono da sole all'avvio del container (`db-init`, vedi [Database](08-database.md)).
   Prima di un aggiornamento che cambia lo schema conviene un backup.

## Copiare i dati dal computer all'homelab

Per portare in produzione i dati inseriti in locale (locali, opere con tariffe, eventi, prenotazioni). **Utenti e
sessioni non si copiano**: in produzione gli utenti si creano da `/primo-accesso` / Admin → Utenti, e le prenotazioni
copiate perdono «creata da». Il database di arrivo deve essere già allo schema attuale (basta che l'app aggiornata
sia partita almeno una volta).

1. Sul computer: `npm run -s db:esporta > dati.sql` (legge `DATABASE_URL` da `.env.local`). Il file contiene nomi e
   telefoni dei clienti: non metterlo nel repository e cancellarlo dopo l'uso.
2. Copiarlo sull'homelab (es. `scp dati.sql homelab:/tmp/`).
3. Sull'homelab, backup e poi caricamento in una transazione:
   `docker exec prenota-db pg_dump -U prenota prenota | gzip > /percorso/prima-della-copia.sql.gz`
   `docker exec -i prenota-db psql -U prenota -v ON_ERROR_STOP=1 prenota < /tmp/dati.sql`
   Se qualcosa non va, la transazione si annulla e il database resta com'era.
4. Ripetibile: le righe già presenti (stesso id) si saltano. Controllare in app che gli eventi abbiano lo stesso
   numero di prenotazioni e persone che in locale, poi cancellare `dati.sql`.


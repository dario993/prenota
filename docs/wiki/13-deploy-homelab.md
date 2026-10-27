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
docker compose up -d
```

Il servizio `app` esegue `node scripts/db-init.mjs && node server.js`: a ogni avvio crea lo schema e applica le
migrazioni (entrambi idempotenti), poi parte il server. Se `db-init` fallisce il server non parte.

Al primo accesso dal browser l'app chiede di creare il primo admin: non serve più `crea-admin`, che resta come recupero (`docker compose run --rm -e ADMIN_EMAIL=... -e ADMIN_NOME=... -e ADMIN_PASSWORD=... app node scripts/crea-admin.mjs`).

`db-init` si può rilanciare a mano (`docker compose run --rm app node scripts/db-init.mjs`): schema con `if not exists`,
migrazioni che non fanno nulla se già applicate.

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
4. Facoltativo: *GitOps updates* (polling) per ricostruire quando il ramo cambia; altrimenti *Pull and redeploy* a mano. L'app ha `pull_policy: build`: l'immagine `prenota-app` esiste solo sull'homelab, non si scarica
   mai e viene ricostruita a ogni deploy (senza, «Pull and redeploy» fallisce con «pull access denied for prenota-app»).
5. *Deploy the stack*. Il container dell'app esegue `node scripts/db-init.mjs && node server.js`: a ogni avvio applica
   lo schema (idempotente, solo `create ... if not exists`) e le migrazioni di `db/migrazioni/` (idempotenti: un
   database vecchio viene convertito, uno già aggiornato resta com'è), poi parte il server. L'app è sulla porta `3005` dell'host; per cambiarla aggiungi la variabile `PORTA` (es. `PORTA=8080`) nelle variabili d'ambiente dello stack e ridistribuisci.

HTTPS: nel reverse proxy punta `prenota.hsdscp.duckdns.org` a `http://IP-HOMELAB:3005` (o la `PORTA` scelta) con Let's Encrypt. Il proxy deve
inoltrare l'header `Host` originale (le Server Action di Next confrontano `Origin` e `Host`) e `X-Forwarded-Proto`.

La prima visita crea il primo admin da `/primo-accesso`: farla subito dopo il deploy.

Backup: vedi [Backup](#backup).

## HTTPS

In produzione il cookie di sessione è `Secure`: il login funziona solo via HTTPS (dominio pubblico), non con `http://IP:porta`.

Obbligatorio: senza HTTPS non funzionano Condividi, copia negli appunti e service worker, e il cookie `Secure` non viene
inviato (il login non entra). L'app sta dietro lo **stesso reverse proxy** usato per StageTrack, con certificato TLS:
il proxy deve puntare a `prenota-app:3000` (se condivide la rete Docker) o a `127.0.0.1:3001`, e inoltrare gli header
`Host` e `X-Forwarded-Proto`.

## Backup

`scripts/backup.sh` gira **ogni ora** da cron nell'LXC 106 ed esegue `pg_dump | gzip` (solo lettura del database).
Scrive prima in un file temporaneo, lo verifica (gzip valido e non vuoto) e solo allora lo rinomina; se il dump fallisce
esce con errore e non tocca i backup esistenti.

Rotazione (in `backups/` e uguale su Google Drive):

- alle 00 (ora italiana) `prenota-giorno-AAAA-MM-GG.sql.gz`: si tengono gli ultimi 7 giorni;
- nelle altre ore `prenota-ora-AAAA-MM-GG-HH.sql.gz`: si tengono le ultime 24 ore.

I vecchi file si cancellano solo dopo un backup riuscito. Variabili facoltative:

- `DUMP_CMD`: con Portainer non c'è la cartella del compose, quindi `docker exec prenota-db pg_dump -U prenota prenota`;
- `BACKUP_REMOTE`: remote rclone su cui copiare ogni backup (`prenota-crypt:`), con la stessa rotazione
  (`rclone copy` + `rclone delete`, mai `rclone sync`, che svuoterebbe il Drive se `backups/` andasse persa);
- `BACKUP_PING_URL`: webhook n8n chiamato con `esito=ok` o `esito=errore`.

### Google Drive cifrato (rclone)

Nell'LXC 106: `apt install rclone curl`, poi `rclone config`:

1. remote `gdrive` di tipo Google Drive (il token si ottiene sul Mac con `rclone authorize "drive"` e si incolla);
2. remote `prenota-crypt` di tipo **crypt** su `gdrive:prenota-backup` (i dati contengono nomi e telefoni).
   **Password e salt del crypt vanno nel password manager: senza, i backup sono illeggibili.**

Cron (`crontab -e` nell'LXC):

```
0 * * * * DUMP_CMD="docker exec prenota-db pg_dump -U prenota prenota" BACKUP_REMOTE=prenota-crypt: BACKUP_PING_URL=https://n8n.hsdscp.duckdns.org/webhook/prenota-backup-7f3c9a2e5d /srv/prenota/scripts/backup.sh >> /srv/prenota/backups/backup.log 2>&1
```

### Avviso (n8n)

Workflow n8n «Prenota — controllo backup»: il webhook registra ogni esito; **ogni giorno alle 9:00** manda un solo
messaggio Telegram (bot teatro) se nelle 24 ore precedenti ci sono stati errori o se l'ultimo backup riuscito ha più
di 2 ore. Se va tutto bene non scrive nulla.

### Ripristino

Da un backup locale su un database vuoto:
`gunzip -c backups/prenota-giorno-AAAA-MM-GG.sql.gz | docker exec -i prenota-db psql -U prenota prenota`.

Da Google Drive (sul Mac, con lo stesso remote `prenota-crypt` configurato): `rclone copy prenota-crypt:<file> .`,
poi `createdb prenota_prova && gunzip -c <file> | psql prenota_prova` e confronto dei conteggi con la produzione
(solo `select` via `/api/sql`). Conviene provarlo una volta al mese.

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


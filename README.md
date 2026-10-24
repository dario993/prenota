# Prenota

Web app mobile-first per le prenotazioni degli spettacoli teatrali (locali, opere, eventi, prenotazioni con pacchetti
ristorante, uso offline). Next.js 16 + Postgres, interfaccia in italiano.

## Avvio in locale

```bash
createdb prenota
cp .env.example .env.local
npm install
npm run db:init
npm run dev
```

Con il database vuoto l'app, al primo accesso, chiede di creare il primo admin. `npm run crea-admin`
(`ADMIN_EMAIL=... ADMIN_NOME=... ADMIN_PASSWORD=...`) serve solo per il recupero: reimpostare la password di un admin
o crearne un altro.

## Deploy

Immagine Docker su ghcr (`npm run docker:deploy`) e `docker-compose.yml` sull'homelab, dietro HTTPS.
Dettagli in [docs/wiki/13-deploy-homelab.md](docs/wiki/13-deploy-homelab.md).

## Documentazione

Wiki completa: [docs/wiki/README.md](docs/wiki/README.md).

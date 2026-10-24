# Prenota

Web app mobile-first per le prenotazioni degli spettacoli teatrali (locali, opere, eventi, prenotazioni con pacchetti
ristorante, uso offline). Next.js 16 + Postgres, interfaccia in italiano.

## Avvio in locale

```bash
createdb prenota
cp .env.example .env.local
npm install
npm run db:init
ADMIN_EMAIL=... ADMIN_NOME=... ADMIN_PASSWORD=... npm run crea-admin
npm run dev
```

## Deploy

Immagine Docker su ghcr (`npm run docker:deploy`) e `docker-compose.yml` sull'homelab, dietro HTTPS.
Dettagli in [docs/wiki/13-deploy-homelab.md](docs/wiki/13-deploy-homelab.md).

## Documentazione

Wiki completa: [docs/wiki/README.md](docs/wiki/README.md).

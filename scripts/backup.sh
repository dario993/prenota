#!/bin/sh
# Backup giornaliero di Postgres (da lanciare nella cartella del compose). Tiene 30 giorni.
set -e
cd "$(dirname "$0")/.."
mkdir -p backups
docker compose exec -T db pg_dump -U prenota prenota | gzip > "backups/prenota-$(date +%F).sql.gz"
find backups -name 'prenota-*.sql.gz' -mtime +30 -delete

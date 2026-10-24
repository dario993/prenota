#!/usr/bin/env bash
# Backup giornaliero di Postgres (da lanciare ovunque: entra nella cartella del compose). Tiene 30 giorni.
# Il file finale compare solo se il dump è riuscito; i vecchi backup si cancellano solo dopo.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p backups
dest="backups/prenota-$(date +%F).sql.gz"
tmp="$dest.tmp"
trap 'rm -f "$tmp"' EXIT
# DUMP_CMD serve solo ai test dello script
${DUMP_CMD:-docker compose exec -T db pg_dump -U prenota prenota} | gzip > "$tmp"
gzip -t "$tmp"
[ "$(gzip -dc "$tmp" | wc -c)" -gt 100 ] || { echo "Backup vuoto o troppo piccolo" >&2; exit 1; }
mv "$tmp" "$dest"
find backups -name 'prenota-*.sql.gz' -mtime +30 -delete

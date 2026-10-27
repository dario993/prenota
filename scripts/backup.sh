#!/usr/bin/env bash
# Backup orario di Postgres (da cron, ogni ora). Tiene i backup delle ultime 24 ore e solo quello di mezzanotte
# degli ultimi 7 giorni, in backups/ e, se BACKUP_REMOTE è impostato, anche su quel remote rclone (Google Drive cifrato).
# Il file finale compare solo se il dump è riuscito; i vecchi backup si cancellano solo dopo.
# BACKUP_PING_URL (facoltativo): webhook n8n chiamato con esito=ok o esito=errore.
set -euo pipefail
cd "$(dirname "$0")/.."

ping() {
  [ -z "${BACKUP_PING_URL:-}" ] && return 0
  curl -fsS -m 20 -G "$BACKUP_PING_URL" --data-urlencode "esito=$1" --data-urlencode "file=${2:-}" > /dev/null || true
}

mkdir -p backups
if [ "$(TZ=Europe/Rome date +%H)" = 00 ]; then
  nome="prenota-giorno-$(TZ=Europe/Rome date +%F).sql.gz"
else
  nome="prenota-ora-$(TZ=Europe/Rome date +%F-%H).sql.gz"
fi
dest="backups/$nome"
tmp="$dest.tmp"
trap 'st=$?; rm -f "$tmp"; [ $st -eq 0 ] || ping errore "$nome"' EXIT

# DUMP_CMD e RCLONE_CMD servono a Portainer (niente cartella del compose) e alle prove dello script
${DUMP_CMD:-docker compose exec -T db pg_dump -U prenota prenota} | gzip > "$tmp"
gzip -t "$tmp"
[ "$(gzip -dc "$tmp" | wc -c)" -gt 100 ] || { echo "Backup vuoto o troppo piccolo" >&2; exit 1; }
mv "$tmp" "$dest"

find backups -name 'prenota-ora-*.sql.gz' -mmin +1440 -delete
find backups -name 'prenota-giorno-*.sql.gz' -mmin +$((7 * 1440)) -delete

if [ -n "${BACKUP_REMOTE:-}" ]; then
  rclone=${RCLONE_CMD:-rclone}
  $rclone copy "$dest" "$BACKUP_REMOTE"
  # niente «rclone sync»: se backups/ andasse persa cancellerebbe anche il remote
  $rclone delete "$BACKUP_REMOTE" --include 'prenota-ora-*.sql.gz' --min-age 24h
  $rclone delete "$BACKUP_REMOTE" --include 'prenota-giorno-*.sql.gz' --min-age 7d
fi

ping ok "$nome"

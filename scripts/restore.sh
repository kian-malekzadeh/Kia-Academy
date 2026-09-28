#!/usr/bin/env bash
# =============================================================================
# Kia Academy — restore from a backup created by scripts/backup.sh
#
#   ./scripts/restore.sh <db_dump_file> [uploads_archive]
#
#   ./scripts/restore.sh backups/db-20260928-030000.dump
#   ./scripts/restore.sh backups/db-20260928-030000.dump backups/uploads-20260928-030000.tar.gz
#
# ⚠️  DESTRUCTIVE: REPLACES the current database content with the dump.
#     The api container is stopped first (prisma migrate deploy on boot will
#     bring the schema to the dump level) and restarted at the end.
# =============================================================================
set -euo pipefail

DB_FILE="${1:-}"
UPLOADS_FILE="${2:-}"

if [ -z "$DB_FILE" ] || [ ! -f "$DB_FILE" ]; then
  echo "Usage: $0 <db_dump_file> [uploads_archive]" >&2
  exit 1
fi

cd "$(dirname "$0")/.."

echo "⚠️  This will OVERWRITE the current database with: $DB_FILE"
if [ -n "$UPLOADS_FILE" ]; then
  echo "⚠️  and REPLACE the uploads volume with: $UPLOADS_FILE"
fi
printf "Type the database name to confirm [kia_academy]: "
read -r CONFIRM
[ "$CONFIRM" = "kia_academy" ] || { echo "Aborted."; exit 1; }

API_CID="$(docker compose ps -q api || true)"
if [ -n "$API_CID" ]; then
  echo "[restore] stopping api container…"
  docker compose stop api
fi

echo "[restore] dropping and recreating database…"
docker compose exec -T postgres psql -U "${POSTGRES_USER:-kia_academy}" -d postgres -v ON_ERROR_STOP=1 <<SQL
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'kia_academy' AND pid <> pg_backend_pid();
DROP DATABASE IF EXISTS kia_academy;
CREATE DATABASE kia_academy OWNER "${POSTGRES_USER:-kia_academy}";
SQL

echo "[restore] restoring $DB_FILE…"
docker compose exec -T postgres pg_restore \
  -U "${POSTGRES_USER:-kia_academy}" \
  -d kia_academy \
  --no-owner \
  --no-privileges < "$DB_FILE"

if [ -n "$UPLOADS_FILE" ]; then
  if [ ! -f "$UPLOADS_FILE" ]; then
    echo "WARN: uploads archive '$UPLOADS_FILE' not found — skipping." >&2
  else
    echo "[restore] restoring uploads volume…"
    docker run --rm \
      -v kia-academy_api-uploads:/to \
      -v "$(cd "$(dirname "$UPLOADS_FILE")" && pwd)":/from:ro \
      alpine sh -c "rm -rf /to/* && tar xzf /from/$(basename "$UPLOADS_FILE") -C /to"
  fi
fi

if [ -n "$API_CID" ]; then
  echo "[restore] restarting api container…"
  docker compose start api
fi

echo "[restore] done."

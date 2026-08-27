#!/bin/sh
# =============================================================================
# Kia Academy API container entrypoint
#   1. wait for PostgreSQL reachability           (bounded, configurable)
#   2. apply Prisma migrations                    (`migrate deploy` — non-destructive)
#   3. optional seed                              (SEED_DATABASE=true — dev only)
#   4. exec Node server as PID                    (signals forwarded correctly)
# =============================================================================
set -eu

cd /app/apps/api

DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-kia_academy}"
MAX_ATTEMPTS="${DB_WAIT_ATTEMPTS:-60}"

PRISMA_BIN="node_modules/.bin/prisma"

echo "[entrypoint] Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT}…"
attempt=0
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" >/dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge "$MAX_ATTEMPTS" ]; then
    echo "[entrypoint] ERROR: PostgreSQL unreachable after ${MAX_ATTEMPTS} attempts." >&2
    exit 1
  fi
  sleep 2
done
echo "[entrypoint] PostgreSQL is ready."

echo "[entrypoint] Applying migrations (prisma migrate deploy)…"
"$PRISMA_BIN" migrate deploy

if [ "${SEED_DATABASE:-false}" = "true" ]; then
  echo "[entrypoint] Seeding database (SEED_DATABASE=true)…"
  "$PRISMA_BIN" db seed
fi

echo "[entrypoint] Starting Kia Academy API on port ${PORT:-3001}…"
exec node dist/main.js

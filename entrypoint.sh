#!/bin/sh
set -e

# Если заданы отдельные DB_* переменные — собираем DATABASE_URL с URL-кодированием пароля
if [ -n "$DB_HOST" ] && [ -n "$DB_USER" ] && [ -n "$DB_PASSWORD" ]; then
  DB_PORT="${DB_PORT:-5432}"
  DB_NAME="${DB_NAME:-default_db}"

  # URL-encode пароля через node (экранирует все спецсимволы)
  ENCODED_PASSWORD=$(node -e "process.stdout.write(encodeURIComponent(process.env.DB_PASSWORD))")

  export DATABASE_URL="postgresql://${DB_USER}:${ENCODED_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"
  echo "DATABASE_URL constructed from DB_* variables"
fi

echo "Running migrations..."
npx prisma migrate deploy || echo "Migration failed or already up to date"

echo "Starting server..."
exec node dist/src/main

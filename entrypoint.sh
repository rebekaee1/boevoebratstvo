#!/bin/sh
set -e

# Если заданы отдельные DB_* переменные — собираем DATABASE_URL с URL-кодированием пароля
if [ -n "$DB_HOST" ] && [ -n "$DB_USER" ] && [ -n "$DB_PASSWORD" ]; then
  DB_PORT="${DB_PORT:-5432}"
  DB_NAME="${DB_NAME:-default_db}"

  # URL-encode пароля через node (экранирует все спецсимволы)
  ENCODED_PASSWORD=$(node -e "process.stdout.write(encodeURIComponent(process.env.DB_PASSWORD))")

  # connection_limit и pool_timeout для Timeweb managed DB (убивает idle соединения)
  export DATABASE_URL="postgresql://${DB_USER}:${ENCODED_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public&connection_limit=5&pool_timeout=20&connect_timeout=30"
  echo "DATABASE_URL constructed from DB_* variables"
fi

echo "Running migrations..."
npx prisma migrate deploy || echo "Migration warning (may already be up to date)"

echo "Seeding database (admin + default settings)..."
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function seed() {
  // 1. Создаём администратора
  const email = process.env.ADMIN_EMAIL || 'admin@nasledniki-pobedy.ru';
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    const hash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        email,
        passwordHash: hash,
        fullName: 'Администратор Системы',
        role: 'admin',
        school: 'Администрация',
        grade: '-',
        privacyAccepted: true,
      },
    });
    console.log('Admin created:', email);
  } else {
    console.log('Admin already exists:', email);
  }

  // 2. Настройки по умолчанию
  const deadline = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  const settings = [
    { key: 'submission_deadline', value: deadline.toISOString() },
    { key: 'rating_scale', value: { min: 1, max: 10 } },
  ];
  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }
  console.log('Default settings ensured');
}

seed()
  .catch(e => console.error('Seed error:', e.message))
  .finally(() => prisma.\$disconnect());
" || echo "Seed completed with warnings"

echo "Starting server..."
exec node dist/src/main

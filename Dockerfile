# ============================================
# Backend — Наследники Победы (NestJS)
# Multi-stage build для оптимального размера
# ============================================

# --- Stage 1: Build ---
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем файлы зависимостей
COPY backend/package.json backend/package-lock.json ./
COPY backend/prisma ./prisma/

# Устанавливаем зависимости
RUN npm ci

# Генерируем Prisma Client
RUN npx prisma generate

# Копируем исходный код backend
COPY backend/ ./

# Собираем приложение
RUN npm run build

# --- Stage 2: Production ---
FROM node:20-alpine AS production

WORKDIR /app

# Копируем package.json из backend
COPY backend/package.json backend/package-lock.json ./
COPY backend/prisma ./prisma/

RUN npm ci --only=production

# Генерируем Prisma Client для production
RUN npx prisma generate

# Копируем собранное приложение
COPY --from=builder /app/dist ./dist

# Порт приложения
EXPOSE 3000

# Запуск: миграции + seed + сервер
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed || true && node dist/main"]

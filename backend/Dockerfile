# ============================================
# Backend — Наследники Победы (NestJS)
# Multi-stage build для оптимального размера
# ============================================

# --- Stage 1: Build ---
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем файлы зависимостей
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Устанавливаем зависимости
RUN npm ci

# Генерируем Prisma Client
RUN npx prisma generate

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build
RUN ls -la dist/src/main.js
RUN npm prune --omit=dev

# --- Stage 2: Production ---
FROM node:20-alpine AS production

WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma/
COPY --from=builder /app/node_modules ./node_modules/
COPY --from=builder /app/dist ./dist/

# Порт приложения
EXPOSE 3000

# Запуск сервера (при использовании с entrypoint.sh)
CMD ["node", "dist/src/main"]

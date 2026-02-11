# ============================================
# Backend — Наследники Победы (NestJS)
# ============================================

FROM node:20-alpine AS builder

WORKDIR /app

# Копируем файлы зависимостей из backend/
COPY backend/package.json backend/package-lock.json ./
COPY backend/prisma ./prisma/

# Устанавливаем ВСЕ зависимости (включая dev для сборки)
RUN npm ci

# Генерируем Prisma Client
RUN npx prisma generate

# Копируем исходный код backend
COPY backend/ ./

# Собираем приложение
RUN npm run build

# Проверяем что dist собрался правильно
RUN ls -la dist/src/main.js

# Удаляем dev-зависимости после сборки
RUN npm prune --omit=dev

# --- Stage 2: Production ---
FROM node:20-alpine AS production

WORKDIR /app

# Копируем всё что нужно из builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma/
COPY --from=builder /app/node_modules ./node_modules/
COPY --from=builder /app/dist ./dist/

# Порт приложения
EXPOSE 3000

# Запуск: миграции → сервер
# Путь: dist/src/main.js (NestJS сохраняет структуру каталогов при сборке)
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main"]

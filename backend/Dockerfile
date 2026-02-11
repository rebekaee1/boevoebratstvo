# ============================================
# Backend — Наследники Победы (NestJS)
# ============================================

FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma/

RUN npm ci
RUN npx prisma generate

COPY . .

RUN npm run build

# Проверяем что dist собрался правильно
RUN ls -la dist/src/main.js

# Удаляем dev-зависимости
RUN npm prune --omit=dev

# --- Stage 2: Production ---
FROM node:20-alpine AS production

WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma/
COPY --from=builder /app/node_modules ./node_modules/
COPY --from=builder /app/dist ./dist/

EXPOSE 3000

# Путь: dist/src/main.js (NestJS сохраняет структуру каталогов)
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main"]

# ============================================
# Frontend — Наследники Победы (React + Vite)
# Multi-stage build: сборка → nginx
# ============================================

# --- Stage 1: Build ---
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем файлы зависимостей
COPY package.json package-lock.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем исходный код
COPY . .

# Аргумент для API URL (передаётся при сборке)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Собираем приложение
RUN npm run build

# --- Stage 2: Nginx ---
FROM nginx:alpine AS production

# Копируем конфиг nginx для SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Копируем собранное приложение
COPY --from=builder /app/dist /usr/share/nginx/html

# Порт
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

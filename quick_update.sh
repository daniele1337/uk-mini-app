#!/bin/bash

echo "🚀 Быстрое обновление проекта"
echo "============================="

# Директория проекта
PROJECT_DIR="/var/www/uk-mini-app"

# Проверяем существование директории
if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ Директория проекта не найдена: $PROJECT_DIR"
    exit 1
fi

# Переходим в директорию проекта
cd "$PROJECT_DIR"

echo "📥 Получаем изменения с GitHub..."
git fetch origin

# Проверяем изменения
LOCAL_COMMIT=$(git rev-parse HEAD)
REMOTE_COMMIT=$(git rev-parse origin/main)

if [ "$LOCAL_COMMIT" = "$REMOTE_COMMIT" ]; then
    echo "✅ Изменений не найдено"
    exit 0
fi

echo "📝 Найдены изменения, обновляем..."

# Останавливаем PM2 процессы
echo "🛑 Останавливаем сервисы..."
pm2 stop uk-mini-app-backend 2>/dev/null
pm2 stop uk-mini-app-frontend 2>/dev/null

# Обновляем код
echo "📥 Обновляем код..."
git reset --hard origin/main
git clean -fd

# Обновляем зависимости
echo "📦 Обновляем зависимости..."

# Backend
if [ -f "backend/requirements.txt" ]; then
    cd backend
    pip3 install -r requirements.txt --upgrade
    cd ..
fi

# Frontend
if [ -f "frontend/package.json" ]; then
    cd frontend
    npm install --production
    npm run build
    cd ..
fi

# Запускаем сервисы
echo "🚀 Запускаем сервисы..."
pm2 start ecosystem.config.js
pm2 save

echo "✅ Обновление завершено!"
echo "📊 Статус PM2:"
pm2 status

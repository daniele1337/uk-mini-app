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
pm2 stop all

# Обновляем код
echo "📥 Обновляем код..."
git reset --hard origin/main
git clean -fd

# Обновляем зависимости
echo "📦 Обновляем зависимости..."

# Backend
pip3 install -r requirements.txt --upgrade

# Frontend - полная переустановка
rm -rf node_modules package-lock.json
npm install
npm install -g vite http-server
npm run build

# Создаем директорию instance если её нет
echo "📁 Создаем директорию instance..."
mkdir -p /var/www/uk-mini-app/instance

# Исправляем права доступа к базе данных
echo "🔧 Исправляем права доступа к базе данных..."
sudo chown -R www-data:www-data /var/www/uk-mini-app/instance/
sudo chmod -R 755 /var/www/uk-mini-app/instance/
if [ -f /var/www/uk-mini-app/instance/uk_mini_app.db ]; then
    sudo chmod 666 /var/www/uk-mini-app/instance/uk_mini_app.db
fi

# Запускаем сервисы
echo "🚀 Запускаем сервисы..."
pm2 start ecosystem.config.js
pm2 save

# Запускаем Telegram бота
echo "🤖 Запускаем Telegram бота..."
pm2 start telegram_bot.py --name telegram-bot
pm2 save

echo "✅ Обновление завершено!"
echo "📊 Статус PM2:"
pm2 status

# Проверяем, что все работает
echo "🔍 Проверяем работоспособность..."
sleep 3

# Проверяем API
if curl -s https://24autoflow.ru/api/health > /dev/null; then
    echo "✅ API работает"
else
    echo "⚠️ API недоступен"
fi

# Проверяем webhook
if curl -s https://24autoflow.ru/webhook/telegram > /dev/null; then
    echo "✅ Webhook работает"
else
    echo "⚠️ Webhook недоступен"
fi

echo "🎉 Все сервисы запущены!"

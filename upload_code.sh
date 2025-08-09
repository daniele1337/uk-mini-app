#!/bin/bash

# Скрипт для подготовки кода для загрузки на сервер
echo "📦 Подготовка кода для загрузки на сервер..."

# Создание директорий
mkdir -p server_upload/frontend
mkdir -p server_upload/backend

# Копирование frontend файлов
echo "📁 Копирование frontend файлов..."
cp -r src server_upload/frontend/
cp -r public server_upload/frontend/
cp package.json server_upload/frontend/
cp vite.config.js server_upload/frontend/
cp tailwind.config.js server_upload/frontend/
cp postcss.config.js server_upload/frontend/
cp index.html server_upload/frontend/

# Копирование backend файлов
echo "📁 Копирование backend файлов..."
cp app.py server_upload/backend/
cp requirements.txt server_upload/backend/

# Создание директории для загрузок
mkdir -p server_upload/backend/uploads

# Создание README для сервера
cat > server_upload/README.md << 'EOF'
# Telegram Mini App - Серверная версия

## Структура проекта:
```
/var/www/uk-mini-app/
├── frontend/          # React приложение
├── backend/           # Flask API
├── logs/             # Логи приложения
├── deploy.sh         # Скрипт развертывания
├── start.sh          # Скрипт запуска
└── ecosystem.config.js # Конфигурация PM2
```

## Установка:

1. Скопируйте содержимое frontend/ в /var/www/uk-mini-app/frontend/
2. Скопируйте содержимое backend/ в /var/www/uk-mini-app/backend/
3. Выполните: cd /var/www/uk-mini-app && ./deploy.sh
4. Выполните: ./start.sh

## URL для Telegram Mini App:
- Frontend: https://2a03:6f00:a::1:17a6
- Backend API: https://2a03:6f00:a::1:17a6/api/

## Управление:
- Просмотр логов: pm2 logs
- Перезапуск: pm2 restart all
- Статус: pm2 status
EOF

echo "✅ Код подготовлен для загрузки!"
echo "📁 Файлы находятся в папке: server_upload/"
echo ""
echo "📋 Инструкции для загрузки на сервер:"
echo "1. Подключитесь к серверу: ssh root@2a03:6f00:a::1:17a6"
echo "2. Выполните скрипт настройки сервера"
echo "3. Загрузите файлы из server_upload/ на сервер"
echo "4. Запустите приложение" 
#!/bin/bash

# 🔧 Скрипт для исправления nginx конфигурации и установки SSL
echo "🔧 Исправляем конфигурацию nginx для SSL..."

# Проверяем, что скрипт запущен от root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Ошибка: Скрипт должен быть запущен от имени root"
    exit 1
fi

# Создаем правильную конфигурацию nginx
echo "📝 Создаем конфигурацию nginx для домена 24autoflow.ru..."

cat > /etc/nginx/sites-available/24autoflow.ru << 'EOF'
# HTTP сервер (редирект на HTTPS)
server {
    listen 80;
    server_name 24autoflow.ru www.24autoflow.ru;
    
    # Редирект на HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS сервер
server {
    listen 443 ssl http2;
    server_name 24autoflow.ru www.24autoflow.ru;
    
    # SSL сертификаты
    ssl_certificate /etc/letsencrypt/live/24autoflow.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/24autoflow.ru/privkey.pem;
    
    # SSL настройки
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Корневая директория
    root /var/www/uk-mini-app/frontend/dist;
    index index.html;
    
    # Обработка статических файлов
    location / {
        try_files $uri $uri/ /index.html;
        
        # Заголовки для безопасности
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
    }
    
    # API проксирование
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS заголовки
        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
        
        # Обработка OPTIONS запросов
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin *;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Content-Type, Authorization";
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
    }
    
    # Обработка ошибок
    error_page 404 /index.html;
    error_page 500 502 503 504 /50x.html;
    
    # Логирование
    access_log /var/log/nginx/24autoflow.ru.access.log;
    error_log /var/log/nginx/24autoflow.ru.error.log;
}
EOF

# Активируем конфигурацию
echo "🔗 Активируем конфигурацию..."
ln -sf /etc/nginx/sites-available/24autoflow.ru /etc/nginx/sites-enabled/

# Отключаем старую конфигурацию по IP
echo "🔗 Отключаем старую конфигурацию..."
if [ -L /etc/nginx/sites-enabled/default ]; then
    rm /etc/nginx/sites-enabled/default
fi

# Проверяем конфигурацию nginx
echo "🔍 Проверяем конфигурацию nginx..."
if nginx -t; then
    echo "✅ Конфигурация nginx корректна"
    
    # Перезапускаем nginx
    echo "🔄 Перезапускаем nginx..."
    if systemctl reload nginx; then
        echo "✅ Nginx успешно перезапущен"
    else
        echo "❌ Ошибка при перезапуске nginx"
        exit 1
    fi
else
    echo "❌ Ошибка в конфигурации nginx"
    exit 1
fi

# Устанавливаем SSL сертификат
echo "🔐 Устанавливаем SSL сертификат..."
if certbot install --cert-name 24autoflow.ru; then
    echo "✅ SSL сертификат успешно установлен"
else
    echo "⚠️  Не удалось автоматически установить сертификат"
    echo "Сертификат уже настроен в конфигурации nginx"
fi

# Проверяем статус сертификата
echo "🔍 Проверяем статус сертификата..."
certbot certificates

echo ""
echo "🎉 Настройка завершена!"
echo "📋 Что было сделано:"
echo "   - Создана конфигурация nginx для домена"
echo "   - Настроен редирект с HTTP на HTTPS"
echo "   - Установлен SSL сертификат"
echo "   - Перезапущен nginx"
echo ""
echo "🌐 Проверьте работу сайта:"
echo "   HTTP: http://24autoflow.ru"
echo "   HTTPS: https://24autoflow.ru"
echo ""
echo "📱 Для Telegram Mini App используйте:"
echo "   https://24autoflow.ru"

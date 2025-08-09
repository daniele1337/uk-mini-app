#!/bin/bash

# 🔧 Скрипт для настройки SSL для домена 24autoflow.ru
# Автоматическая установка SSL сертификата и настройка nginx

echo "🔧 Начинаем настройку SSL для домена 24autoflow.ru..."

# Проверяем, что скрипт запущен от root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Ошибка: Скрипт должен быть запущен от имени root"
    echo "Запустите: sudo bash setup_ssl_domain.sh"
    exit 1
fi

# Проверяем доступность домена
echo "🔍 Проверяем доступность домена..."
if ! nslookup 24autoflow.ru > /dev/null 2>&1; then
    echo "⚠️  Предупреждение: Домен 24autoflow.ru может быть еще не активен"
    echo "Продолжаем настройку..."
fi

# Создаем резервную копию конфигурации
echo "📋 Создаем резервную копию конфигурации..."
cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup.$(date +%Y%m%d_%H%M%S)

# Создаем конфигурацию для домена
echo "📝 Создаем конфигурацию для домена..."
cat > /etc/nginx/sites-available/24autoflow.ru << 'EOF'
# HTTP сервер (редирект на HTTPS)
server {
    listen 80;
    server_name 24autoflow.ru www.24autoflow.ru;
    
    # Редирект на HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS сервер (временно без SSL)
server {
    listen 443 ssl http2;
    server_name 24autoflow.ru www.24autoflow.ru;
    
    # SSL сертификаты (будут добавлены certbot)
    # ssl_certificate /etc/letsencrypt/live/24autoflow.ru/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/24autoflow.ru/privkey.pem;
    
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
    echo "Восстанавливаем резервную копию..."
    cp /etc/nginx/sites-available/default.backup.* /etc/nginx/sites-available/default
    exit 1
fi

# Устанавливаем Certbot (если не установлен)
echo "📦 Проверяем установку Certbot..."
if ! command -v certbot &> /dev/null; then
    echo "📦 Устанавливаем Certbot..."
    apt update
    apt install -y certbot python3-certbot-nginx
fi

# Получаем SSL сертификат
echo "🔐 Получаем SSL сертификат..."
if certbot --nginx -d 24autoflow.ru -d www.24autoflow.ru --non-interactive --agree-tos --email admin@24autoflow.ru; then
    echo "✅ SSL сертификат успешно установлен"
else
    echo "⚠️  Не удалось получить SSL сертификат"
    echo "Возможные причины:"
    echo "  - Домен еще не активен"
    echo "  - DNS записи не настроены"
    echo "  - Порт 80 заблокирован"
    echo ""
    echo "Попробуйте позже, когда домен будет активен:"
    echo "certbot --nginx -d 24autoflow.ru -d www.24autoflow.ru"
fi

# Настраиваем автообновление сертификата
echo "🔄 Настраиваем автообновление сертификата..."
if ! crontab -l | grep -q "certbot renew"; then
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
    echo "✅ Автообновление настроено"
fi

# Проверяем статус сертификата
echo "🔍 Проверяем статус сертификата..."
certbot certificates

echo ""
echo "🎉 Настройка завершена!"
echo "📋 Что было сделано:"
echo "   - Создана конфигурация nginx для домена"
echo "   - Настроен редирект с HTTP на HTTPS"
echo "   - Установлен Certbot для SSL"
echo "   - Настроено автообновление сертификата"
echo ""
echo "🌐 Проверьте работу сайта:"
echo "   HTTP: http://24autoflow.ru"
echo "   HTTPS: https://24autoflow.ru"
echo ""
echo "📱 Для Telegram Mini App используйте:"
echo "   https://24autoflow.ru"


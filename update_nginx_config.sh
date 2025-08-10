#!/bin/bash

echo "🔧 Обновление конфигурации nginx для Telegram webhook"
echo "=================================================="

# Создаем резервную копию текущей конфигурации
echo "📦 Создание резервной копии..."
cp /etc/nginx/sites-available/24autoflow.ru /etc/nginx/sites-available/24autoflow.ru.backup.$(date +%Y%m%d-%H%M%S)

# Копируем новую конфигурацию
echo "📝 Копирование новой конфигурации..."
cp nginx_24autoflow.conf /etc/nginx/sites-available/24autoflow.ru

# Проверяем конфигурацию
echo "🔍 Проверка конфигурации nginx..."
if nginx -t; then
    echo "✅ Конфигурация корректна"
    
    # Перезагружаем nginx
    echo "🔄 Перезагрузка nginx..."
    systemctl reload nginx
    
    if [ $? -eq 0 ]; then
        echo "✅ Nginx успешно перезагружен"
        echo "🌐 Webhook URL: https://24autoflow.ru/webhook/telegram"
        echo "📱 Telegram бот должен теперь отвечать на сообщения"
    else
        echo "❌ Ошибка перезагрузки nginx"
        exit 1
    fi
else
    echo "❌ Ошибка в конфигурации nginx"
    echo "🔄 Восстановление резервной копии..."
    cp /etc/nginx/sites-available/24autoflow.ru.backup.* /etc/nginx/sites-available/24autoflow.ru
    exit 1
fi

echo "🎉 Обновление завершено!"

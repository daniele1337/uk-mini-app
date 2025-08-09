#!/bin/bash

echo "🤖 Настройка Telegram Bot для уведомлений"
echo "=========================================="

# Проверяем, есть ли уже токен
if [ -f ".env" ] && grep -q "TELEGRAM_BOT_TOKEN" .env; then
    echo "✅ Токен бота уже настроен в .env файле"
    echo "Текущий токен: $(grep TELEGRAM_BOT_TOKEN .env | cut -d'=' -f2)"
else
    echo "📝 Токен бота уже настроен:"
    echo "Токен: 8172377647:AAE6MS5TBL-tZKBWs1A3WPECef48cl_SgnU"
    BOT_TOKEN="8172377647:AAE6MS5TBL-tZKBWs1A3WPECef48cl_SgnU"
    
    if [ -n "$BOT_TOKEN" ]; then
        # Создаем .env файл
        echo "TELEGRAM_BOT_TOKEN=$BOT_TOKEN" > .env
        echo "✅ Токен сохранен в .env файле"
        
        # Также устанавливаем переменную окружения
        export TELEGRAM_BOT_TOKEN="$BOT_TOKEN"
        echo "✅ Переменная окружения установлена"
        
        # Тестируем подключение
        echo "🧪 Тестируем подключение к боту..."
        RESPONSE=$(curl -s "https://api.telegram.org/bot$BOT_TOKEN/getMe")
        
        if echo "$RESPONSE" | grep -q '"ok":true'; then
            BOT_NAME=$(echo "$RESPONSE" | grep -o '"first_name":"[^"]*"' | cut -d'"' -f4)
            BOT_USERNAME=$(echo "$RESPONSE" | grep -o '"username":"[^"]*"' | cut -d'"' -f4)
            echo "✅ Подключение успешно!"
            echo "🤖 Имя бота: $BOT_NAME"
            echo "👤 Username: @$BOT_USERNAME"
        else
            echo "❌ Ошибка подключения к боту"
            echo "Проверьте правильность токена"
        fi
    else
        echo "❌ Токен не введен"
        exit 1
    fi
fi

echo ""
echo "📋 Следующие шаги:"
echo "1. Перезапустите сервер: python app.py"
echo "2. Перейдите в админ-панель"
echo "3. Откройте раздел 'Уведомления'"
echo "4. Нажмите 'Тестировать бота'"
echo "5. Проверьте получение тестового сообщения"
echo ""
echo "🎉 Готово! Теперь ваш бот может отправлять уведомления"

#!/bin/bash

echo "🤖 Запуск Telegram бота для QR-авторизации"
echo "=========================================="

# Проверяем, что мы в правильной директории
if [ ! -f "telegram_bot.py" ]; then
    echo "❌ Файл telegram_bot.py не найден"
    echo "Перейдите в директорию проекта"
    exit 1
fi

# Проверяем зависимости
echo "📦 Проверяем зависимости..."
python3 -c "import requests, flask" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "❌ Отсутствуют необходимые зависимости"
    echo "Установите: pip3 install requests flask"
    exit 1
fi

# Останавливаем предыдущий процесс бота если он запущен
echo "⏹️ Останавливаем предыдущий процесс бота..."
pkill -f "telegram_bot.py" 2>/dev/null

# Запускаем бота в фоне
echo "🚀 Запускаем бота..."
nohup python3 telegram_bot.py > bot.log 2>&1 &

# Ждем немного для запуска
sleep 3

# Проверяем, что бот запустился
if pgrep -f "telegram_bot.py" > /dev/null; then
    echo "✅ Бот успешно запущен!"
    echo "📋 Информация:"
    echo "• PID: $(pgrep -f 'telegram_bot.py')"
    echo "• Логи: bot.log"
    echo "• Webhook: https://24autoflow.ru/webhook/telegram"
    echo ""
    echo "🔍 Для просмотра логов: tail -f bot.log"
    echo "🛑 Для остановки: pkill -f 'telegram_bot.py'"
    echo ""
    echo "🎉 Бот готов к работе!"
    echo "📱 Теперь QR-авторизация должна работать!"
else
    echo "❌ Не удалось запустить бота"
    echo "Проверьте логи: cat bot.log"
    exit 1
fi

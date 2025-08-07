#!/bin/bash

# 🔧 Скрипт для исправления SSL ошибки на сервере
# Автоматически находит и закомментирует строки HTTPS редиректа

echo "🔧 Начинаем исправление SSL ошибки..."

# Проверяем, что скрипт запущен от root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Ошибка: Скрипт должен быть запущен от имени root"
    echo "Запустите: sudo bash fix_ssl_redirect.sh"
    exit 1
fi

# Создаем резервную копию
echo "📋 Создаем резервную копию конфигурации..."
cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup.$(date +%Y%m%d_%H%M%S)

# Функция для обработки файла
fix_nginx_config() {
    local config_file="$1"
    
    if [ ! -f "$config_file" ]; then
        echo "⚠️  Файл $config_file не найден, пропускаем..."
        return
    fi
    
    echo "🔍 Обрабатываем файл: $config_file"
    
    # Создаем временный файл
    local temp_file=$(mktemp)
    
    # Обрабатываем файл и закомментируем строки редиректа
    sed -E '
        # Закомментируем строки return 301 https://
        s/^([[:space:]]*return[[:space:]]+301[[:space:]]+https:\/\/.*)$/#\1/
        # Закомментируем строки rewrite с https://
        s/^([[:space:]]*rewrite[[:space:]]+.*https:\/\/.*)$/#\1/
        # Закомментируем строки if с ssl_protocols
        s/^([[:space:]]*if[[:space:]]+\(\$scheme[[:space:]]+!=[[:space:]]*"https"\)[[:space:]]*\{)$/#\1/
        s/^([[:space:]]*return[[:space:]]+301[[:space:]]+https:\/\/\$server_name\$request_uri;)$/#\1/
        s/^([[:space:]]*\}$)$/#\1/
    ' "$config_file" > "$temp_file"
    
    # Проверяем, были ли изменения
    if ! cmp -s "$config_file" "$temp_file"; then
        echo "✅ Найдены и закомментированы строки HTTPS редиректа в $config_file"
        mv "$temp_file" "$config_file"
    else
        echo "ℹ️  В файле $config_file не найдено строк для закомментирования"
        rm "$temp_file"
    fi
}

# Обрабатываем основные файлы конфигурации
echo "🔍 Ищем файлы конфигурации nginx..."

# Проверяем стандартные файлы
fix_nginx_config "/etc/nginx/sites-available/default"
fix_nginx_config "/etc/nginx/sites-available/uk-mini-app"

# Проверяем все файлы в sites-available
for config_file in /etc/nginx/sites-available/*; do
    if [ -f "$config_file" ] && [ "$(basename "$config_file")" != "default" ] && [ "$(basename "$config_file")" != "uk-mini-app" ]; then
        fix_nginx_config "$config_file"
    fi
done

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

echo ""
echo "🎉 Исправление завершено!"
echo "📋 Что было сделано:"
echo "   - Создана резервная копия конфигурации"
echo "   - Закомментированы строки HTTPS редиректа"
echo "   - Проверена корректность конфигурации"
echo "   - Перезапущен nginx"
echo ""
echo "🌐 Теперь приложение должно работать без SSL ошибок"
echo "   Проверьте: http://217.199.252.227" 
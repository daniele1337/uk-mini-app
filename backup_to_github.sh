#!/bin/bash

# Скрипт для резервного копирования с сервера на GitHub
# Использование: ./backup_to_github.sh [описание_изменений]

echo "🔄 Начинаем резервное копирование на GitHub..."

# Проверяем, что мы в правильной директории
if [ ! -f "app.py" ]; then
    echo "❌ Ошибка: app.py не найден. Убедитесь, что вы в директории проекта."
    exit 1
fi

# Создаем бэкап базы данных
echo "📦 Создаем бэкап базы данных..."
if [ -f "instance/uk_mini_app.db" ]; then
    cp instance/uk_mini_app.db instance/uk_mini_app_backup_$(date +%Y%m%d_%H%M%S).db
    echo "✅ Бэкап БД создан"
else
    echo "⚠️ База данных не найдена, пропускаем бэкап БД"
fi

# Проверяем статус git
echo "🔍 Проверяем статус Git..."
git status

# Добавляем все изменения
echo "📝 Добавляем изменения в Git..."
git add .

# Проверяем, есть ли изменения для коммита
if git diff --cached --quiet; then
    echo "ℹ️ Нет изменений для коммита"
else
    # Создаем коммит
    if [ -n "$1" ]; then
        commit_message="Backup: $1 - $(date '+%Y-%m-%d %H:%M:%S')"
    else
        commit_message="Auto backup: $(date '+%Y-%m-%d %H:%M:%S')"
    fi
    
    echo "💾 Создаем коммит: $commit_message"
    git commit -m "$commit_message"
    
    # Пушим на GitHub
    echo "🚀 Отправляем на GitHub..."
    git push origin main
    
    if [ $? -eq 0 ]; then
        echo "✅ Резервное копирование успешно завершено!"
        echo "📊 Статистика:"
        git log --oneline -5
    else
        echo "❌ Ошибка при отправке на GitHub"
        exit 1
    fi
fi

echo "🎉 Резервное копирование завершено!"

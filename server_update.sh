#!/bin/bash

# 🔄 Скрипт для автоматического обновления сервера с GitHub
# Запускается на сервере для синхронизации с репозиторием

echo "🔄 Начинаем загрузку изменений с GitHub..."

# Проверяем, что мы в правильной папке
if [ ! -d "/var/www/uk-mini-app" ]; then
    echo "❌ Ошибка: Папка /var/www/uk-mini-app не найдена"
    exit 1
fi

# Переходим в папку проекта
cd /var/www/uk-mini-app

echo "📁 Переходим в папку проекта: $(pwd)"

# Проверяем git статус
echo "🔍 Проверяем текущий статус git..."
git status --porcelain

# Сохраняем текущую ветку
CURRENT_BRANCH=$(git branch --show-current)
echo "🌿 Текущая ветка: $CURRENT_BRANCH"

# Создаем резервную копию текущих изменений (если есть)
if [ -n "$(git status --porcelain)" ]; then
    echo "📋 Создаем резервную копию локальных изменений..."
    git stash push -m "Backup before pull $(date)"
fi

# Загружаем изменения с GitHub
echo "📥 Загружаем изменения с GitHub..."
git fetch origin

# Проверяем, есть ли новые изменения
LOCAL_COMMIT=$(git rev-parse HEAD)
REMOTE_COMMIT=$(git rev-parse origin/$CURRENT_BRANCH)

if [ "$LOCAL_COMMIT" = "$REMOTE_COMMIT" ]; then
    echo "✅ Нет новых изменений на GitHub"
else
    echo "🔄 Обнаружены новые изменения, обновляем..."
    
    # Выполняем pull
    if git pull origin $CURRENT_BRANCH; then
        echo "✅ Изменения успешно загружены"
        
        # Показываем последние коммиты
        echo "📋 Последние коммиты:"
        git log --oneline -5
        
        # Проверяем, есть ли новые файлы
        echo "📁 Новые файлы:"
        git diff --name-only HEAD~1 HEAD
        
        # Если есть изменения в frontend, пересобираем
        if git diff --name-only HEAD~1 HEAD | grep -q "frontend/"; then
            echo "🔨 Обнаружены изменения в frontend, пересобираем..."
            cd frontend
            npm install
            npm run build
            cd ..
            echo "✅ Frontend пересобран"
        fi
        
        # Если есть изменения в backend, перезапускаем
        if git diff --name-only HEAD~1 HEAD | grep -q "backend/"; then
            echo "🔄 Обнаружены изменения в backend, перезапускаем..."
            pm2 restart all
            echo "✅ Backend перезапущен"
        fi
        
    else
        echo "❌ Ошибка при загрузке изменений"
        exit 1
    fi
fi

# Восстанавливаем локальные изменения (если были)
if git stash list | grep -q "Backup before pull"; then
    echo "📋 Восстанавливаем локальные изменения..."
    git stash pop
fi

echo ""
echo "🎉 Обновление завершено!"
echo "📋 Статус:"
echo "   - Ветка: $CURRENT_BRANCH"
echo "   - Последний коммит: $(git rev-parse --short HEAD)"
echo "   - Время: $(date)"
echo ""
echo "🌐 Приложение доступно по адресу: http://217.199.252.227" 
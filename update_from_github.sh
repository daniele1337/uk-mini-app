#!/bin/bash

echo "🔄 Обновление проекта с GitHub"
echo "=============================="

# Конфигурация
PROJECT_DIR="/var/www/uk-mini-app"
GITHUB_REPO="https://github.com/your-username/uk-mini-app.git"
BACKUP_DIR="/var/www/backups"
LOG_FILE="/var/log/uk-mini-app-update.log"

# Создаем директории если их нет
mkdir -p "$BACKUP_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

# Функция логирования
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Функция создания бэкапа
create_backup() {
    log "📦 Создание резервной копии..."
    BACKUP_NAME="uk-mini-app-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
    tar -czf "$BACKUP_DIR/$BACKUP_NAME" -C "$(dirname "$PROJECT_DIR")" "$(basename "$PROJECT_DIR")" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        log "✅ Резервная копия создана: $BACKUP_NAME"
        # Удаляем старые бэкапы (оставляем последние 5)
        find "$BACKUP_DIR" -name "uk-mini-app-backup-*.tar.gz" -type f -printf '%T@ %p\n' | sort -n | head -n -5 | cut -d' ' -f2- | xargs -r rm -f
    else
        log "❌ Ошибка создания резервной копии"
    fi
}

# Функция остановки сервисов
stop_services() {
    log "🛑 Остановка сервисов..."
    
    # Останавливаем PM2 процессы
    if command -v pm2 &> /dev/null; then
        pm2 stop uk-mini-app-backend 2>/dev/null
        pm2 stop uk-mini-app-frontend 2>/dev/null
        log "✅ PM2 процессы остановлены"
    fi
    
    # Останавливаем nginx если нужно
    systemctl stop nginx 2>/dev/null && log "✅ Nginx остановлен"
}

# Функция запуска сервисов
start_services() {
    log "🚀 Запуск сервисов..."
    
    # Запускаем nginx
    systemctl start nginx 2>/dev/null && log "✅ Nginx запущен"
    
    # Запускаем PM2 процессы
    if command -v pm2 &> /dev/null; then
        cd "$PROJECT_DIR"
        pm2 start ecosystem.config.js
        pm2 save
        log "✅ PM2 процессы запущены"
    fi
}

# Функция обновления зависимостей
update_dependencies() {
    log "📦 Обновление зависимостей..."
    
    # Backend зависимости
    if [ -f "$PROJECT_DIR/backend/requirements.txt" ]; then
        cd "$PROJECT_DIR/backend"
        pip3 install -r requirements.txt --upgrade
        log "✅ Python зависимости обновлены"
    fi
    
    # Frontend зависимости
    if [ -f "$PROJECT_DIR/frontend/package.json" ]; then
        cd "$PROJECT_DIR/frontend"
        npm install --production
        npm run build
        log "✅ Node.js зависимости обновлены и проект собран"
    fi
}

# Функция обновления базы данных
update_database() {
    log "🗄️ Обновление базы данных..."
    
    if [ -f "$PROJECT_DIR/backend/app.py" ]; then
        cd "$PROJECT_DIR/backend"
        python3 -c "
import sys
sys.path.append('.')
from app import app, db
with app.app_context():
    db.create_all()
    print('База данных обновлена')
"
        log "✅ База данных обновлена"
    fi
}

# Функция проверки изменений
check_changes() {
    log "🔍 Проверка изменений в репозитории..."
    
    if [ ! -d "$PROJECT_DIR/.git" ]; then
        log "❌ Директория не является git репозиторием"
        return 1
    fi
    
    cd "$PROJECT_DIR"
    git fetch origin
    
    LOCAL_COMMIT=$(git rev-parse HEAD)
    REMOTE_COMMIT=$(git rev-parse origin/main)
    
    if [ "$LOCAL_COMMIT" != "$REMOTE_COMMIT" ]; then
        log "📝 Найдены изменения в репозитории"
        return 0
    else
        log "✅ Изменений не найдено"
        return 1
    fi
}

# Основная функция обновления
update_project() {
    log "🚀 Начинаем обновление проекта..."
    
    # Проверяем существование директории
    if [ ! -d "$PROJECT_DIR" ]; then
        log "❌ Директория проекта не найдена: $PROJECT_DIR"
        log "🔧 Клонируем репозиторий..."
        git clone "$GITHUB_REPO" "$PROJECT_DIR"
        if [ $? -ne 0 ]; then
            log "❌ Ошибка клонирования репозитория"
            return 1
        fi
    fi
    
    # Переходим в директорию проекта
    cd "$PROJECT_DIR"
    
    # Проверяем изменения
    if ! check_changes; then
        log "✅ Обновление не требуется"
        return 0
    fi
    
    # Создаем бэкап
    create_backup
    
    # Останавливаем сервисы
    stop_services
    
    # Обновляем код
    log "📥 Обновление кода с GitHub..."
    git fetch origin
    git reset --hard origin/main
    git clean -fd
    
    if [ $? -eq 0 ]; then
        log "✅ Код обновлен"
    else
        log "❌ Ошибка обновления кода"
        start_services
        return 1
    fi
    
    # Обновляем зависимости
    update_dependencies
    
    # Обновляем базу данных
    update_database
    
    # Запускаем сервисы
    start_services
    
    log "🎉 Обновление завершено успешно!"
    return 0
}

# Функция отката
rollback() {
    log "🔄 Откат к предыдущей версии..."
    
    # Находим последний бэкап
    LATEST_BACKUP=$(find "$BACKUP_DIR" -name "uk-mini-app-backup-*.tar.gz" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
    
    if [ -n "$LATEST_BACKUP" ] && [ -f "$LATEST_BACKUP" ]; then
        log "📦 Восстанавливаем из бэкапа: $(basename "$LATEST_BACKUP")"
        
        # Останавливаем сервисы
        stop_services
        
        # Удаляем текущую директорию
        rm -rf "$PROJECT_DIR"
        
        # Восстанавливаем из бэкапа
        tar -xzf "$LATEST_BACKUP" -C "$(dirname "$PROJECT_DIR")"
        
        # Запускаем сервисы
        start_services
        
        log "✅ Откат завершен"
    else
        log "❌ Бэкап не найден"
    fi
}

# Обработка аргументов командной строки
case "${1:-update}" in
    "update")
        update_project
        ;;
    "rollback")
        rollback
        ;;
    "check")
        check_changes
        ;;
    "backup")
        create_backup
        ;;
    "status")
        echo "📊 Статус проекта:"
        echo "Директория: $PROJECT_DIR"
        echo "Бэкапы: $BACKUP_DIR"
        echo "Логи: $LOG_FILE"
        if [ -d "$PROJECT_DIR/.git" ]; then
            cd "$PROJECT_DIR"
            echo "Git статус:"
            git status --porcelain
            echo "Последний коммит:"
            git log --oneline -1
        fi
        ;;
    *)
        echo "Использование: $0 {update|rollback|check|backup|status}"
        echo "  update   - Обновить проект с GitHub"
        echo "  rollback - Откатиться к предыдущей версии"
        echo "  check    - Проверить наличие изменений"
        echo "  backup   - Создать резервную копию"
        echo "  status   - Показать статус проекта"
        exit 1
        ;;
esac

exit $?

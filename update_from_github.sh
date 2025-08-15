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

# Функция мягкой перезагрузки сервисов (без остановки)
soft_restart_services() {
    log "🔄 Мягкая перезагрузка сервисов..."
    
    # Перезагружаем PM2 процессы без остановки
    if command -v pm2 &> /dev/null; then
        cd "$PROJECT_DIR"
        
        # Перезагружаем backend если он запущен
        if pm2 list | grep -q "uk-mini-app-backend"; then
            pm2 reload uk-mini-app-backend
            log "✅ Backend перезагружен"
        fi
        
        # Перезагружаем frontend если он запущен
        if pm2 list | grep -q "uk-mini-app-frontend"; then
            pm2 reload uk-mini-app-frontend
            log "✅ Frontend перезагружен"
        fi
        
        pm2 save
    fi
    
    # Перезагружаем nginx конфигурацию
    if systemctl is-active --quiet nginx; then
        nginx -t && systemctl reload nginx
        log "✅ Nginx конфигурация перезагружена"
    fi
}

# Функция принудительной перезагрузки сервисов (только при необходимости)
force_restart_services() {
    log "🔄 Принудительная перезагрузка сервисов..."
    
    # Останавливаем PM2 процессы
    if command -v pm2 &> /dev/null; then
        pm2 stop uk-mini-app-backend 2>/dev/null
        pm2 stop uk-mini-app-frontend 2>/dev/null
        log "✅ PM2 процессы остановлены"
    fi
    
    # Останавливаем nginx если нужно
    systemctl stop nginx 2>/dev/null && log "✅ Nginx остановлен"
    
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
    if [ -f "$PROJECT_DIR/requirements.txt" ]; then
        cd "$PROJECT_DIR"
        pip3 install -r requirements.txt --upgrade
        log "✅ Python зависимости обновлены"
    fi
    
    # Frontend зависимости (только если изменились package.json или package-lock.json)
    if [ -f "$PROJECT_DIR/package.json" ]; then
        cd "$PROJECT_DIR"
        
        # Проверяем, изменились ли зависимости
        if git diff --name-only HEAD~1 | grep -E "(package\.json|package-lock\.json)" > /dev/null; then
            log "📦 Обнаружены изменения в зависимостях frontend"
            npm install --production
            npm run build
            log "✅ Node.js зависимости обновлены и проект собран"
        else
            log "✅ Зависимости frontend не изменились"
        fi
    fi
}

# Функция обновления базы данных
update_database() {
    log "🗄️ Проверка обновлений базы данных..."
    
    if [ -f "$PROJECT_DIR/app.py" ]; then
        cd "$PROJECT_DIR"
        
        # Проверяем, изменились ли файлы, связанные с БД
        if git diff --name-only HEAD~1 | grep -E "(app\.py|models|migrations)" > /dev/null; then
            log "🗄️ Обнаружены изменения в структуре БД"
            python3 -c "
import sys
sys.path.append('.')
from app import app, db
with app.app_context():
    db.create_all()
    print('База данных обновлена')
"
            log "✅ База данных обновлена"
        else
            log "✅ Структура БД не изменилась"
        fi
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

# Функция определения типа изменений
analyze_changes() {
    log "🔍 Анализ типа изменений..."
    
    cd "$PROJECT_DIR"
    
    # Получаем список измененных файлов
    CHANGED_FILES=$(git diff --name-only HEAD~1)
    
    # Проверяем критические изменения
    CRITICAL_CHANGES=false
    
    # Изменения в конфигурации серверов
    if echo "$CHANGED_FILES" | grep -E "(ecosystem\.config\.js|nginx.*\.conf|\.env)" > /dev/null; then
        log "⚠️ Обнаружены изменения в конфигурации серверов"
        CRITICAL_CHANGES=true
    fi
    
    # Изменения в системных файлах
    if echo "$CHANGED_FILES" | grep -E "(app\.py|main\.py|server\.py)" > /dev/null; then
        log "⚠️ Обнаружены изменения в основных файлах приложения"
        CRITICAL_CHANGES=true
    fi
    
    # Изменения в зависимостях
    if echo "$CHANGED_FILES" | grep -E "(requirements\.txt|package\.json)" > /dev/null; then
        log "⚠️ Обнаружены изменения в зависимостях"
        CRITICAL_CHANGES=true
    fi
    
    # Изменения в структуре БД
    if echo "$CHANGED_FILES" | grep -E "(models|migrations)" > /dev/null; then
        log "⚠️ Обнаружены изменения в структуре БД"
        CRITICAL_CHANGES=true
    fi
    
    if [ "$CRITICAL_CHANGES" = true ]; then
        log "🔄 Требуется полная перезагрузка сервисов"
        return 1
    else
        log "✅ Только некритические изменения - мягкая перезагрузка"
        return 0
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
    
    # Сохраняем текущий коммит для анализа изменений
    OLD_COMMIT=$(git rev-parse HEAD)
    
    # Обновляем код
    log "📥 Обновление кода с GitHub..."
    git fetch origin
    git reset --hard origin/main
    git clean -fd
    
    if [ $? -eq 0 ]; then
        log "✅ Код обновлен"
    else
        log "❌ Ошибка обновления кода"
        return 1
    fi
    
    # Анализируем тип изменений
    if analyze_changes; then
        # Мягкая перезагрузка
        log "🔄 Выполняем мягкую перезагрузку..."
        update_dependencies
        update_database
        soft_restart_services
    else
        # Полная перезагрузка
        log "🔄 Выполняем полную перезагрузку..."
        update_dependencies
        update_database
        force_restart_services
    fi
    
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
        if command -v pm2 &> /dev/null; then
            pm2 stop uk-mini-app-backend 2>/dev/null
            pm2 stop uk-mini-app-frontend 2>/dev/null
        fi
        systemctl stop nginx 2>/dev/null
        
        # Удаляем текущую директорию
        rm -rf "$PROJECT_DIR"
        
        # Восстанавливаем из бэкапа
        tar -xzf "$LATEST_BACKUP" -C "$(dirname "$PROJECT_DIR")"
        
        # Запускаем сервисы
        systemctl start nginx 2>/dev/null
        if command -v pm2 &> /dev/null; then
            cd "$PROJECT_DIR"
            pm2 start ecosystem.config.js
            pm2 save
        fi
        
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
    "soft-restart")
        soft_restart_services
        ;;
    "force-restart")
        force_restart_services
        ;;
    *)
        echo "Использование: $0 {update|rollback|check|backup|status|soft-restart|force-restart}"
        echo "  update        - Обновить проект с GitHub"
        echo "  rollback      - Откатиться к предыдущей версии"
        echo "  check         - Проверить наличие изменений"
        echo "  backup        - Создать резервную копию"
        echo "  status        - Показать статус проекта"
        echo "  soft-restart  - Мягкая перезагрузка сервисов"
        echo "  force-restart - Принудительная перезагрузка сервисов"
        exit 1
        ;;
esac

exit $?

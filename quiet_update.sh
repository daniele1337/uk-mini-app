#!/bin/bash

echo "🤫 Тихий режим обновления - не мешаем работе коллег"
echo "=================================================="

# Конфигурация
PROJECT_DIR="/var/www/uk-mini-app"
GITHUB_REPO="https://github.com/your-username/uk-mini-app.git"
BACKUP_DIR="/var/www/backups"
LOG_FILE="/var/log/uk-mini-app-quiet-update.log"
LOCK_FILE="/tmp/uk-mini-app-update.lock"

# Создаем директории если их нет
mkdir -p "$BACKUP_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

# Функция логирования
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Функция проверки блокировки
check_lock() {
    if [ -f "$LOCK_FILE" ]; then
        PID=$(cat "$LOCK_FILE" 2>/dev/null)
        if ps -p "$PID" > /dev/null 2>&1; then
            log "⚠️ Обновление уже выполняется (PID: $PID)"
            return 1
        else
            log "🧹 Удаляем устаревшую блокировку"
            rm -f "$LOCK_FILE"
        fi
    fi
    return 0
}

# Функция создания блокировки
create_lock() {
    echo $$ > "$LOCK_FILE"
    log "🔒 Создана блокировка обновления"
}

# Функция удаления блокировки
remove_lock() {
    rm -f "$LOCK_FILE"
    log "🔓 Блокировка удалена"
}

# Функция проверки активности пользователей
check_user_activity() {
    log "👥 Проверка активности пользователей..."
    
    # Проверяем активные SSH сессии
    ACTIVE_SSH=$(who | wc -l)
    if [ "$ACTIVE_SSH" -gt 0 ]; then
        log "⚠️ Обнаружены активные SSH сессии: $ACTIVE_SSH"
        return 1
    fi
    
    # Проверяем активные процессы разработки
    ACTIVE_PROCESSES=$(ps aux | grep -E "(vim|nano|code|cursor|git|python|node)" | grep -v grep | wc -l)
    if [ "$ACTIVE_PROCESSES" -gt 5 ]; then
        log "⚠️ Обнаружены активные процессы разработки: $ACTIVE_PROCESSES"
        return 1
    fi
    
    # Проверяем изменения файлов в последние 5 минут
    RECENT_CHANGES=$(find "$PROJECT_DIR" -type f -mmin -5 2>/dev/null | wc -l)
    if [ "$RECENT_CHANGES" -gt 10 ]; then
        log "⚠️ Обнаружены недавние изменения файлов: $RECENT_CHANGES"
        return 1
    fi
    
    log "✅ Активность пользователей не обнаружена"
    return 0
}

# Функция создания бэкапа
create_backup() {
    log "📦 Создание резервной копии..."
    BACKUP_NAME="uk-mini-app-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
    tar -czf "$BACKUP_DIR/$BACKUP_NAME" -C "$(dirname "$PROJECT_DIR")" "$(basename "$PROJECT_DIR")" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        log "✅ Резервная копия создана: $BACKUP_NAME"
        # Удаляем старые бэкапы (оставляем последние 10)
        find "$BACKUP_DIR" -name "uk-mini-app-backup-*.tar.gz" -type f -printf '%T@ %p\n' | sort -n | head -n -10 | cut -d' ' -f2- | xargs -r rm -f
    else
        log "❌ Ошибка создания резервной копии"
    fi
}

# Функция тихой перезагрузки сервисов
quiet_restart_services() {
    log "🔄 Тихая перезагрузка сервисов..."
    
    # Перезагружаем PM2 процессы без остановки
    if command -v pm2 &> /dev/null; then
        cd "$PROJECT_DIR"
        
        # Перезагружаем backend если он запущен
        if pm2 list | grep -q "uk-mini-app-backend"; then
            pm2 reload uk-mini-app-backend --silent
            log "✅ Backend тихо перезагружен"
        fi
        
        # Перезагружаем frontend если он запущен
        if pm2 list | grep -q "uk-mini-app-frontend"; then
            pm2 reload uk-mini-app-frontend --silent
            log "✅ Frontend тихо перезагружен"
        fi
        
        pm2 save --silent
    fi
    
    # Перезагружаем nginx конфигурацию тихо
    if systemctl is-active --quiet nginx; then
        nginx -t > /dev/null 2>&1 && systemctl reload nginx > /dev/null 2>&1
        log "✅ Nginx тихо перезагружен"
    fi
}

# Функция обновления зависимостей
update_dependencies() {
    log "📦 Обновление зависимостей..."
    
    # Backend зависимости (тихо)
    if [ -f "$PROJECT_DIR/requirements.txt" ]; then
        cd "$PROJECT_DIR"
        pip3 install -r requirements.txt --upgrade --quiet
        log "✅ Python зависимости обновлены"
    fi
    
    # Frontend зависимости (только если изменились)
    if [ -f "$PROJECT_DIR/package.json" ]; then
        cd "$PROJECT_DIR"
        
        # Проверяем, изменились ли зависимости
        if git diff --name-only HEAD~1 | grep -E "(package\.json|package-lock\.json)" > /dev/null; then
            log "📦 Обнаружены изменения в зависимостях frontend"
            npm install --production --silent
            npm run build --silent
            log "✅ Node.js зависимости обновлены"
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
" > /dev/null 2>&1
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
    git fetch origin --quiet
    
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

# Функция анализа критических изменений
analyze_critical_changes() {
    log "🔍 Анализ критических изменений..."
    
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
        log "✅ Только некритические изменения - тихая перезагрузка"
        return 0
    fi
}

# Функция полной перезагрузки (только при критических изменениях)
force_restart_services() {
    log "🔄 Полная перезагрузка сервисов (критические изменения)..."
    
    # Останавливаем PM2 процессы
    if command -v pm2 &> /dev/null; then
        pm2 stop uk-mini-app-backend --silent 2>/dev/null
        pm2 stop uk-mini-app-frontend --silent 2>/dev/null
        log "✅ PM2 процессы остановлены"
    fi
    
    # Останавливаем nginx
    systemctl stop nginx --quiet 2>/dev/null && log "✅ Nginx остановлен"
    
    # Запускаем nginx
    systemctl start nginx --quiet 2>/dev/null && log "✅ Nginx запущен"
    
    # Запускаем PM2 процессы
    if command -v pm2 &> /dev/null; then
        cd "$PROJECT_DIR"
        pm2 start ecosystem.config.js --silent
        pm2 save --silent
        log "✅ PM2 процессы запущены"
    fi
}

# Основная функция тихого обновления
quiet_update() {
    log "🤫 Начинаем тихое обновление проекта..."
    
    # Проверяем блокировку
    if ! check_lock; then
        return 1
    fi
    
    # Создаем блокировку
    create_lock
    
    # Проверяем активность пользователей
    if ! check_user_activity; then
        log "⏰ Откладываем обновление - обнаружена активность пользователей"
        remove_lock
        return 0
    fi
    
    # Проверяем существование директории
    if [ ! -d "$PROJECT_DIR" ]; then
        log "❌ Директория проекта не найдена: $PROJECT_DIR"
        remove_lock
        return 1
    fi
    
    # Переходим в директорию проекта
    cd "$PROJECT_DIR"
    
    # Проверяем изменения
    if ! check_changes; then
        log "✅ Обновление не требуется"
        remove_lock
        return 0
    fi
    
    # Создаем бэкап
    create_backup
    
    # Обновляем код
    log "📥 Обновление кода с GitHub..."
    git fetch origin --quiet
    git reset --hard origin/main --quiet
    git clean -fd --quiet
    
    if [ $? -eq 0 ]; then
        log "✅ Код обновлен"
    else
        log "❌ Ошибка обновления кода"
        remove_lock
        return 1
    fi
    
    # Анализируем тип изменений
    if analyze_critical_changes; then
        # Тихая перезагрузка
        log "🔄 Выполняем тихую перезагрузку..."
        update_dependencies
        update_database
        quiet_restart_services
    else
        # Полная перезагрузка
        log "🔄 Выполняем полную перезагрузку (критические изменения)..."
        update_dependencies
        update_database
        force_restart_services
    fi
    
    log "🎉 Тихое обновление завершено успешно!"
    remove_lock
    return 0
}

# Функция мониторинга и автоматического обновления
monitor_and_update() {
    log "👀 Запуск мониторинга изменений..."
    
    while true; do
        # Проверяем изменения каждые 5 минут
        if check_changes; then
            log "📝 Обнаружены изменения - запускаем тихое обновление"
            quiet_update
        fi
        
        # Ждем 5 минут
        sleep 300
    done
}

# Обработка аргументов командной строки
case "${1:-update}" in
    "update")
        quiet_update
        ;;
    "monitor")
        monitor_and_update
        ;;
    "check")
        check_changes
        ;;
    "backup")
        create_backup
        ;;
    "status")
        echo "📊 Статус тихого обновления:"
        echo "Директория: $PROJECT_DIR"
        echo "Бэкапы: $BACKUP_DIR"
        echo "Логи: $LOG_FILE"
        if [ -f "$LOCK_FILE" ]; then
            PID=$(cat "$LOCK_FILE" 2>/dev/null)
            echo "Блокировка: $LOCK_FILE (PID: $PID)"
        else
            echo "Блокировка: нет"
        fi
        if [ -d "$PROJECT_DIR/.git" ]; then
            cd "$PROJECT_DIR"
            echo "Git статус:"
            git status --porcelain
            echo "Последний коммит:"
            git log --oneline -1
        fi
        ;;
    "unlock")
        remove_lock
        echo "🔓 Блокировка удалена"
        ;;
    *)
        echo "Использование: $0 {update|monitor|check|backup|status|unlock}"
        echo "  update  - Выполнить тихое обновление"
        echo "  monitor - Запустить мониторинг и автообновление"
        echo "  check   - Проверить наличие изменений"
        echo "  backup  - Создать резервную копию"
        echo "  status  - Показать статус"
        echo "  unlock  - Удалить блокировку"
        exit 1
        ;;
esac

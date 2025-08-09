#!/bin/bash

echo "🤖 Настройка автоматического обновления с GitHub"
echo "================================================"

# Конфигурация
UPDATE_SCRIPT="/var/www/uk-mini-app/update_from_github.sh"
CRON_JOB="/etc/cron.d/uk-mini-app-update"
LOG_FILE="/var/log/uk-mini-app-update.log"

# Функция настройки GitHub репозитория
setup_github_repo() {
    echo "📝 Настройка GitHub репозитория..."
    
    read -p "Введите URL вашего GitHub репозитория: " GITHUB_REPO
    
    if [ -z "$GITHUB_REPO" ]; then
        echo "❌ URL репозитория не введен"
        return 1
    fi
    
    # Обновляем скрипт с правильным URL
    sed -i "s|GITHUB_REPO=\"https://github.com/your-username/uk-mini-app.git\"|GITHUB_REPO=\"$GITHUB_REPO\"|g" "$UPDATE_SCRIPT"
    
    echo "✅ GitHub репозиторий настроен: $GITHUB_REPO"
}

# Функция настройки SSH ключей (опционально)
setup_ssh_keys() {
    echo "🔑 Настройка SSH ключей для GitHub..."
    
    read -p "Использовать SSH ключи для доступа к GitHub? (y/n): " USE_SSH
    
    if [ "$USE_SSH" = "y" ] || [ "$USE_SSH" = "Y" ]; then
        # Проверяем наличие SSH ключей
        if [ ! -f ~/.ssh/id_rsa ]; then
            echo "🔧 Генерируем SSH ключ..."
            ssh-keygen -t rsa -b 4096 -C "server@uk-mini-app" -f ~/.ssh/id_rsa -N ""
        fi
        
        echo "📋 Ваш публичный ключ:"
        cat ~/.ssh/id_rsa.pub
        echo ""
        echo "⚠️ Добавьте этот ключ в настройки GitHub репозитория"
        echo "GitHub → Settings → Deploy keys → Add deploy key"
        
        # Настраиваем SSH для GitHub
        if [ ! -f ~/.ssh/config ]; then
            echo "Host github.com" >> ~/.ssh/config
            echo "  HostName github.com" >> ~/.ssh/config
            echo "  User git" >> ~/.ssh/config
            echo "  IdentityFile ~/.ssh/id_rsa" >> ~/.ssh/config
        fi
        
        chmod 600 ~/.ssh/config
        echo "✅ SSH ключи настроены"
    else
        echo "ℹ️ Используем HTTPS для доступа к GitHub"
    fi
}

# Функция настройки cron для автоматического обновления
setup_cron() {
    echo "⏰ Настройка автоматического обновления..."
    
    read -p "Настроить автоматическое обновление каждые X минут? (введите число или 0 для отключения): " UPDATE_INTERVAL
    
    if [ "$UPDATE_INTERVAL" -gt 0 ] 2>/dev/null; then
        # Создаем cron задачу
        echo "# Автоматическое обновление uk-mini-app" > "$CRON_JOB"
        echo "*/$UPDATE_INTERVAL * * * * root $UPDATE_SCRIPT update >> $LOG_FILE 2>&1" >> "$CRON_JOB"
        
        # Активируем cron
        systemctl enable cron
        systemctl start cron
        
        echo "✅ Автоматическое обновление настроено каждые $UPDATE_INTERVAL минут"
    else
        echo "ℹ️ Автоматическое обновление отключено"
        # Удаляем cron задачу если существует
        rm -f "$CRON_JOB"
    fi
}

# Функция настройки webhook для автоматического обновления
setup_webhook() {
    echo "🌐 Настройка webhook для автоматического обновления..."
    
    read -p "Настроить webhook для обновления при push в GitHub? (y/n): " USE_WEBHOOK
    
    if [ "$USE_WEBHOOK" = "y" ] || [ "$USE_WEBHOOK" = "Y" ]; then
        # Создаем webhook endpoint
        WEBHOOK_SCRIPT="/var/www/uk-mini-app/webhook_handler.py"
        
        cat > "$WEBHOOK_SCRIPT" << 'EOF'
#!/usr/bin/env python3
import json
import subprocess
import hmac
import hashlib
from flask import Flask, request, jsonify

app = Flask(__name__)

# Секретный ключ для webhook (замените на свой)
WEBHOOK_SECRET = "your-webhook-secret-here"

@app.route('/webhook/github', methods=['POST'])
def github_webhook():
    # Проверяем подпись GitHub
    signature = request.headers.get('X-Hub-Signature-256')
    if not signature:
        return jsonify({'error': 'No signature'}), 401
    
    # Проверяем подпись
    expected_signature = 'sha256=' + hmac.new(
        WEBHOOK_SECRET.encode('utf-8'),
        request.data,
        hashlib.sha256
    ).hexdigest()
    
    if not hmac.compare_digest(signature, expected_signature):
        return jsonify({'error': 'Invalid signature'}), 401
    
    # Проверяем что это push в main ветку
    payload = request.json
    if payload.get('ref') != 'refs/heads/main':
        return jsonify({'message': 'Not main branch'}), 200
    
    # Запускаем обновление
    try:
        subprocess.run(['/var/www/uk-mini-app/update_from_github.sh', 'update'], 
                      capture_output=True, text=True, timeout=300)
        return jsonify({'message': 'Update triggered successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
EOF
        
        chmod +x "$WEBHOOK_SCRIPT"
        
        # Создаем systemd сервис для webhook
        cat > /etc/systemd/system/uk-mini-app-webhook.service << EOF
[Unit]
Description=UK Mini App GitHub Webhook Handler
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/uk-mini-app
ExecStart=/usr/bin/python3 /var/www/uk-mini-app/webhook_handler.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
        
        # Запускаем webhook сервис
        systemctl daemon-reload
        systemctl enable uk-mini-app-webhook
        systemctl start uk-mini-app-webhook
        
        # Настраиваем nginx для webhook
        cat > /etc/nginx/sites-available/webhook << EOF
server {
    listen 80;
    server_name webhook.24autoflow.ru;
    
    location /webhook/github {
        proxy_pass http://localhost:5001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
        
        ln -sf /etc/nginx/sites-available/webhook /etc/nginx/sites-enabled/
        systemctl reload nginx
        
        echo "✅ Webhook настроен"
        echo "🌐 URL webhook: http://webhook.24autoflow.ru/webhook/github"
        echo "⚠️ Добавьте этот URL в настройки GitHub репозитория"
        echo "GitHub → Settings → Webhooks → Add webhook"
        echo "Content type: application/json"
        echo "Secret: your-webhook-secret-here"
    else
        echo "ℹ️ Webhook отключен"
    fi
}

# Функция тестирования обновления
test_update() {
    echo "🧪 Тестирование обновления..."
    
    # Делаем скрипт исполняемым
    chmod +x "$UPDATE_SCRIPT"
    
    # Запускаем тестовое обновление
    echo "Запускаем тестовое обновление..."
    "$UPDATE_SCRIPT" update
    
    if [ $? -eq 0 ]; then
        echo "✅ Тестовое обновление прошло успешно"
    else
        echo "❌ Ошибка при тестовом обновлении"
        echo "Проверьте логи: $LOG_FILE"
    fi
}

# Основная функция
main() {
    echo "🚀 Настройка автоматического обновления с GitHub"
    echo ""
    
    # Проверяем права
    if [ "$EUID" -ne 0 ]; then
        echo "❌ Запустите скрипт с правами root"
        exit 1
    fi
    
    # Настраиваем GitHub репозиторий
    setup_github_repo
    
    # Настраиваем SSH ключи
    setup_ssh_keys
    
    # Настраиваем cron
    setup_cron
    
    # Настраиваем webhook
    setup_webhook
    
    # Тестируем обновление
    test_update
    
    echo ""
    echo "🎉 Настройка завершена!"
    echo ""
    echo "📋 Команды для управления:"
    echo "  $UPDATE_SCRIPT update   - Обновить проект"
    echo "  $UPDATE_SCRIPT check    - Проверить изменения"
    echo "  $UPDATE_SCRIPT rollback - Откатиться к предыдущей версии"
    echo "  $UPDATE_SCRIPT status   - Показать статус"
    echo ""
    echo "📊 Логи обновлений: $LOG_FILE"
    echo "📦 Резервные копии: /var/www/backups"
}

# Запускаем основную функцию
main

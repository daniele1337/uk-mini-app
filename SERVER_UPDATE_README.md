# 🚀 Обновление проекта на сервере

## 📋 Скрипты обновления

### 1. `server_update.sh` - Полный скрипт обновления
- ✅ Создает резервные копии
- ✅ Проверяет изменения
- ✅ Обновляет зависимости
- ✅ Поддерживает откат
- ✅ Ведет логи

### 2. `quick_update.sh` - Быстрое обновление
- ⚡ Простое и быстрое обновление
- 🔄 Останавливает и запускает сервисы
- 📦 Обновляет зависимости

## 🔧 Использование на сервере

### Загрузка на сервер:
1. Загрузите файлы через GitHub Desktop
2. Скопируйте на сервер Timeweb
3. Сделайте исполняемыми

### Команды:

```bash
# Перейти в директорию проекта
cd /var/www/uk-mini-app

# Сделать скрипты исполняемыми
chmod +x server_update.sh
chmod +x quick_update.sh

# Полное обновление
./server_update.sh update

# Быстрое обновление
./quick_update.sh

# Проверить статус
./server_update.sh status

# Создать бэкап
./server_update.sh backup

# Откатиться к предыдущей версии
./server_update.sh rollback
```

## 📊 Автоматическое обновление

### Настроить cron для автоматического обновления:

```bash
# Открыть crontab
crontab -e

# Добавить задачу (обновление каждые 30 минут)
*/30 * * * * /var/www/uk-mini-app/server_update.sh update

# Или ежедневное обновление в 2:00
0 2 * * * /var/www/uk-mini-app/server_update.sh update
```

### Проверить cron задачи:
```bash
crontab -l
```

## 🔍 Мониторинг

### Логи обновлений:
```bash
# Просмотр логов
tail -f /var/log/uk-mini-app-update.log

# Последние 50 строк
tail -50 /var/log/uk-mini-app-update.log
```

### Статус сервисов:
```bash
# Статус PM2
pm2 status

# Статус nginx
systemctl status nginx

# Проверить порты
netstat -tlnp | grep :80
netstat -tlnp | grep :3000
```

## 🚨 Устранение проблем

### Ошибка "Permission denied":
```bash
chmod +x /var/www/uk-mini-app/server_update.sh
chmod +x /var/www/uk-mini-app/quick_update.sh
```

### Ошибка "Git repository not found":
```bash
cd /var/www/uk-mini-app
git remote -v
git fetch origin
```

### Сервисы не запускаются:
```bash
# Проверить логи PM2
pm2 logs

# Перезапустить PM2
pm2 restart all

# Проверить ecosystem.config.js
cat ecosystem.config.js
```

## 📦 Резервные копии

### Просмотр бэкапов:
```bash
ls -la /var/www/backups/
```

### Восстановление:
```bash
# Восстановить последний бэкап
./server_update.sh rollback
```

## 🎯 Примеры использования

### Ежедневное обновление:
```bash
# Добавить в crontab
echo "0 2 * * * /var/www/uk-mini-app/server_update.sh update" | crontab -
```

### Обновление только при изменениях:
```bash
# Проверить и обновить
./server_update.sh check && ./server_update.sh update
```

### Быстрое обновление для тестирования:
```bash
./quick_update.sh
```

## ✅ Готово!

После настройки:
- ✅ Проект будет автоматически обновляться
- ✅ Резервные копии создаются автоматически
- ✅ Логи ведут все операции
- ✅ Откат доступен при ошибках
- ✅ Сервисы перезапускаются автоматически

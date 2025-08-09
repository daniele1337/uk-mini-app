# 🚀 Автоматическое обновление проекта с GitHub

## 📋 Обзор системы

Система автоматического обновления позволяет:
- ✅ Автоматически обновлять проект с GitHub
- ✅ Создавать резервные копии перед обновлением
- ✅ Откатываться к предыдущей версии при ошибках
- ✅ Настраивать webhook для мгновенного обновления
- ✅ Вести логи всех операций

## 🔧 Установка и настройка

### 1. Загрузка скриптов на сервер

```bash
# Скопируйте файлы на сервер
scp update_from_github.sh root@217.199.252.227:/var/www/uk-mini-app/
scp setup_auto_update.sh root@217.199.252.227:/var/www/uk-mini-app/
```

### 2. Настройка автоматического обновления

```bash
# Подключитесь к серверу
ssh root@217.199.252.227

# Перейдите в директорию проекта
cd /var/www/uk-mini-app

# Сделайте скрипты исполняемыми
chmod +x update_from_github.sh
chmod +x setup_auto_update.sh

# Запустите настройку
./setup_auto_update.sh
```

### 3. Настройка GitHub репозитория

1. **Создайте репозиторий на GitHub**
2. **Загрузите код в репозиторий**
3. **Настройте SSH ключи или используйте HTTPS**

## 📊 Команды управления

### Основные команды:

```bash
# Обновить проект
./update_from_github.sh update

# Проверить наличие изменений
./update_from_github.sh check

# Откатиться к предыдущей версии
./update_from_github.sh rollback

# Создать резервную копию
./update_from_github.sh backup

# Показать статус проекта
./update_from_github.sh status
```

### Автоматическое обновление:

```bash
# Настроить обновление каждые 30 минут
echo "*/30 * * * * root /var/www/uk-mini-app/update_from_github.sh update" | sudo tee /etc/cron.d/uk-mini-app-update

# Проверить cron задачи
crontab -l
```

## 🌐 Webhook настройка

### 1. Настройка webhook в GitHub:

1. Перейдите в ваш репозиторий на GitHub
2. Settings → Webhooks → Add webhook
3. Payload URL: `http://webhook.24autoflow.ru/webhook/github`
4. Content type: `application/json`
5. Secret: `your-webhook-secret-here`
6. Events: `Just the push event`

### 2. Проверка webhook:

```bash
# Проверьте статус webhook сервиса
systemctl status uk-mini-app-webhook

# Посмотрите логи
tail -f /var/log/uk-mini-app-update.log
```

## 🔒 Безопасность

### SSH ключи:

```bash
# Генерация SSH ключа
ssh-keygen -t rsa -b 4096 -C "server@uk-mini-app"

# Добавление ключа в GitHub
cat ~/.ssh/id_rsa.pub
# Скопируйте вывод в GitHub → Settings → Deploy keys
```

### Webhook секрет:

```bash
# Измените секрет в webhook_handler.py
sed -i 's/your-webhook-secret-here/ваш-секретный-ключ/g' /var/www/uk-mini-app/webhook_handler.py
```

## 📊 Мониторинг

### Логи:

```bash
# Просмотр логов обновлений
tail -f /var/log/uk-mini-app-update.log

# Просмотр логов webhook
journalctl -u uk-mini-app-webhook -f
```

### Статус сервисов:

```bash
# Проверка статуса всех сервисов
systemctl status nginx
systemctl status uk-mini-app-webhook
pm2 status
```

## 🔄 Процесс обновления

### Что происходит при обновлении:

1. **Проверка изменений** - сравнивает локальную и удаленную версии
2. **Создание бэкапа** - архивирует текущую версию
3. **Остановка сервисов** - останавливает PM2 и nginx
4. **Обновление кода** - загружает изменения с GitHub
5. **Обновление зависимостей** - устанавливает новые пакеты
6. **Обновление БД** - применяет миграции базы данных
7. **Запуск сервисов** - перезапускает все сервисы

### В случае ошибки:

1. **Автоматический откат** - восстанавливает из бэкапа
2. **Логирование ошибок** - записывает в лог файл
3. **Уведомления** - отправляет уведомления администратору

## 🚨 Устранение проблем

### Ошибка "Permission denied":

```bash
# Проверьте права доступа
ls -la /var/www/uk-mini-app/update_from_github.sh

# Исправьте права
chmod +x /var/www/uk-mini-app/update_from_github.sh
```

### Ошибка "Git repository not found":

```bash
# Проверьте URL репозитория
grep "GITHUB_REPO" /var/www/uk-mini-app/update_from_github.sh

# Обновите URL
sed -i 's|старый-url|новый-url|g' /var/www/uk-mini-app/update_from_github.sh
```

### Webhook не работает:

```bash
# Проверьте статус сервиса
systemctl status uk-mini-app-webhook

# Перезапустите сервис
systemctl restart uk-mini-app-webhook

# Проверьте nginx конфигурацию
nginx -t
systemctl reload nginx
```

## 📦 Резервные копии

### Просмотр бэкапов:

```bash
# Список всех бэкапов
ls -la /var/www/backups/

# Размер бэкапов
du -sh /var/www/backups/*
```

### Восстановление из бэкапа:

```bash
# Восстановить конкретный бэкап
tar -xzf /var/www/backups/uk-mini-app-backup-20231201-143022.tar.gz -C /var/www/
```

## 🎯 Примеры использования

### Ежедневное обновление:

```bash
# Добавить в crontab
echo "0 2 * * * root /var/www/uk-mini-app/update_from_github.sh update" | sudo tee -a /etc/cron.d/uk-mini-app-update
```

### Обновление только при изменениях:

```bash
# Проверить изменения и обновить если есть
/var/www/uk-mini-app/update_from_github.sh check && /var/www/uk-mini-app/update_from_github.sh update
```

### Мониторинг с уведомлениями:

```bash
# Добавить в скрипт отправку уведомлений
echo "Обновление завершено" | curl -X POST "http://localhost:5000/api/admin/notifications" \
  -H "Content-Type: application/json" \
  -d '{"title":"Обновление","message":"Проект обновлен с GitHub","target":"all"}'
```

## ✅ Готово!

После настройки ваш проект будет:
- ✅ Автоматически обновляться с GitHub
- ✅ Создавать резервные копии
- ✅ Отправлять уведомления об обновлениях
- ✅ Вести подробные логи
- ✅ Поддерживать откат к предыдущим версиям

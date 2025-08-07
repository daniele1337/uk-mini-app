# 🔧 Инструкция по исправлению SSL проблемы на сервере

## Проблема
Браузер автоматически пытается открыть HTTPS вместо HTTP, что вызывает SSL ошибку.

## Решение 1: Исправить nginx конфигурацию

### 1. Подключитесь к серверу
```bash
ssh root@217.199.252.227
```

### 2. Найдите конфигурацию nginx
```bash
cd /etc/nginx/sites-available/
ls -la
```

### 3. Отредактируйте конфигурацию
```bash
nano /etc/nginx/sites-available/default
# или
nano /etc/nginx/sites-available/uk-mini-app
```

### 4. Удалите или закомментируйте HTTPS редирект
Найдите и закомментируйте строки типа:
```nginx
# return 301 https://$server_name$request_uri;
# или
# rewrite ^(.*) https://$host$1 permanent;
```

### 5. Перезапустите nginx
```bash
nginx -t  # проверка конфигурации
systemctl reload nginx
```

## Решение 2: Проверить текущую конфигурацию

### Проверьте, есть ли HTTPS редирект
```bash
curl -I http://217.199.252.227
```

Если видите `301 Moved Permanently` - есть редирект на HTTPS.

### Проверьте логи nginx
```bash
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

## Решение 3: Временное решение для пользователей

### Для пользователей:
1. **В адресной строке введите**: `http://217.199.252.227`
2. **Не используйте**: `https://217.199.252.227`
3. **Если браузер автоматически добавляет https**: введите `http://` вручную

### Для разработчиков:
1. Откройте `test_ssl_fix.html` в браузере
2. Нажмите кнопку "Открыть HTTP версию"
3. Проверьте, работает ли сайт

## Решение 4: Полное исправление

### Создайте новую конфигурацию nginx:
```bash
cp /etc/nginx/sites-available/default /etc/nginx/sites-available/uk-mini-app-backup
```

### Используйте конфигурацию из файла `nginx_fix.conf`

### Примените изменения:
```bash
ln -s /etc/nginx/sites-available/uk-mini-app /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default  # если есть
nginx -t
systemctl reload nginx
```

## Проверка результата

После исправления:
1. Откройте `http://217.199.252.227`
2. Не должно быть редиректа на HTTPS
3. Сайт должен загружаться без SSL ошибок

## Альтернативное решение: Установить SSL сертификат

Если хотите использовать HTTPS:
```bash
# Установить Certbot
apt install certbot python3-certbot-nginx

# Получить сертификат
certbot --nginx -d 217.199.252.227

# Или для домена (если есть)
certbot --nginx -d your-domain.com
```

## Логи для отладки

### Проверьте статус nginx:
```bash
systemctl status nginx
```

### Проверьте конфигурацию:
```bash
nginx -t
```

### Проверьте порты:
```bash
netstat -tlnp | grep :80
netstat -tlnp | grep :443
``` 
# 🔧 Инструкции по исправлению SSL ошибки на сервере

## 📋 Шаги для подключения к серверу:

### 1. Подключитесь к серверу через SSH:
```bash
ssh root@217.199.252.227
```

### 2. Найдите файлы конфигурации nginx:
```bash
cd /etc/nginx/sites-available/
ls -la
```

### 3. Посмотрите содержимое файлов:
```bash
cat default
cat uk-mini-app  # если есть такой файл
```

### 4. Найдите строки HTTPS редиректа:
Ищите строки типа:
```nginx
return 301 https://$server_name$request_uri;
rewrite ^(.*) https://$host$1 permanent;
```

### 5. Закомментируйте эти строки:
Добавьте `#` в начало строки:
```nginx
# return 301 https://$server_name$request_uri;
# rewrite ^(.*) https://$host$1 permanent;
```

### 6. Проверьте конфигурацию:
```bash
nginx -t
```

### 7. Перезапустите nginx:
```bash
systemctl reload nginx
```

## 🔍 Что искать в файлах:

### В файле `default` или `uk-mini-app` ищите:

**Секцию server для порта 80:**
```nginx
server {
    listen 80;
    server_name 217.199.252.227;
    
    # ЭТИ СТРОКИ НУЖНО ЗАКОММЕНТИРОВАТЬ:
    # return 301 https://$server_name$request_uri;
    # rewrite ^(.*) https://$host$1 permanent;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Секцию server для порта 443 (если есть):**
```nginx
server {
    listen 443 ssl;
    server_name 217.199.252.227;
    
    # SSL настройки...
    
    location / {
        proxy_pass http://localhost:3000;
    }
    
    location /api {
        proxy_pass http://localhost:8000;
    }
}
```

## ⚠️ Важно:
- Закомментируйте ТОЛЬКО строки редиректа с HTTPS
- НЕ трогайте настройки proxy_pass
- После изменений обязательно проверьте конфигурацию командой `nginx -t`

## 📞 Если нужна помощь:
Скопируйте содержимое файла конфигурации и отправьте мне - я помогу найти проблемные строки. 
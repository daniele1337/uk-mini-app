# Настройка QR-кода авторизации

## 🔧 **Что нужно сделать для работы QR-кода:**

### 1. **Настроить обработку команды start в боте**

Бот должен обрабатывать команду `/start qr_SESSION_ID` и отправлять данные на сервер.

### 2. **Добавить обработчик в бота**

В боте нужно добавить обработчик для QR-авторизации:

```python
# Пример обработчика для Python
@bot.message_handler(commands=['start'])
def handle_start(message):
    text = message.text
    if text.startswith('/start qr_'):
        session_id = text.replace('/start qr_', '')
        # Отправляем данные на сервер
        send_qr_auth_data(session_id, message.from_user)
    else:
        # Обычная команда start
        bot.reply_to(message, "Добро пожаловать!")
```

### 3. **Функция отправки данных авторизации**

```python
def send_qr_auth_data(session_id, user):
    """Отправка данных авторизации на сервер"""
    url = 'https://24autoflow.ru/api/auth/qr-login'
    data = {
        'session_id': session_id,
        'telegram_id': user.id,
        'first_name': user.first_name,
        'last_name': user.last_name or '',
        'username': user.username or ''
    }
    
    try:
        response = requests.post(url, json=data)
        if response.status_code == 200:
            bot.reply_to(user, "✅ Авторизация успешна! Можете закрыть это окно.")
        else:
            bot.reply_to(user, "❌ Ошибка авторизации. Попробуйте еще раз.")
    except Exception as e:
        bot.reply_to(user, "❌ Ошибка подключения к серверу.")
```

## 🚨 **Важно:**

- Бот должен быть доступен и работать
- Сервер должен быть доступен по HTTPS
- Сессии QR-кода действительны 5 минут

## 🔍 **Отладка:**

1. Проверьте логи бота
2. Проверьте логи сервера
3. Убедитесь, что API endpoints работают

## 📱 **Поддержка:**

- QR-код работает в браузере
- Telegram Mini App работает автоматически
- Альтернативные кнопки для входа

## 🎯 **Результат:**

После настройки пользователи смогут:
1. Открыть сайт в браузере
2. Отсканировать QR-код в Telegram
3. Автоматически войти в систему
4. Использовать приложение в браузере

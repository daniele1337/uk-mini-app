# 📝 Создание .env файла

Создайте файл `.env` в корне проекта со следующим содержимым:

```bash
TELEGRAM_BOT_TOKEN=8172377647:AAE6MS5TBL-tZKBWs1A3WPECef48cl_SgnU
```

## Команды для создания:

### Windows (PowerShell):
```powershell
echo "TELEGRAM_BOT_TOKEN=8172377647:AAE6MS5TBL-tZKBWs1A3WPECef48cl_SgnU" > .env
```

### Linux/Mac:
```bash
echo "TELEGRAM_BOT_TOKEN=8172377647:AAE6MS5TBL-tZKBWs1A3WPECef48cl_SgnU" > .env
```

### Или создайте файл вручную:
1. Создайте файл `.env` в корне проекта
2. Добавьте строку: `TELEGRAM_BOT_TOKEN=8172377647:AAE6MS5TBL-tZKBWs1A3WPECef48cl_SgnU`
3. Сохраните файл

## Проверка:
```bash
cat .env
```

Должно показать:
```
TELEGRAM_BOT_TOKEN=8172377647:AAE6MS5TBL-tZKBWs1A3WPECef48cl_SgnU
```

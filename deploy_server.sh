#!/bin/bash

# Скрипт автоматической настройки сервера для Telegram Mini App
# Выполните: ssh root@2a03:6f00:a::1:17a6
# Затем скопируйте и выполните этот скрипт

echo "🚀 Начинаю настройку сервера для Telegram Mini App..."

# Обновление системы
echo "📦 Обновление системы..."
apt update && apt upgrade -y

# Установка необходимого ПО
echo "🔧 Установка необходимого ПО..."
apt install -y python3 python3-pip nodejs npm nginx certbot python3-certbot-nginx git curl wget unzip

# Проверка версий
echo "✅ Проверка установленных версий..."
python3 --version
node --version
npm --version
nginx -v

# Создание структуры директорий
echo "📁 Создание структуры директорий..."
mkdir -p /var/www/uk-mini-app
cd /var/www/uk-mini-app

# Создание пользователя для приложения
echo "👤 Создание пользователя для приложения..."
useradd -m -s /bin/bash ukapp
usermod -aG sudo ukapp

# Настройка Nginx
echo "🌐 Настройка Nginx..."
cat > /etc/nginx/sites-available/uk-mini-app << 'EOF'
server {
    listen 80;
    server_name 2a03:6f00:a::1:17a6;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Активация сайта
ln -sf /etc/nginx/sites-available/uk-mini-app /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Настройка Nginx
sed -i 's/worker_processes auto;/worker_processes 1;/' /etc/nginx/nginx.conf
sed -i 's/worker_connections 768;/worker_connections 512;/' /etc/nginx/nginx.conf

# Установка PM2
echo "⚡ Установка PM2..."
npm install -g pm2

# Создание директорий для приложения
mkdir -p /var/www/uk-mini-app/frontend
mkdir -p /var/www/uk-mini-app/backend
mkdir -p /var/www/uk-mini-app/logs

# Настройка прав доступа
chown -R ukapp:ukapp /var/www/uk-mini-app
chmod -R 755 /var/www/uk-mini-app

# Создание файла конфигурации PM2
cat > /var/www/uk-mini-app/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'uk-mini-app-frontend',
      cwd: '/var/www/uk-mini-app/frontend',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      max_memory_restart: '800M',
      instances: 1,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'uk-mini-app-backend',
      cwd: '/var/www/uk-mini-app/backend',
      script: 'python3',
      args: 'app.py',
      env: {
        FLASK_ENV: 'production',
        FLASK_APP: 'app.py'
      },
      max_memory_restart: '400M',
      instances: 1,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
EOF

# Создание скрипта для загрузки кода
cat > /var/www/uk-mini-app/deploy.sh << 'EOF'
#!/bin/bash

echo "📥 Загрузка кода приложения..."

# Переход в директорию проекта
cd /var/www/uk-mini-app

# Создание requirements.txt для Python
cat > backend/requirements.txt << 'PYTHON_REQUIREMENTS'
Flask==2.3.3
Flask-SQLAlchemy==3.0.5
Flask-CORS==4.0.0
PyJWT==2.8.0
pandas==2.0.3
openpyxl==3.1.2
opencv-python==4.8.1.78
pytesseract==0.3.10
Pillow==10.0.1
python-dotenv==1.0.0
PYTHON_REQUIREMENTS

# Создание package.json для Node.js
cat > frontend/package.json << 'NODE_PACKAGE'
{
  "name": "uk-mini-app-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "start": "vite preview --host 0.0.0.0 --port 3000"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.1",
    "axios": "^1.3.4",
    "lucide-react": "^0.263.1"
  },
  "devDependencies": {
    "@types/react": "^18.0.28",
    "@types/react-dom": "^18.0.11",
    "@vitejs/plugin-react": "^3.1.0",
    "autoprefixer": "^10.4.14",
    "postcss": "^8.4.21",
    "tailwindcss": "^3.2.7",
    "vite": "^4.1.0"
  }
}
NODE_PACKAGE

echo "✅ Файлы конфигурации созданы"
echo "📝 Теперь нужно загрузить код приложения в директории:"
echo "   Frontend: /var/www/uk-mini-app/frontend/"
echo "   Backend: /var/www/uk-mini-app/backend/"
EOF

chmod +x /var/www/uk-mini-app/deploy.sh

# Создание скрипта для запуска
cat > /var/www/uk-mini-app/start.sh << 'EOF'
#!/bin/bash

echo "🚀 Запуск приложения..."

cd /var/www/uk-mini-app

# Установка зависимостей
echo "📦 Установка Python зависимостей..."
cd backend
pip3 install -r requirements.txt

echo "📦 Установка Node.js зависимостей..."
cd ../frontend
npm install

# Сборка frontend
echo "🔨 Сборка frontend..."
npm run build

# Запуск через PM2
echo "⚡ Запуск через PM2..."
cd ..
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "✅ Приложение запущено!"
echo "🌐 Frontend: http://2a03:6f00:a::1:17a6"
echo "🔧 Backend API: http://2a03:6f00:a::1:17a6/api/"
EOF

chmod +x /var/www/uk-mini-app/start.sh

# Настройка автозапуска
echo "🔄 Настройка автозапуска..."
systemctl enable nginx
systemctl start nginx

# Создание SSL сертификата (если нужно)
echo "🔒 Настройка SSL..."
certbot --nginx -d 2a03:6f00:a::1:17a6 --non-interactive --agree-tos --email admin@example.com

echo "✅ Настройка сервера завершена!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Загрузите код приложения в /var/www/uk-mini-app/"
echo "2. Выполните: cd /var/www/uk-mini-app && ./deploy.sh"
echo "3. Выполните: ./start.sh"
echo ""
echo "🌐 URL для Telegram Mini App:"
echo "   https://2a03:6f00:a::1:17a6"
echo ""
echo "📱 Для тестирования откройте в браузере:"
echo "   http://2a03:6f00:a::1:17a6" 
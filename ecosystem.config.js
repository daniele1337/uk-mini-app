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
      min_uptime: '10s',
      error_file: '/var/log/pm2/frontend-error.log',
      out_file: '/var/log/pm2/frontend-out.log'
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
      min_uptime: '10s',
      error_file: '/var/log/pm2/backend-error.log',
      out_file: '/var/log/pm2/backend-out.log'
    }
  ]
};

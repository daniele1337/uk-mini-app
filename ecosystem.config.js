module.exports = {
  apps: [
    {
      name: 'uk-mini-app-backend',
      script: 'app.py',
      interpreter: 'python3',
      env: {
        FLASK_ENV: 'production',
        PORT: 5000
      },
      args: '--host 0.0.0.0 --port 5000'
    },
    {
      name: 'uk-mini-app-frontend',
      script: 'npx',
      args: 'serve dist -l 3000',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
}

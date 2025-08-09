module.exports = {
  apps: [
    {
      name: 'uk-mini-app-backend',
      script: 'app.py',
      interpreter: 'python3',
      env: {
        FLASK_ENV: 'production',
        PORT: 8000
      },
      args: '--host 0.0.0.0 --port 8000'
    },
    {
      name: 'uk-mini-app-frontend',
      script: 'python3',
      args: '-m http.server 3000',
      cwd: './dist',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
}

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
<<<<<<< Updated upstream:vite.config.js
    host: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
=======
    allowedHosts: ['24autoflow.ru', 'www.24autoflow.ru', '217.199.252.227']
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: ['24autoflow.ru', 'www.24autoflow.ru', '217.199.252.227']
>>>>>>> Stashed changes:frontend/vite.config.js
  }
}) 
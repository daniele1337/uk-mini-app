import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: ['24autoflow.ru', 'www.24autoflow.ru', '217.199.252.227', 'localhost']
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: ['24autoflow.ru', 'www.24autoflow.ru', '217.199.252.227', 'localhost']
  }
}) 
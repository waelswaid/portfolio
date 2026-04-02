import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api/auth': 'http://auth-service:8000',
      '/api/users': 'http://auth-service:8000',
      '/api/admin': 'http://auth-service:8000',
      '/health': 'http://auth-service:8000',
    },
  },
})

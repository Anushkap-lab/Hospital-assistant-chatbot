import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/chatbot': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/book-appointment': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/appointments': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})

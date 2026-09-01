import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// El frontend siempre pide a rutas relativas /api/... (nunca a un host+puerto escrito a mano).
// En desarrollo, quien traduce /api hacia el backend es ESTE proxy de Vite.
// En el contenedor (TP2), quien lo traduce es nginx (ver frontend/nginx.conf).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
})

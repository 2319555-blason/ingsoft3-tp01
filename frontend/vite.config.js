import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// El frontend siempre pide a rutas relativas /api/... (nunca a un host+puerto escrito a mano).
// En desarrollo, quien traduce /api hacia el backend es ESTE proxy de Vite.
// En el contenedor (TP2), quien lo traduce es nginx (ver frontend/nginx.conf).
export default defineConfig({
  plugins: [react()],
  // Configuración de vitest (tests unitarios, sin navegador)
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      // Qué ENTRA en la cuenta: la lógica del front. Quedan afuera, a propósito:
      // - pages/ y App.jsx: son vista (JSX), se prueban con tests de componentes/e2e, no unitarios sin DOM
      // - main.jsx: el arranque (monta React en el HTML)
      // - constants.js: sólo datos
      // - api/client.js: adaptador fino sobre fetch; en los tests se reemplaza por un doble
      include: ['src/logic/**/*.js'],
      exclude: ['src/**/*.test.js'],
      // text: tabla en la terminal · html: reporte navegable · json-summary: para el resumen del pipeline
      reporter: ['text', 'html', 'json-summary']
    }
  },
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

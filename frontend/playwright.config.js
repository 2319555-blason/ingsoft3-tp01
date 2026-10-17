import { defineConfig } from '@playwright/test'

// Una sola herramienta para las DOS suites (TP7):
// - e2e/api.spec.js     -> integración: pedidos HTTP a la api de QA, sin navegador (fixture `request`)
// - e2e/records.spec.js -> e2e: un navegador de verdad usando el front de QA
// Cada job del pipeline corre SU archivo por nombre.
export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,              // tope de CADA test: QA del plan gratis puede estar despertando
  expect: { timeout: 20_000 },  // tope de CADA aserción (el default es 5 s): espera sin sleeps
  use: {
    // La URL del FRONT sale de una variable, no está escrita en el código.
    // La de la api es otra (API_BASE_URL) y la lee api.spec.js.
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:8080',
    trace: 'on-first-retry',        // si un test falla, en el reintento se graba la traza
    screenshot: 'only-on-failure'   // captura de pantalla de cada fallo, en el reporte
  },
  retries: 1,                   // absorbe una demora suelta; si pasa recién al reintentar, sale "flaky"
  reporter: [['html', { open: 'never' }], ['list']]
})

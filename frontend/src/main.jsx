import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import * as Sentry from '@sentry/react'

// TP9: Sentry en el front. El DSN de un front NO es secreto: sólo sirve para ENVIAR datos
// y viaja igual en el JavaScript que baja el navegador.
Sentry.init({
  dsn: 'https://909e85b9a7bfce5ce8efda35d9860f66@o4512290602942464.ingest.us.sentry.io/4512294805700608',
  environment: window.location.hostname, // de qué sitio vino: QA, PROD o localhost
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 1.0
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)

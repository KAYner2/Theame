import { createRoot } from 'react-dom/client'
import React from 'react'           // нужно только если включишь StrictMode
import App from './App'
import './index.css'

window.addEventListener('error', (e) => {
  console.error('[window.onerror]', e.message, e.error)
})
window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
  console.error('[unhandledrejection]', e.reason)
})

createRoot(document.getElementById('root')!).render(
  // Опционально: поможет выявить лишние сайд-эффекты в dev
  // <React.StrictMode>
    <App />
  // </React.StrictMode>
)
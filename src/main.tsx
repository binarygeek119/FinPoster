import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

let rootEl = document.getElementById('root')
if (!rootEl) {
  rootEl = document.createElement('div')
  rootEl.id = 'root'
  document.body.prepend(rootEl)
}
createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

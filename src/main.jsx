import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'azure-maps-control/dist/atlas.min.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

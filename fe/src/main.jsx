import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.jsx'
import './i18n' // Import i18n configuration

import { BrowserRouter, HashRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'

const isCapacitor = window.hasOwnProperty('Capacitor') || navigator.userAgent.includes('Capacitor') || window.location.protocol === 'file:';
const RouterComponent = isCapacitor ? HashRouter : BrowserRouter;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterComponent>
      <AuthProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </AuthProvider>
    </RouterComponent>
  </StrictMode>,
)

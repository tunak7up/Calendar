import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.jsx'
import './i18n' // Import i18n configuration

import { polyfill } from 'mobile-drag-drop'
import { scrollBehaviourDragImageTranslateOverride } from 'mobile-drag-drop/scroll-behaviour'
import 'mobile-drag-drop/default.css'

polyfill({
  dragImageTranslateOverride: scrollBehaviourDragImageTranslateOverride,
  holdToDrag: 200
});

import { BrowserRouter, HashRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { PWAProvider } from './context/PWAContext'
import { Capacitor } from '@capacitor/core'

const isCapacitor = Capacitor.isNativePlatform();
const RouterComponent = isCapacitor ? HashRouter : BrowserRouter;

// Register Service Worker for PWA (Handled automatically by OneSignal SDK v16 after initialization to prevent appId query conflicts)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterComponent>
      <AuthProvider>
        <ThemeProvider>
          <PWAProvider>
            <App />
          </PWAProvider>
        </ThemeProvider>
      </AuthProvider>
    </RouterComponent>
  </StrictMode>,
)

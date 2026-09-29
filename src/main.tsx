import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { NotificationProvider } from './context/NotificationContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { initCloudRealtimeSync } from './utils/cloudRealtimeClient';
import { registerSW } from 'virtual:pwa-register';
import './index.css';

// Register PWA Service Worker for Offline Workstation capability
registerSW({
  immediate: true,
  onOfflineReady() {
    console.log('[PWA] Vasthusilpy Workstation is ready to work offline.');
  }
});

// Initialize Instantaneous Universal Cloud Realtime Sync & Deletion Registry
initCloudRealtimeSync();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <NotificationProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </NotificationProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
);



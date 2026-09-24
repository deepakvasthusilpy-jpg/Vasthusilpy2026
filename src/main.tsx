import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { NotificationProvider } from './context/NotificationContext';
import { initCloudRealtimeSync } from './utils/cloudRealtimeClient';
import './index.css';

// Initialize Instantaneous Universal Cloud Realtime Sync & Deletion Registry
initCloudRealtimeSync();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <NotificationProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </NotificationProvider>
      </LanguageProvider>
    </ThemeProvider>
  </StrictMode>,
);



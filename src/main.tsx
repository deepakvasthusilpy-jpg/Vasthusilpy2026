import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { NotificationProvider } from './context/NotificationContext';
import { ViewModeProvider } from './context/ViewModeContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <NotificationProvider>
          <AuthProvider>
            <ViewModeProvider>
              <App />
            </ViewModeProvider>
          </AuthProvider>
        </NotificationProvider>
      </LanguageProvider>
    </ThemeProvider>
  </StrictMode>,
);



import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './providers/AuthProvider';
import { AppRouter } from './router/AppRouter';
import { ToastProvider } from './components/ToastProvider';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider>
      <ToastProvider>
        <BrowserRouter>
          <AuthProvider>
            <AppRouter />
          </AuthProvider>
        </BrowserRouter>
      </ToastProvider>
    </MantineProvider>
  </StrictMode>
);

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './index.css';

// Register service worker with auto-update
registerSW({
  onOfflineReady() {
    console.log('App ready to work offline');
  },
  onRegistered(registration: ServiceWorkerRegistration | undefined) {
    console.log('Service worker registered:', registration);
  },
  onRegisterError(error: Error) {
    console.error('Service worker registration error:', error);
  },
});

const queryClient = new QueryClient();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);

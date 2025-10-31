import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import { ResponsiveRoot } from './ResponsiveRoot';
import { SolanaWalletProvider } from './providers/SolanaWalletProvider';
import { StreamProvider } from './contexts/StreamContext';
import { useThemeStore } from './store/themeStore';
import { useAccessibilityStore } from './store/accessibilityStore';
import { DiagnosticsProvider } from './providers/DiagnosticsProvider';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import './index.css';

const initializeApp = () => {
  useThemeStore.getState().applyThemeColors();
  useAccessibilityStore.getState().applyAccessibilitySettings();
};

initializeApp();

const sentryIntegrations = import.meta.env.VITE_SENTRY_DSN
  ? [
      new BrowserTracing({
        tracePropagationTargets: ['localhost', /^https:\/\//, /^http:\/\//],
      }),
    ]
  : [];

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || undefined,
  integrations: sentryIntegrations,
  environment: import.meta.env.MODE,
  tracesSampleRate: import.meta.env.MODE === 'production' ? 0.2 : 0.0,
  enabled: Boolean(import.meta.env.VITE_SENTRY_DSN),
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StreamProvider>
      <SolanaWalletProvider>
        <DiagnosticsProvider>
          <ErrorBoundary>
            <ResponsiveRoot />
          </ErrorBoundary>
        </DiagnosticsProvider>
      </SolanaWalletProvider>
    </StreamProvider>
  </React.StrictMode>
);

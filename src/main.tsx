import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { SolanaWalletProvider } from './providers/SolanaWalletProvider';
import { StreamProvider } from './contexts/StreamContext';
import { useThemeStore } from './store/themeStore';
import { useAccessibilityStore } from './store/accessibilityStore';
import './index.css';

const initializeApp = () => {
  useThemeStore.getState().applyThemeColors();
  useAccessibilityStore.getState().applyAccessibilitySettings();
};

initializeApp();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StreamProvider>
      <SolanaWalletProvider>
        <App />
      </SolanaWalletProvider>
    </StreamProvider>
  </React.StrictMode>
);

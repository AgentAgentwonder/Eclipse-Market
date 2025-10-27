import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { SolanaWalletProvider } from './providers/SolanaWalletProvider';
import { StreamProvider } from './contexts/StreamContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StreamProvider>
      <SolanaWalletProvider>
        <App />
      </SolanaWalletProvider>
    </StreamProvider>
  </React.StrictMode>
);

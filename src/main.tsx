import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { SolanaWalletProvider } from './providers/SolanaWalletProvider';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SolanaWalletProvider>
      <App />
    </SolanaWalletProvider>
  </React.StrictMode>
);

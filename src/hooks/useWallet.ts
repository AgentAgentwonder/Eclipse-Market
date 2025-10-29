import { useWallet as useAdapterWallet } from '@solana/wallet-adapter-react';
import { WalletReadyState } from '@solana/wallet-adapter-base';
import { useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

import { useWalletStore } from '../store/walletStore';

export function useWallet() {
  const { publicKey, balance, status, error, setBalance, setStatus, setError, reset } =
    useWalletStore();

  const { connect: adapterConnect, disconnect: adapterDisconnect, readyState } = useAdapterWallet();

  const loading = status === 'connecting';
  const wallet = publicKey;

  const loadBalance = useCallback(async () => {
    if (!wallet) return;
    try {
      const bal = await invoke<number>('phantom_balance', { address: wallet });
      setBalance(bal);
    } catch (e) {
      console.error('Failed to load balance:', e);
    }
  }, [wallet, setBalance]);

  useEffect(() => {
    if (wallet && status === 'connected') {
      loadBalance();
      const interval = setInterval(loadBalance, 15000);
      return () => clearInterval(interval);
    }
  }, [wallet, status, loadBalance]);

  const connectWallet = useCallback(async () => {
    if (readyState === WalletReadyState.Unsupported) {
      setError('Phantom wallet is not installed');
      setStatus('error');
      return;
    }

    try {
      setStatus('connecting');
      setError(null);
      await adapterConnect();
    } catch (e) {
      console.error('Failed to connect wallet via hook:', e);
      setError(e instanceof Error ? e.message : 'Unable to connect wallet');
      setStatus('error');
    }
  }, [adapterConnect, readyState, setError, setStatus]);

  const disconnectWallet = useCallback(async () => {
    try {
      await adapterDisconnect();
      await invoke('phantom_disconnect');
      reset();
    } catch (e) {
      console.error('Failed to disconnect:', e);
      setError('Unable to disconnect wallet');
    }
  }, [adapterDisconnect, reset, setError]);

  return {
    wallet,
    balance,
    loading,
    error,
    connected: status === 'connected',
    connectWallet,
    disconnectWallet,
    refresh: loadBalance,
  };
}

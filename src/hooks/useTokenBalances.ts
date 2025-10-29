import { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api';
import type { TokenBalance } from '../types/wallet';

export function useTokenBalances(address: string | null) {
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = useCallback(
    async (forceRefresh = false) => {
      if (!address) return;

      setLoading(true);
      setError(null);

      try {
        const result = await invoke<TokenBalance[]>('wallet_get_token_balances', {
          address,
          forceRefresh,
        });
        setBalances(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    },
    [address]
  );

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  return {
    balances,
    loading,
    error,
    refresh: () => fetchBalances(true),
  };
}

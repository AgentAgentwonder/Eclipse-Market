import { useEffect, useState, useCallback } from 'react';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/tauri';
import type {
  WalletActivity,
  ActivityFilter,
  MonitoredWallet,
  WalletStatistics,
} from '../types/insiders';

export function useWalletActivity(filter: ActivityFilter = {}, limit: number = 50) {
  const [activities, setActivities] = useState<WalletActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      const result = await invoke<WalletActivity[]>('wallet_monitor_get_activities', {
        filter,
        limit,
        offset,
      });
      setActivities(prev => {
        if (offset === 0) {
          return result;
        }
        const existingIds = new Set(prev.map(item => item.id));
        const merged = [...prev];
        result.forEach(item => {
          if (!existingIds.has(item.id)) {
            merged.push(item);
          }
        });
        return merged;
      });
      setHasMore(result.length === limit);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch activities:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [filter, limit, offset]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  useEffect(() => {
    setOffset(0);
    setHasMore(true);
  }, [filter, limit]);

  useEffect(() => {
    let unlisten: UnlistenFn | undefined;

    const setupListener = async () => {
      unlisten = await listen<WalletActivity>('wallet_activity', event => {
        const activity = event.payload;
        setActivities(prev => {
          const exists = prev.some(a => a.id === activity.id);
          if (exists) return prev;
          return [activity, ...prev].slice(0, limit);
        });
      });
    };

    setupListener();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [limit]);

  const loadMore = useCallback(() => {
    setOffset(prev => prev + limit);
  }, [limit]);

  const refresh = useCallback(() => {
    setOffset(0);
    fetchActivities();
  }, [fetchActivities]);

  return {
    activities,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}

export function useMonitoredWallets() {
  const [wallets, setWallets] = useState<MonitoredWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWallets = useCallback(async () => {
    try {
      setLoading(true);
      const result = await invoke<MonitoredWallet[]>('wallet_monitor_list_wallets');
      setWallets(result);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch monitored wallets:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  const addWallet = useCallback(
    async (
      wallet_address: string,
      label?: string,
      is_whale: boolean = false,
      min_transaction_size?: number
    ) => {
      try {
        await invoke('wallet_monitor_add_wallet', {
          request: { wallet_address, label, is_whale, min_transaction_size },
        });
        await fetchWallets();
      } catch (err) {
        console.error('Failed to add wallet:', err);
        throw err;
      }
    },
    [fetchWallets]
  );

  const updateWallet = useCallback(
    async (
      id: string,
      updates: {
        label?: string;
        is_whale?: boolean;
        is_active?: boolean;
        min_transaction_size?: number;
      }
    ) => {
      try {
        await invoke('wallet_monitor_update_wallet', {
          request: { id, ...updates },
        });
        await fetchWallets();
      } catch (err) {
        console.error('Failed to update wallet:', err);
        throw err;
      }
    },
    [fetchWallets]
  );

  const removeWallet = useCallback(
    async (id: string) => {
      try {
        await invoke('wallet_monitor_remove_wallet', { id });
        await fetchWallets();
      } catch (err) {
        console.error('Failed to remove wallet:', err);
        throw err;
      }
    },
    [fetchWallets]
  );

  return {
    wallets,
    loading,
    error,
    addWallet,
    updateWallet,
    removeWallet,
    refresh: fetchWallets,
  };
}

export function useWalletStatistics(walletAddress: string | null) {
  const [statistics, setStatistics] = useState<WalletStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = useCallback(async () => {
    if (!walletAddress) return;

    try {
      setLoading(true);
      const result = await invoke<WalletStatistics>('wallet_monitor_get_statistics', {
        walletAddress,
      });
      setStatistics(result);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return {
    statistics,
    loading,
    error,
    refresh: fetchStatistics,
  };
}

import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import type {
  SmartMoneyWallet,
  SmartMoneyClassification,
  SmartMoneyConsensus,
  SentimentComparison,
  WhaleAlert,
  AlertConfig,
} from '../types/smartMoney';

export function useSmartMoneyWallets() {
  const [wallets, setWallets] = useState<SmartMoneyWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWallets = useCallback(async () => {
    try {
      setLoading(true);
      const result = await invoke<SmartMoneyWallet[]>('get_smart_money_wallets');
      setWallets(result);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch smart money wallets:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  useEffect(() => {
    let unlisten: UnlistenFn | undefined;

    const setupListener = async () => {
      unlisten = await listen<SmartMoneyClassification>('smart_money_classification', event => {
        const classification = event.payload;
        if (classification.is_smart_money) {
          fetchWallets();
        }
      });
    };

    setupListener();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [fetchWallets]);

  const scanForSmartMoney = useCallback(async () => {
    try {
      setLoading(true);
      const result = await invoke<SmartMoneyClassification[]>('scan_wallets_for_smart_money');
      await fetchWallets();
      return result;
    } catch (err) {
      console.error('Failed to scan for smart money:', err);
      setError(err instanceof Error ? err.message : String(err));
      return [];
    } finally {
      setLoading(false);
    }
  }, [fetchWallets]);

  return {
    wallets,
    loading,
    error,
    refresh: fetchWallets,
    scanForSmartMoney,
  };
}

export function useSmartMoneyConsensus(timeWindowHours: number = 24) {
  const [consensus, setConsensus] = useState<SmartMoneyConsensus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConsensus = useCallback(async () => {
    try {
      setLoading(true);
      const result = await invoke<SmartMoneyConsensus[]>('get_smart_money_consensus', {
        timeWindowHours,
      });
      setConsensus(result);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch smart money consensus:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [timeWindowHours]);

  useEffect(() => {
    fetchConsensus();
    const interval = setInterval(fetchConsensus, 60000); // Refresh every minute

    return () => {
      clearInterval(interval);
    };
  }, [fetchConsensus]);

  return {
    consensus,
    loading,
    error,
    refresh: fetchConsensus,
  };
}

export function useSentimentComparison(tokenMint: string | null) {
  const [comparison, setComparison] = useState<SentimentComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComparison = useCallback(async () => {
    if (!tokenMint) {
      setComparison(null);
      return;
    }

    try {
      setLoading(true);
      const result = await invoke<SentimentComparison>('get_sentiment_comparison', {
        tokenMint,
      });
      setComparison(result);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch sentiment comparison:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [tokenMint]);

  useEffect(() => {
    fetchComparison();
  }, [fetchComparison]);

  return {
    comparison,
    loading,
    error,
    refresh: fetchComparison,
  };
}

export function useWhaleAlerts(limit: number = 50) {
  const [alerts, setAlerts] = useState<WhaleAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const result = await invoke<WhaleAlert[]>('get_recent_whale_alerts', { limit });
      setAlerts(result);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch whale alerts:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  useEffect(() => {
    let unlisten: UnlistenFn | undefined;

    const setupListener = async () => {
      unlisten = await listen<WhaleAlert>('whale_alert', event => {
        const alert = event.payload;
        setAlerts(prev => [alert, ...prev].slice(0, limit));
      });
    };

    setupListener();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [limit]);

  return {
    alerts,
    loading,
    error,
    refresh: fetchAlerts,
  };
}

export function useAlertConfigs() {
  const [configs, setConfigs] = useState<AlertConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfigs = useCallback(async () => {
    try {
      setLoading(true);
      const result = await invoke<AlertConfig[]>('get_alert_configs');
      setConfigs(result);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch alert configs:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const updateConfig = useCallback(
    async (config: AlertConfig) => {
      try {
        await invoke('update_alert_config', { config });
        await fetchConfigs();
      } catch (err) {
        console.error('Failed to update alert config:', err);
        throw err;
      }
    },
    [fetchConfigs]
  );

  return {
    configs,
    loading,
    error,
    updateConfig,
    refresh: fetchConfigs,
  };
}

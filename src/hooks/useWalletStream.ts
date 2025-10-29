import { useEffect, useMemo, useState } from 'react';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { useStream } from '../contexts/StreamContext';

export interface TransactionUpdate {
  signature: string;
  slot: number;
  timestamp: number;
  typ: string | null;
  amount: number | null;
  symbol: string | null;
  from: string | null;
  to: string | null;
}

interface UseWalletStreamOptions {
  filterTypes?: string[];
  historySize?: number;
}

export function useWalletStream(addresses: string[], options?: UseWalletStreamOptions) {
  const [transactions, setTransactions] = useState<TransactionUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { subscribeWallets, unsubscribeWallets, preferences } = useStream();

  const filterTypes = useMemo(() => options?.filterTypes || [], [options?.filterTypes]);
  const historySize = options?.historySize ?? 100;

  const addressKey = useMemo(() => addresses.join(','), [addresses]);

  useEffect(() => {
    if (addresses.length === 0) {
      setLoading(false);
      return;
    }

    let mounted = true;
    let unlisten: UnlistenFn | undefined;

    const subscribe = async () => {
      try {
        if (!preferences.enableWalletStream) {
          setLoading(false);
          return;
        }

        await subscribeWallets(addresses);
        setLoading(false);
        setError(null);

        unlisten = await listen<TransactionUpdate>('transaction_update', event => {
          if (!mounted) return;
          const payload = event.payload;

          if (filterTypes.length > 0 && payload.typ && !filterTypes.includes(payload.typ)) {
            return;
          }

          setTransactions(prev => {
            const updated = [payload, ...prev];
            return updated.slice(0, historySize);
          });
        });
      } catch (err) {
        console.error('Failed to subscribe to wallet stream:', err);
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      }
    };

    subscribe();

    return () => {
      mounted = false;
      if (unlisten) {
        unlisten();
      }
      unsubscribeWallets(addresses).catch(err => {
        console.error('Failed to unsubscribe from wallet stream:', err);
      });
    };
  }, [
    addressKey,
    filterTypes,
    historySize,
    subscribeWallets,
    unsubscribeWallets,
    addresses,
    preferences.enableWalletStream,
  ]);

  return {
    transactions,
    loading,
    error,
  };
}

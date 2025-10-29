import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { listen, UnlistenFn } from '@tauri-apps/api/event';

export interface ChartDataPoint {
  timestamp: number;
  price: number;
  volume: number;
  change_24h: number;
}

interface ChartPriceUpdate {
  symbol: string;
  price: number;
  volume: number;
  timestamp: number;
  change_24h: number;
}

interface UseRealtimeChartOptions {
  symbol: string;
  intervalMs?: number; // Update frequency (1000 = 1 second)
  maxDataPoints?: number; // Maximum data points to keep (default: 1000)
  enabled?: boolean; // Enable/disable streaming
}

interface UseRealtimeChartReturn {
  priceData: ChartDataPoint[];
  isStreaming: boolean;
  lastUpdate: number | null;
  error: string | null;
  toggleStreaming: () => void;
  clearData: () => void;
}

const MAX_DATA_POINTS_DEFAULT = 1000;

export function useRealtimeChart(options: UseRealtimeChartOptions): UseRealtimeChartReturn {
  const {
    symbol,
    intervalMs = 1000,
    maxDataPoints = MAX_DATA_POINTS_DEFAULT,
    enabled = true,
  } = options;

  const [priceData, setPriceData] = useState<ChartDataPoint[]>([]);
  const [isStreaming, setIsStreaming] = useState(enabled);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const unlistenRef = useRef<UnlistenFn | null>(null);
  const pendingUpdatesRef = useRef<ChartDataPoint[]>([]);
  const rafRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  // Throttled batch update using requestAnimationFrame
  const flushPendingUpdates = useCallback(() => {
    if (pendingUpdatesRef.current.length === 0) {
      rafRef.current = null;
      return;
    }

    const updates = [...pendingUpdatesRef.current];
    pendingUpdatesRef.current = [];

    setPriceData(prev => {
      const combined = [...prev, ...updates];
      // Keep only the last maxDataPoints to prevent memory issues
      return combined.slice(-maxDataPoints);
    });

    rafRef.current = null;
  }, [maxDataPoints]);

  const scheduleFlush = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (rafRef.current !== null) return;

    rafRef.current = window.requestAnimationFrame(() => {
      flushPendingUpdates();
    });
  }, [flushPendingUpdates]);

  const toggleStreaming = useCallback(() => {
    setIsStreaming(prev => !prev);
  }, []);

  const clearData = useCallback(() => {
    setPriceData([]);
    setLastUpdate(null);
    pendingUpdatesRef.current = [];
    if (typeof window !== 'undefined' && rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(() => {
    setIsStreaming(enabled);
  }, [enabled]);

  useEffect(() => {
    setPriceData([]);
    pendingUpdatesRef.current = [];
  }, [symbol]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isStreaming || !symbol) {
      return;
    }

    let mounted = true;

    const subscribe = async () => {
      try {
        // Subscribe to chart price updates
        await invoke('subscribe_chart_prices', {
          symbol,
          intervalMs,
        });

        // Listen for chart_price_update events
        const unlisten = await listen<ChartPriceUpdate>('chart_price_update', event => {
          if (!mounted || !mountedRef.current) return;

          const update = event.payload;
          if (update.symbol !== symbol) return;

          const dataPoint: ChartDataPoint = {
            timestamp: update.timestamp,
            price: update.price,
            volume: update.volume,
            change_24h: update.change_24h,
          };

          // Add to pending updates
          pendingUpdatesRef.current.push(dataPoint);
          setLastUpdate(Date.now());
          scheduleFlush();
        });

        unlistenRef.current = unlisten;
        setError(null);
      } catch (err) {
        console.error('Failed to subscribe to chart prices:', err);
        setError(err instanceof Error ? err.message : String(err));
      }
    };

    subscribe();

    return () => {
      mounted = false;

      if (unlistenRef.current) {
        unlistenRef.current();
        unlistenRef.current = null;
      }

      // Unsubscribe from backend
      invoke('unsubscribe_chart_prices', { symbol }).catch(err => {
        console.error('Failed to unsubscribe from chart prices:', err);
      });

      // Cancel any pending RAF
      if (typeof window !== 'undefined' && rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [symbol, intervalMs, isStreaming, scheduleFlush]);

  return {
    priceData,
    isStreaming,
    lastUpdate,
    error,
    toggleStreaming,
    clearData,
  };
}

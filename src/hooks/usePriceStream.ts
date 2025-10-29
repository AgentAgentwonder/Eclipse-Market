import { useEffect, useMemo, useRef, useState } from 'react';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { useStream } from '../contexts/StreamContext';

const CACHE_KEY = 'stream.price.cache';
const CACHE_TTL = 30_000;

interface PriceDelta {
  symbol: string;
  price?: number | null;
  change?: number | null;
  volume?: number | null;
  ts: number;
  snapshot: boolean;
}

interface PriceData {
  price: number;
  change: number;
  volume: number | null;
  timestamp: number;
}

interface CachedPriceData extends PriceData {
  cachedAt: number;
}

export function usePriceStream(symbols: string[]) {
  const { subscribePrices, unsubscribePrices, preferences } = useStream();
  const [prices, setPrices] = useState<Map<string, PriceData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pendingRef = useRef<Map<string, PriceDelta>>(new Map());
  const rafRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<Map<string, number>>(new Map());
  const throttleRef = useRef<number>(preferences.priceThrottleMs ?? 100);

  useEffect(() => {
    throttleRef.current = preferences.priceThrottleMs ?? 100;
  }, [preferences.priceThrottleMs]);

  // Hydrate local cache with TTL
  useEffect(() => {
    if (symbols.length === 0) {
      setLoading(false);
      return;
    }

    if (typeof window === 'undefined') return;

    try {
      const raw = window.sessionStorage.getItem(CACHE_KEY);
      if (!raw) return;

      const cache = JSON.parse(raw) as Record<string, CachedPriceData>;
      const now = Date.now();
      const hydrated = new Map<string, PriceData>();

      symbols.forEach(symbol => {
        const cached = cache[symbol];
        if (cached && now - cached.cachedAt <= CACHE_TTL) {
          hydrated.set(symbol, {
            price: cached.price,
            change: cached.change,
            volume: cached.volume,
            timestamp: cached.timestamp,
          });
          lastUpdateRef.current.set(symbol, now);
        }
      });

      if (hydrated.size > 0) {
        setPrices(hydrated);
        setLoading(false);
      }
    } catch (err) {
      console.warn('Failed to hydrate price cache', err);
    }
  }, [symbols]);

  // Persist cache when prices change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const payload: Record<string, CachedPriceData> = {};
    const now = Date.now();
    prices.forEach((value, symbol) => {
      payload[symbol] = {
        ...value,
        cachedAt: now,
      };
    });
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  }, [prices]);

  const flushRef = useRef<() => void>(() => {});
  const scheduleFlushRef = useRef<() => void>(() => {});

  useEffect(() => {
    const flush = () => {
      const entries = Array.from(pendingRef.current.entries());
      if (entries.length === 0) {
        return;
      }
      pendingRef.current.clear();

      const now = Date.now();
      const requeue: Array<[string, PriceDelta]> = [];

      setPrices(prev => {
        const updated = new Map(prev);
        entries.forEach(([symbol, delta]) => {
          const last = lastUpdateRef.current.get(symbol) ?? 0;
          if (!delta.snapshot && now - last < throttleRef.current) {
            requeue.push([symbol, delta]);
            return;
          }

          const existing = prev.get(symbol);
          const base: PriceData = existing ?? {
            price: 0,
            change: 0,
            volume: null,
            timestamp: 0,
          };

          const nextPrice = delta.snapshot
            ? (delta.price ?? base.price)
            : delta.price !== undefined
              ? (delta.price ?? base.price)
              : base.price;

          const nextChange = delta.snapshot
            ? (delta.change ?? base.change)
            : delta.change !== undefined
              ? (delta.change ?? base.change)
              : base.change;

          const nextVolume = delta.snapshot
            ? delta.volume !== undefined
              ? (delta.volume ?? null)
              : base.volume
            : delta.volume !== undefined
              ? delta.volume
              : base.volume;

          updated.set(symbol, {
            price: nextPrice,
            change: nextChange,
            volume: nextVolume,
            timestamp: delta.ts,
          });
          lastUpdateRef.current.set(symbol, now);
        });
        return updated;
      });

      if (requeue.length > 0) {
        requeue.forEach(([symbol, delta]) => {
          pendingRef.current.set(symbol, delta);
        });
      }
    };

    const schedule = () => {
      if (typeof window === 'undefined') return;
      if (rafRef.current !== null) return;

      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        flushRef.current();
        if (pendingRef.current.size > 0) {
          scheduleFlushRef.current();
        }
      });
    };

    flushRef.current = flush;
    scheduleFlushRef.current = schedule;

    return () => {
      if (rafRef.current !== null && typeof window !== 'undefined') {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  const symbolKey = useMemo(() => symbols.join(','), [symbols]);
  const symbolSet = useMemo(() => new Set(symbols), [symbolKey]);

  useEffect(() => {
    if (symbols.length === 0) {
      setLoading(false);
      return;
    }

    let mounted = true;
    let unlisten: UnlistenFn | undefined;

    const subscribe = async () => {
      try {
        await subscribePrices(symbols);
        setLoading(false);
        setError(null);

        unlisten = await listen<PriceDelta>('price_update', event => {
          if (!mounted) return;

          const payload = event.payload;
          if (!symbolSet.has(payload.symbol)) {
            return;
          }

          pendingRef.current.set(payload.symbol, payload);
          scheduleFlushRef.current();
        });
      } catch (err) {
        console.error('Failed to subscribe to price stream:', err);
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
      unsubscribePrices(symbols).catch(err => {
        console.error('Failed to unsubscribe from price stream:', err);
      });
      if (rafRef.current !== null && typeof window !== 'undefined') {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      pendingRef.current.clear();
    };
  }, [symbolKey, symbolSet, subscribePrices, unsubscribePrices, symbols]);

  return useMemo(
    () => ({
      prices: Object.fromEntries(prices),
      loading,
      error,
    }),
    [prices, loading, error]
  );
}

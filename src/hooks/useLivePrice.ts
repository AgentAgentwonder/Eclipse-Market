import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';

interface PriceUpdate {
  symbol: string;
  price: number;
  change: number;
  timestamp: number;
}

export function useLivePrice(symbol: string) {
  const [price, setPrice] = useState<number>(0);
  const [change, setChange] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Start price stream
    invoke('start_price_stream', { symbol }).then(() => {
      setLoading(false);
    });

    // Listen for updates
    const unlisten = listen<PriceUpdate>('price-update', event => {
      if (event.payload.symbol === symbol) {
        setPrice(event.payload.price);
        setChange(event.payload.change);
      }
    });

    return () => {
      invoke('stop_price_stream', { symbol });
      unlisten.then(fn => fn());
    };
  }, [symbol]);

  return { price, change, loading };
}

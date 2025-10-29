import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';

interface PriceUpdate {
  symbol: string;
  price: number;
  change: number;
  timestamp: number;
}

interface LivePriceTickerProps {
  symbols: string[];
}

export default function LivePriceTicker({ symbols }: LivePriceTickerProps) {
  const [prices, setPrices] = useState<Map<string, PriceUpdate>>(new Map());

  useEffect(() => {
    // Start streams for all symbols
    symbols.forEach(symbol => {
      invoke('start_price_stream', { symbol });
    });

    // Listen for price updates
    const unlisten = listen<PriceUpdate>('price-update', event => {
      setPrices(prev => new Map(prev).set(event.payload.symbol, event.payload));
    });

    return () => {
      // Stop all streams
      symbols.forEach(symbol => {
        invoke('stop_price_stream', { symbol });
      });
      unlisten.then(fn => fn());
    };
  }, [symbols]);

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      <AnimatePresence>
        {Array.from(prices.values()).map(update => (
          <motion.div
            key={update.symbol}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex-shrink-0 px-4 py-3 rounded-xl bg-slate-800/50 border border-purple-500/20 min-w-[200px]"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400">{update.symbol}</div>
                <div className="text-xl font-bold">${update.price.toFixed(6)}</div>
              </div>
              <div
                className={`flex items-center gap-1 ${
                  update.change >= 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {update.change >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="text-sm font-semibold">
                  {update.change >= 0 ? '+' : ''}
                  {update.change.toFixed(2)}%
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

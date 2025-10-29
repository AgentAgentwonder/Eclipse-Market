import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, RefreshCw, AlertCircle } from 'lucide-react';
import type { TrendingStock } from '../../types/stocks';

interface TrendingStocksProps {
  selectedSymbol?: string;
  onSelect?: (symbol: string) => void;
}

export function TrendingStocks({ selectedSymbol, onSelect }: TrendingStocksProps) {
  const [stocks, setStocks] = useState<TrendingStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchTrendingStocks = async () => {
    try {
      const result = await invoke<TrendingStock[]>('get_trending_stocks');
      setStocks(result);
      setLastRefresh(new Date());

      if (result.length > 0 && onSelect && (!selectedSymbol || !result.some(stock => stock.symbol === selectedSymbol))) {
        onSelect(result[0].symbol);
      }
    } catch (error) {
      console.error('Failed to fetch trending stocks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendingStocks();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchTrendingStocks();
    }, 60000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleRefresh = () => {
    setLoading(true);
    fetchTrendingStocks();
  };

  const formatNumber = (num: number) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  if (loading && stocks.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Trending Stocks</h2>
          <p className="text-sm text-gray-400">Last updated: {lastRefresh.toLocaleTimeString()}</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={e => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh (60s)
          </label>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stocks.map((stock, idx) => (
          <motion.div
            key={stock.symbol}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border transition-all cursor-pointer ${
              selectedSymbol === stock.symbol
                ? 'border-purple-400/70 shadow-lg shadow-purple-500/20'
                : 'border-purple-500/20 hover:border-purple-500/40'
            }`}
            onClick={() => onSelect?.(stock.symbol)}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold">{stock.symbol}</h3>
                  {stock.unusualVolume && (
                    <AlertCircle className="w-4 h-4 text-yellow-400" />
                  )}
                </div>
                <p className="text-sm text-gray-400">{stock.name}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">${stock.price.toFixed(2)}</p>
                <div
                  className={`flex items-center gap-1 text-sm ${
                    stock.percentChange24h >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {stock.percentChange24h >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>{stock.percentChange24h.toFixed(2)}%</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <p className="text-xs text-gray-400">Volume</p>
                <p className="text-sm font-medium">{formatNumber(stock.volume)}</p>
                <p className={`text-xs ${stock.volumeChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {stock.volumeChange24h >= 0 ? '+' : ''}{stock.volumeChange24h.toFixed(1)}%
                </p>
              </div>
              {stock.marketCap && (
                <div>
                  <p className="text-xs text-gray-400">Market Cap</p>
                  <p className="text-sm font-medium">{formatNumber(stock.marketCap)}</p>
                </div>
              )}
            </div>

            {stock.reason && (
              <div className="mt-3 pt-3 border-t border-slate-700">
                <div className="flex items-start gap-2">
                  <Activity className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-300">{stock.reason}</p>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {stocks.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-400">
          <p>No trending stocks available</p>
        </div>
      )}
    </div>
  );
}

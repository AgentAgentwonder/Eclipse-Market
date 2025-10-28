import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, Eye, RefreshCw } from 'lucide-react';
import { QuickTradeButton } from '../trading/QuickTradeButton';

interface TrendingCoin {
  address: string;
  symbol: string;
  name: string;
  price: number;
  price_change_24h: number;
  volume_24h: number;
  volume_change_24h: number;
  market_cap: number;
  social_mentions: number;
  social_change_24h: number;
  rank: number;
}

interface TrendingCoinsProps {
  apiKey?: string;
  walletAddress?: string;
  onAddToWatchlist?: (address: string) => void;
  onNavigateToDetails?: (address: string) => void;
  watchlist?: Set<string>;
}

export function TrendingCoins({
  apiKey,
  walletAddress,
  onAddToWatchlist,
  onNavigateToDetails,
  watchlist = new Set(),
}: TrendingCoinsProps) {
  const [coins, setCoins] = useState<TrendingCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchTrendingCoins = async () => {
    try {
      const result = await invoke<TrendingCoin[]>('get_trending_coins', {
        apiKey: apiKey || null,
      });
      setCoins(result);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch trending coins:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendingCoins();
  }, [apiKey]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchTrendingCoins();
    }, 60000);

    return () => clearInterval(interval);
  }, [autoRefresh, apiKey]);

  const handleRefresh = () => {
    setLoading(true);
    fetchTrendingCoins();
  };

  if (loading && coins.length === 0) {
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
          <h2 className="text-xl font-bold">Trending Coins</h2>
          <p className="text-sm text-gray-400">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
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
        {coins.map((coin, idx) => (
          <motion.div
            key={coin.address}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-purple-500/20 hover:border-purple-500/40 transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-purple-400">#{coin.rank}</span>
                  <span className="text-xl font-bold">{coin.symbol}</span>
                </div>
                <div className="text-sm text-gray-400">{coin.name}</div>
              </div>
              <div
                className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                  coin.price_change_24h > 0
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {coin.price_change_24h > 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {Math.abs(coin.price_change_24h).toFixed(2)}%
              </div>
            </div>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Price</span>
                <span className="font-bold">${coin.price.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Volume</span>
                <span className="font-bold">
                  ${(coin.volume_24h / 1_000_000).toFixed(2)}M
                  {coin.volume_change_24h !== 0 && (
                    <span
                      className={`ml-1 text-xs ${
                        coin.volume_change_24h > 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      ({coin.volume_change_24h > 0 ? '+' : ''}
                      {coin.volume_change_24h.toFixed(1)}%)
                    </span>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Market Cap</span>
                <span className="font-bold">${(coin.market_cap / 1_000_000).toFixed(1)}M</span>
              </div>
              {coin.social_mentions > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400 flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    Social
                  </span>
                  <span className="font-bold">
                    {coin.social_mentions.toLocaleString()}
                    {coin.social_change_24h !== 0 && (
                      <span
                        className={`ml-1 text-xs ${
                          coin.social_change_24h > 0 ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        ({coin.social_change_24h > 0 ? '+' : ''}
                        {coin.social_change_24h.toFixed(0)}%)
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {walletAddress && (
                <QuickTradeButton
                  fromToken={{
                    symbol: 'SOL',
                    mint: 'So11111111111111111111111111111111111111112',
                    decimals: 9,
                  }}
                  toToken={{
                    symbol: coin.symbol,
                    mint: coin.address,
                    decimals: 9,
                  }}
                  side="buy"
                  walletAddress={walletAddress}
                  className="flex-1 text-sm"
                />
              )}
              {onAddToWatchlist && (
                <button
                  onClick={() => onAddToWatchlist(coin.address)}
                  className={`px-3 py-2 rounded-lg transition-colors ${watchlist.has(coin.address) ? 'bg-purple-500/30 text-purple-200 border border-purple-500/50' : 'bg-slate-700/50 hover:bg-slate-700'}`}
                  title={watchlist.has(coin.address) ? 'Remove from Watchlist' : 'Add to Watchlist'}
                >
                  <Eye className="w-4 h-4" />
                </button>
              )}
            </div>

            {onNavigateToDetails && (
              <button
                onClick={() => onNavigateToDetails(coin.address)}
                className="w-full mt-2 py-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-sm font-medium transition-all"
              >
                View Details
              </button>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';

interface TrendingCoin {
  address: string;
  symbol: string;
  name: string;
  price: number;
  price_change_24h: number;
  volume_24h: number;
  volume_change_24h: number;
  market_cap: number;
  market_cap_change_24h: number;
  liquidity: number;
  trend_score: number;
  logo_uri: string | null;
}

export function Trending() {
  const [coins, setCoins] = useState<TrendingCoin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrendingCoins = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch trending coins (limit to 20 as per ticket)
      const result = await invoke<TrendingCoin[]>('get_trending_coins', {
        limit: 20,
        apiKey: null, // Will use API key from config or fallback to mock data
      });

      setCoins(result);
    } catch (err) {
      console.error('Failed to fetch trending coins:', err);
      setError(err instanceof Error ? err.message : 'Failed to load trending coins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendingCoins();
  }, []);

  const formatPrice = (price: number) => {
    if (price < 0.01) return `$${price.toFixed(6)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(2)}`;
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  if (loading && coins.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-400" />
        <span className="ml-3 text-lg text-gray-400">Loading trending coins...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-red-400 mb-4">{error}</div>
        <button
          onClick={fetchTrendingCoins}
          className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Trending Coins</h1>
          <p className="text-gray-400">Top 20 trending tokens on Solana</p>
        </div>
        <button
          onClick={fetchTrendingCoins}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Simple table */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-purple-500/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900/50 border-b border-purple-500/20">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">#</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Name</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-400">Price</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-400">
                  24h Change
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-400">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-500/10">
              {coins.map((coin, index) => (
                <tr key={coin.address} className="hover:bg-purple-500/5 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-400">{index + 1}</td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-semibold text-white">{coin.symbol}</div>
                      <div className="text-sm text-gray-400">{coin.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-white">
                    {formatPrice(coin.price)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span
                      className={`inline-flex items-center gap-1 font-semibold ${
                        coin.price_change_24h >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {coin.price_change_24h >= 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      {formatChange(coin.price_change_24h)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => {
                        // Copy address to clipboard
                        navigator.clipboard.writeText(coin.address);
                      }}
                      className="px-3 py-1 text-sm bg-purple-500/20 hover:bg-purple-500/30 rounded transition-colors"
                    >
                      Copy Address
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer info */}
      <div className="text-sm text-gray-400 text-center">
        Data sourced from Birdeye API. Refresh to update.
      </div>
    </div>
  );
}

export default Trending;

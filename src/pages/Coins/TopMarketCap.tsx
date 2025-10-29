import { useCallback, useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { QuickTradeButton } from '../../components/trading/QuickTradeButton';
import { Sparkline } from '../../components/coins/Sparkline';
import { formatCurrencyAbbrev, normalizeSparkline } from './utils';
import { motion } from 'framer-motion';
import { Trophy, ArrowUpCircle, ArrowDownCircle, Eye, RefreshCw } from 'lucide-react';

interface TopCoin {
  rank: number;
  address: string;
  symbol: string;
  name: string;
  price: number;
  price_change_24h: number;
  market_cap: number;
  volume_24h: number;
  liquidity?: number | null;
  circulating_supply?: number | null;
  sparkline: number[];
}

interface TopMarketCapProps {
  apiKey?: string;
  walletAddress?: string;
  onAddToWatchlist?: (address: string) => void;
  onNavigateToDetails?: (address: string) => void;
  watchlist?: Set<string>;
}

const PAGE_SIZE = 20;

export function TopMarketCap({
  apiKey,
  walletAddress,
  onAddToWatchlist,
  onNavigateToDetails,
  watchlist = new Set(),
}: TopMarketCapProps) {
  const [coins, setCoins] = useState<TopCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [refreshToken, setRefreshToken] = useState(Date.now());
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const fetchCoins = useCallback(async () => {
    if (!hasMore && offset !== 0) return;
    setLoading(true);

    try {
      const result = await invoke<TopCoin[]>('get_top_coins', {
        limit: PAGE_SIZE,
        offset,
        apiKey: apiKey || null,
      });

      if (offset === 0) {
        setCoins(result);
      } else {
        setCoins(prev => {
          const existingAddresses = new Set(prev.map(coin => coin.address));
          const filtered = result.filter(coin => !existingAddresses.has(coin.address));
          return [...prev, ...filtered];
        });
      }

      if (result.length < PAGE_SIZE) {
        setHasMore(false);
      } else {
        setOffset(prev => prev + PAGE_SIZE);
      }
    } catch (error) {
      console.error('Failed to fetch top coins:', error);
    } finally {
      setLoading(false);
    }
  }, [apiKey, offset, hasMore]);

  useEffect(() => {
    setCoins([]);
    setOffset(0);
    setHasMore(true);
    fetchCoins();
  }, [apiKey, refreshToken]);

  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          fetchCoins();
        }
      },
      {
        rootMargin: '200px',
        threshold: 0.1,
      }
    );

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [fetchCoins, loading, hasMore]);

  const handleRefresh = () => {
    setRefreshToken(Date.now());
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Top Market Cap Tokens
          </h2>
          <p className="text-sm text-gray-400">Top 100 Solana tokens by market cap (5 min cache)</p>
        </div>
        <button
          onClick={handleRefresh}
          className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-purple-500/20">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-900/70">
            <tr>
              <th className="px-4 py-3 text-left text-gray-400 font-medium">Rank</th>
              <th className="px-4 py-3 text-left text-gray-400 font-medium">Token</th>
              <th className="px-4 py-3 text-right text-gray-400 font-medium">Price</th>
              <th className="px-4 py-3 text-right text-gray-400 font-medium">24h</th>
              <th className="px-4 py-3 text-right text-gray-400 font-medium">Market Cap</th>
              <th className="px-4 py-3 text-right text-gray-400 font-medium">Volume 24h</th>
              <th className="px-4 py-3 text-right text-gray-400 font-medium">Liquidity</th>
              <th className="px-4 py-3 text-center text-gray-400 font-medium">7D Trend</th>
              <th className="px-4 py-3 text-right text-gray-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {coins.map(coin => {
              const isPositive = coin.price_change_24h >= 0;
              return (
                <tr
                  key={`${coin.rank}-${coin.address}`}
                  className="hover:bg-slate-800/40 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full bg-purple-500/10 text-purple-300 text-xs font-semibold">
                      #{coin.rank}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-semibold text-white">{coin.symbol}</div>
                      <div className="text-xs text-gray-400">{coin.name}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    $
                    {coin.price.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 6,
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                        isPositive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                      }`}
                    >
                      {isPositive ? (
                        <ArrowUpCircle className="w-3 h-3" />
                      ) : (
                        <ArrowDownCircle className="w-3 h-3" />
                      )}
                      {coin.price_change_24h.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    ${formatCurrencyAbbrev(coin.market_cap, 2)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    ${formatCurrencyAbbrev(coin.volume_24h, 1)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {coin.liquidity ? `${formatCurrencyAbbrev(coin.liquidity, 2)}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Sparkline
                      data={normalizeSparkline(coin.sparkline, 24)}
                      width={120}
                      height={32}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
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
                          className="text-xs"
                        />
                      )}
                      {onAddToWatchlist && (
                        <button
                          onClick={() => onAddToWatchlist(coin.address)}
                          className="p-2 rounded-lg bg-slate-700/60 hover:bg-slate-700 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      {onNavigateToDetails && (
                        <button
                          onClick={() => onNavigateToDetails(coin.address)}
                          className="px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-medium"
                        >
                          Details
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div
        ref={sentinelRef}
        className="h-10 flex items-center justify-center text-sm text-gray-400"
      >
        {loading ? 'Loading more tokens...' : hasMore ? 'Scroll to load more' : 'End of list'}
      </div>
    </div>
  );
}

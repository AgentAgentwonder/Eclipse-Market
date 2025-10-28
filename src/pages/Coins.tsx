import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, TrendingUp, Zap, BarChart3 } from 'lucide-react';
import { invoke } from '@tauri-apps/api/tauri';
import { TrendingCoins } from './Coins/TrendingCoins';
import { NewCoins } from './Coins/NewCoins';
import { TopMarketCap } from './Coins/TopMarketCap';
import { useWalletStore } from '../store/walletStore';

export default function Coins() {
  const [activeTab, setActiveTab] = useState('trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [apiKey] = useState<string | null>(null);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const activeWallet = useWalletStore((state) => state.activeWallet);

  useEffect(() => {
    invoke<string[]>('get_watchlist')
      .then((result) => setWatchlist(result))
      .catch((error) => console.error('Failed to load watchlist:', error));
  }, []);

  const handleToggleWatchlist = async (address: string) => {
    try {
      if (watchlist.includes(address)) {
        await invoke('remove_from_watchlist', { address });
        setWatchlist((prev) => prev.filter((item) => item !== address));
      } else {
        await invoke('add_to_watchlist', { address });
        setWatchlist((prev) => [...prev, address]);
      }
    } catch (error) {
      console.error('Failed to update watchlist:', error);
    }
  };

  const handleNavigateToDetails = (address: string) => {
    console.log('Navigate to details:', address);
  };

  const watchlistSet = useMemo(() => new Set(watchlist), [watchlist]);
import { useEffect, useMemo, useState } from 'react'
import { Search, TrendingUp, Zap, BarChart3, X, Loader2 } from 'lucide-react'
import { invoke } from '@tauri-apps/api/tauri'
import TrendingCoins, { TrendingCoinData } from './Coins/TrendingCoins'
import PriceChart from '../components/PriceChart'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, TrendingUp, Zap, BarChart3 } from 'lucide-react'
import NewCoins from './Coins/NewCoins'
import TopCoins from './Coins/TopCoins'

interface PricePoint {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export default function Coins() {
  const [activeTab, setActiveTab] = useState('trending')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCoin, setSelectedCoin] = useState<TrendingCoinData | null>(null)
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M'>('1D')
  const apiKey = useMemo(() => (typeof window !== 'undefined' ? localStorage.getItem('birdeye_api_key') : null), [])

  useEffect(() => {
    if (!selectedCoin) return

    const fetchHistory = async () => {
      try {
        setHistoryLoading(true)
        setHistoryError(null)
        const params: Record<string, unknown> = {
          address: selectedCoin.address,
          timeframe,
        }
        if (apiKey) {
          params.apiKey = apiKey
        }

        const data = await invoke<PricePoint[]>('get_price_history', params)
        setPriceHistory(data)
      } catch (err) {
        console.error('Failed to fetch price history:', err)
        setHistoryError(String(err))
      } finally {
        setHistoryLoading(false)
      }
    }

    fetchHistory()
  }, [selectedCoin, timeframe, apiKey])

  const filteredCoins = mockCoins.filter((coin) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return coin.symbol.toLowerCase().includes(query) || coin.name.toLowerCase().includes(query)
  })

  const displayedCoins = filteredCoins

  const tabMeta = {
    trending: {
      title: 'Coins Market',
      subtitle: 'Real-time cryptocurrency tracking and analysis',
    },
    new: {
      title: 'Coin Discovery',
      subtitle: 'New Solana token launches with safety insights',
    },
    top: {
      title: 'Top Coins by Market Cap',
      subtitle: 'Top 100 Solana tokens ranked by market capitalization',
    },
  } as const

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            {tabMeta[activeTab as keyof typeof tabMeta].title}
          </h1>
          <p className="text-gray-400">
            {tabMeta[activeTab as keyof typeof tabMeta].subtitle}
          </p>
        </div>
        {activeTab === 'trending' && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search coins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-80 rounded-xl bg-slate-800/50 border border-purple-500/30 outline-none focus:border-purple-500 transition-all"
            />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4">
        {[
          { id: 'trending', label: 'Trending', icon: TrendingUp },
          { id: 'new', label: 'New Coins', icon: Zap },
          { id: 'top', label: 'Top Market Cap', icon: BarChart3 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'hover:bg-slate-700/30 text-gray-400'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'trending' && (
          <TrendingCoins
            apiKey={apiKey || undefined}
            walletAddress={activeWallet?.address}
            onAddToWatchlist={handleToggleWatchlist}
            onNavigateToDetails={handleNavigateToDetails}
            watchlist={watchlistSet}
          />
        )}
        {activeTab === 'new' && (
          <NewCoins
            apiKey={apiKey || undefined}
            walletAddress={activeWallet?.address}
            onAddToWatchlist={handleToggleWatchlist}
            onNavigateToDetails={handleNavigateToDetails}
            watchlist={watchlistSet}
          />
        )}
        {activeTab === 'top' && (
          <TopMarketCap
            apiKey={apiKey || undefined}
            walletAddress={activeWallet?.address}
            onAddToWatchlist={handleToggleWatchlist}
            onNavigateToDetails={handleNavigateToDetails}
            watchlist={watchlistSet}
          />
        )}
      </motion.div>
      {/* Tab Content */}
      {activeTab === 'trending' && <TrendingCoins searchQuery={searchQuery} onSelectCoin={setSelectedCoin} />}
      
      {activeTab === 'new' && (
        <div className="text-center py-12">
          <Zap className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-400">New Coins feature coming soon...</p>
        </div>
      )}
      
      {activeTab === 'top' && (
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-400">Top Coins feature coming soon...</p>
        </div>
      )}

      {/* Chart Modal */}
      {selectedCoin && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setSelectedCoin(null)}
        >
          <div
            className="bg-slate-900 rounded-2xl border border-purple-500/20 max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-purple-500/20 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">{selectedCoin.symbol}</h3>
                <p className="text-gray-400">{selectedCoin.name}</p>
              </div>
              <button
                onClick={() => setSelectedCoin(null)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                {(['1D', '1W', '1M'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      timeframe === tf
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-slate-800/50 text-gray-400 hover:bg-slate-800'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>

              {historyLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                </div>
              ) : historyError ? (
                <div className="text-center text-red-400 py-12">{historyError}</div>
              ) : priceHistory.length > 0 ? (
                <PriceChart data={priceHistory} symbol={selectedCoin.symbol} />
              ) : (
                <div className="text-center text-gray-400 py-12">No data available</div>
              )}
            </div>
          </div>
      {activeTab === 'new' ? (
        <NewCoins />
      ) : activeTab === 'top' ? (
        <TopCoins />
      ) : (
        /* Coins Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedCoins.map((coin, idx) => (
            <motion.div
              key={coin.address}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ scale: 1.02 }}
              className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20 shadow-xl hover:shadow-purple-500/20 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-2xl font-bold">{coin.symbol}</div>
                  <div className="text-sm text-gray-400">{coin.name}</div>
                </div>
                <div className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                  coin.price_change_24h > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {coin.price_change_24h > 0 ? '+' : ''}{coin.price_change_24h.toFixed(2)}%
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Price</span>
                  <span className="font-bold">${coin.price.toFixed(6)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Market Cap</span>
                  <span className="font-bold">${(coin.market_cap / 1_000_000).toFixed(1)}M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Volume 24h</span>
                  <span className="font-bold">${(coin.volume_24h / 1_000).toFixed(1)}K</span>
                </div>
              </div>

              <button className="w-full mt-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-medium transition-all">
                View Chart
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

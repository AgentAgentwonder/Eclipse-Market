import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, TrendingUp, Zap, BarChart3 } from 'lucide-react';
import { invoke } from '@tauri-apps/api/tauri';
import { TrendingCoins } from './Coins/TrendingCoins';
import { NewCoins } from './Coins/NewCoins';
import { TopMarketCap } from './Coins/TopMarketCap';
import TokenDetail from './TokenDetail';
import { useWalletStore } from '../store/walletStore';

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
};

export default function Coins() {
  const [activeTab, setActiveTab] = useState('trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [apiKey] = useState<string | null>(null);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const activeWallet = useWalletStore(state => state.activeWallet);

  useEffect(() => {
    invoke<string[]>('get_watchlist')
      .then(result => setWatchlist(result))
      .catch(error => console.error('Failed to load watchlist:', error));
  }, []);

  const handleToggleWatchlist = async (address: string) => {
    try {
      if (watchlist.includes(address)) {
        await invoke('remove_from_watchlist', { address });
        setWatchlist(prev => prev.filter(item => item !== address));
      } else {
        await invoke('add_to_watchlist', { address });
        setWatchlist(prev => [...prev, address]);
      }
    } catch (error) {
      console.error('Failed to update watchlist:', error);
    }
  };

  const handleNavigateToDetails = (address: string) => {
    setSelectedToken(address);
  };

  const handleBackToList = () => {
    setSelectedToken(null);
  };

  const watchlistSet = useMemo(() => new Set(watchlist), [watchlist]);

  // If a token is selected, show the detail view
  if (selectedToken) {
    return <TokenDetail tokenAddress={selectedToken} onBack={handleBackToList} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            {tabMeta[activeTab as keyof typeof tabMeta].title}
          </h1>
          <p className="text-gray-400">{tabMeta[activeTab as keyof typeof tabMeta].subtitle}</p>
        </div>
        {activeTab === 'trending' && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search coins..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
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
        ].map(tab => (
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
    </div>
  );
}

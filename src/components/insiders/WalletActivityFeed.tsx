import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpCircle,
  ArrowDownCircle,
  ArrowRightLeft,
  Copy,
  Filter,
  Loader2,
  TrendingUp,
  Wallet,
  ExternalLink,
  Settings,
} from 'lucide-react';
import { useWalletActivity, useMonitoredWallets } from '../../hooks/useWalletActivity';
import { WalletActivity, ActivityAction } from '../../types/insiders';
import { CopyTradeModal } from './CopyTradeModal';
import { WalletMonitorSettings } from './WalletMonitorSettings';
import { VirtualizedList } from './VirtualizedList';
import { formatDistance } from 'date-fns';

const ACTION_ICONS: Record<ActivityAction, typeof ArrowUpCircle> = {
  buy: ArrowUpCircle,
  sell: ArrowDownCircle,
  transfer: ArrowRightLeft,
  swap: ArrowRightLeft,
  unknown: Wallet,
};

const ACTION_COLORS: Record<ActivityAction, string> = {
  buy: 'text-green-400',
  sell: 'text-red-400',
  transfer: 'text-blue-400',
  swap: 'text-purple-400',
  unknown: 'text-gray-400',
};

const ACTION_BG: Record<ActivityAction, string> = {
  buy: 'bg-green-500/20 border-green-500/30',
  sell: 'bg-red-500/20 border-red-500/30',
  transfer: 'bg-blue-500/20 border-blue-500/30',
  swap: 'bg-purple-500/20 border-purple-500/30',
  unknown: 'bg-gray-500/20 border-gray-500/30',
};

export function WalletActivityFeed() {
  const [filterWallet, setFilterWallet] = useState<string | null>(null);
  const [filterAction, setFilterAction] = useState<ActivityAction | null>(null);
  const [minAmount, setMinAmount] = useState<number | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<WalletActivity | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const filter = useMemo(
    () => ({
      wallets: filterWallet ? [filterWallet] : undefined,
      actions: filterAction ? [filterAction] : undefined,
      min_amount_usd: minAmount || undefined,
    }),
    [filterWallet, filterAction, minAmount]
  );

  const { activities, loading, error, hasMore, loadMore, refresh } = useWalletActivity(filter, 50);
  const { wallets, loading: walletsLoading } = useMonitoredWallets();

  const groupedActivities = useMemo(() => {
    const groups: Record<string, WalletActivity[]> = {};
    activities.forEach(activity => {
      const key = `${activity.wallet_address}-${activity.output_mint || 'none'}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(activity);
    });
    return Object.entries(groups).map(([key, items]) => ({
      key,
      activities: items,
      wallet: items[0].wallet_address,
      walletLabel: items[0].wallet_label,
      isWhale: items[0].is_whale,
      token: items[0].output_symbol || 'Unknown',
      totalAmount: items.reduce((sum, a) => sum + (a.amount_usd || 0), 0),
      count: items.length,
    }));
  }, [activities]);

  const handleCopyTrade = (activity: WalletActivity) => {
    setSelectedActivity(activity);
  };

  const formatAmount = (amount: number | undefined) => {
    if (!amount) return 'N/A';
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(2)}K`;
    return `$${amount.toFixed(2)}`;
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">Wallet Activity Feed</h2>
          <p className="text-gray-400 text-sm">Real-time monitoring of tracked wallets</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-colors ${
              showFilters
                ? 'bg-purple-500/20 text-purple-400'
                : 'bg-slate-700/50 hover:bg-slate-700 text-gray-400'
            }`}
          >
            <Filter className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors text-gray-400"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg font-medium transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-800/50 rounded-xl border border-purple-500/20 p-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Filter by Wallet</label>
                <select
                  value={filterWallet || ''}
                  onChange={e => setFilterWallet(e.target.value || null)}
                  className="w-full bg-slate-700 px-3 py-2 rounded-lg border border-slate-600"
                  disabled={walletsLoading}
                >
                  <option value="">All Wallets</option>
                  {wallets.map(wallet => (
                    <option key={wallet.id} value={wallet.wallet_address}>
                      {wallet.label || shortenAddress(wallet.wallet_address)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Filter by Action</label>
                <select
                  value={filterAction || ''}
                  onChange={e => setFilterAction((e.target.value as ActivityAction) || null)}
                  className="w-full bg-slate-700 px-3 py-2 rounded-lg border border-slate-600"
                >
                  <option value="">All Actions</option>
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                  <option value="transfer">Transfer</option>
                  <option value="swap">Swap</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Min Amount (USD)</label>
                <input
                  type="number"
                  value={minAmount || ''}
                  onChange={e => setMinAmount(e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="No minimum"
                  className="w-full bg-slate-700 px-3 py-2 rounded-lg border border-slate-600"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading && activities.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
          <p className="text-red-400">{error}</p>
          <button
            onClick={refresh}
            className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : activities.length === 0 ? (
        <div className="bg-slate-800/50 rounded-xl border border-purple-500/20 p-12 text-center">
          <Wallet className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">No Activity Yet</h3>
          <p className="text-gray-400 mb-4">Start monitoring wallets to see their activity here</p>
          <button
            onClick={() => setShowSettings(true)}
            className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg font-medium transition-colors"
          >
            Add Wallets
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <VirtualizedList
            items={groupedActivities}
            height={640}
            itemHeight={220}
            renderItem={(group, idx) => (
              <motion.div
                key={group.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx, 10) * 0.03 }}
                className="mb-3 last:mb-0 bg-slate-800/50 rounded-xl border border-purple-500/20 overflow-hidden hover:border-purple-500/40 transition-colors"
              >
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 relative">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold shadow-lg">
                        <Wallet className="w-6 h-6" />
                      </div>
                      {group.isWhale && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                          <TrendingUp className="w-3 h-3 text-black" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold font-mono text-sm">
                          {group.walletLabel || shortenAddress(group.wallet)}
                        </span>
                        {group.isWhale && (
                          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                            Whale
                          </span>
                        )}
                        {group.count > 1 && (
                          <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                            {group.count} txs
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-400">
                        Trading {group.token} • Total: {formatAmount(group.totalAmount)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {group.activities.slice(0, 3).map(activity => {
                      const ActionIcon = ACTION_ICONS[activity.type as ActivityAction] || Wallet;
                      return (
                        <div
                          key={activity.id}
                          className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg"
                        >
                          <div
                            className={`p-2 rounded-lg border ${
                              ACTION_BG[activity.type as ActivityAction]
                            }`}
                          >
                            <ActionIcon
                              className={`w-4 h-4 ${ACTION_COLORS[activity.type as ActivityAction]}`}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-medium capitalize">{activity.type}</span>
                              {activity.output_symbol && (
                                <span className="text-gray-400">• {activity.output_symbol}</span>
                              )}
                              {activity.amount_usd && (
                                <span className="text-purple-400 font-semibold">
                                  {formatAmount(activity.amount_usd)}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDistance(new Date(activity.timestamp), new Date(), {
                                addSuffix: true,
                              })}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                window.open(
                                  `https://solscan.io/tx/${activity.tx_signature}`,
                                  '_blank'
                                )
                              }
                              className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors"
                            >
                              <ExternalLink className="w-4 h-4 text-gray-400" />
                            </button>
                            <button
                              onClick={() => handleCopyTrade(activity)}
                              className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                            >
                              <Copy className="w-4 h-4" />
                              Copy
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {group.activities.length > 3 && (
                      <div className="text-center text-sm text-gray-400 py-2">
                        +{group.activities.length - 3} more transactions
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          />

          {hasMore && (
            <button
              onClick={loadMore}
              className="w-full py-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl border border-purple-500/20 text-gray-400 font-medium transition-colors"
            >
              Load More
            </button>
          )}
        </div>
      )}

      {selectedActivity && (
        <CopyTradeModal activity={selectedActivity} onClose={() => setSelectedActivity(null)} />
      )}

      {showSettings && <WalletMonitorSettings onClose={() => setShowSettings(false)} />}
    </div>
  );
}

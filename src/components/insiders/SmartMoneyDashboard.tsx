import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertCircle,
  Loader2,
  RefreshCw,
  Users,
  BarChart2,
} from 'lucide-react';
import { useSmartMoneyWallets, useSmartMoneyConsensus } from '../../hooks/useSmartMoney';
import { formatDistance } from 'date-fns';

export function SmartMoneyDashboard() {
  const { wallets, loading: walletsLoading, scanForSmartMoney } = useSmartMoneyWallets();
  const { consensus, loading: consensusLoading, refresh: refreshConsensus } = useSmartMoneyConsensus(24);
  const [scanning, setScanning] = useState(false);

  const handleScan = async () => {
    setScanning(true);
    try {
      await scanForSmartMoney();
    } finally {
      setScanning(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `$${(num / 1_000).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-gray-400';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-400" />
            Smart Money Dashboard
          </h2>
          <p className="text-gray-400 text-sm">
            Track high-performing wallets and their trading patterns
          </p>
        </div>
        <button
          onClick={handleScan}
          disabled={scanning}
          className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {scanning ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Scan Wallets
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 rounded-xl border border-purple-500/20 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Smart Money Wallets</p>
              <p className="text-2xl font-bold">{wallets.length}</p>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Wallets with &gt;60% win rate & &gt;100 trades
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 rounded-xl border border-purple-500/20 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Avg Win Rate</p>
              <p className="text-2xl font-bold text-green-400">
                {wallets.length > 0
                  ? `${((wallets.reduce((sum, w) => sum + w.win_rate, 0) / wallets.length) * 100).toFixed(1)}%`
                  : '0%'}
              </p>
            </div>
          </div>
          <div className="text-xs text-gray-500">Across all smart money wallets</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 rounded-xl border border-purple-500/20 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Activity className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Consensus Signals</p>
              <p className="text-2xl font-bold">{consensus.length}</p>
            </div>
          </div>
          <div className="text-xs text-gray-500">Active in last 24h</div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 rounded-xl border border-purple-500/20">
          <div className="px-6 py-4 border-b border-purple-500/20 flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              Top Smart Money Wallets
            </h3>
          </div>
          <div className="divide-y divide-slate-700">
            {walletsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
              </div>
            ) : wallets.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No smart money wallets detected yet</p>
                <p className="text-sm mt-2">Run a scan to identify high-performing wallets</p>
              </div>
            ) : (
              wallets.slice(0, 10).map((wallet, idx) => (
                <motion.div
                  key={wallet.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="px-6 py-4 hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold font-mono text-sm">
                        {wallet.label || `${wallet.wallet_address.slice(0, 8)}...${wallet.wallet_address.slice(-6)}`}
                      </p>
                      <p className="text-xs text-gray-500 font-mono">{wallet.wallet_address}</p>
                    </div>
                    <div className={`text-lg font-bold ${getScoreColor(wallet.smart_money_score)}`}>
                      {wallet.smart_money_score.toFixed(0)}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-gray-400 text-xs">Win Rate</p>
                      <p className="text-green-400 font-semibold">
                        {(wallet.win_rate * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Trades</p>
                      <p className="font-semibold">{wallet.total_trades}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Total P&L</p>
                      <p
                        className={`font-semibold ${
                          wallet.total_pnl > 0 ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {formatNumber(wallet.total_pnl)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-xl border border-purple-500/20">
          <div className="px-6 py-4 border-b border-purple-500/20 flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-blue-400" />
              Smart Money Consensus
            </h3>
            <button
              onClick={refreshConsensus}
              className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
            >
              Refresh
            </button>
          </div>
          <div className="divide-y divide-slate-700">
            {consensusLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
              </div>
            ) : consensus.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No consensus signals detected</p>
                <p className="text-sm mt-2">Smart money wallets haven't aligned on any tokens recently</p>
              </div>
            ) : (
              consensus.map((item, idx) => (
                <motion.div
                  key={`${item.token_mint}-${item.action}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="px-6 py-4 hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">
                          {item.token_symbol || item.token_mint.slice(0, 8)}
                        </p>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            item.action === 'buy'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {item.action.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {formatDistance(new Date(item.last_updated), new Date(), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-purple-400">
                        {item.consensus_strength.toFixed(0)}%
                      </p>
                      <p className="text-xs text-gray-500">Strength</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-gray-400 text-xs">Wallets</p>
                      <p className="font-semibold">{item.smart_wallets_count}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Volume</p>
                      <p className="font-semibold">{formatNumber(item.total_volume_usd)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Avg Price</p>
                      <p className="font-semibold">${item.avg_price.toFixed(4)}</p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

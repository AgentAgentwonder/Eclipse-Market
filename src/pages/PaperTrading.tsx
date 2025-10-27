import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Trophy,
  RefreshCw,
  BarChart3,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { usePaperTradingStore } from '../store/paperTradingStore';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

function PaperTrading() {
  const {
    enabled,
    account,
    balances,
    positions,
    tradeHistory,
    leaderboard,
    loading,
    error,
    checkStatus,
    loadAccount,
    loadBalances,
    loadPositions,
    loadTradeHistory,
    loadLeaderboard,
    resetAccount,
    clearError,
  } = usePaperTradingStore();

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetBalance, setResetBalance] = useState('10000');

  useEffect(() => {
    checkStatus();
    if (enabled) {
      loadAccount();
      loadBalances();
      loadPositions();
      loadTradeHistory(100);
      loadLeaderboard(10);
    }
  }, [enabled, checkStatus, loadAccount, loadBalances, loadPositions, loadTradeHistory, loadLeaderboard]);

  const handleReset = async () => {
    try {
      await resetAccount(parseFloat(resetBalance));
      setShowResetConfirm(false);
    } catch (err) {
      console.error('Failed to reset account:', err);
    }
  };

  const winRate = account
    ? account.total_trades > 0
      ? ((account.winning_trades / account.total_trades) * 100).toFixed(1)
      : '0.0'
    : '0.0';

  const pnlPercent = account
    ? account.initial_balance > 0
      ? ((account.total_pnl / account.initial_balance) * 100).toFixed(2)
      : '0.00'
    : '0.00';

  // Prepare chart data from trade history
  const chartData = tradeHistory
    .slice()
    .reverse()
    .reduce<{ date: string; pnl: number }[]>((acc, trade, idx) => {
      const date = new Date(trade.timestamp).toLocaleDateString();
      const prevPnL = acc.length > 0 ? acc[acc.length - 1].pnl : 0;
      acc.push({ date, pnl: prevPnL + trade.realized_pnl });
      return acc;
    }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Paper Trading Dashboard</h1>
          <p className="text-white/60">Practice trading with virtual funds</p>
        </div>
        <motion.button
          onClick={() => setShowResetConfirm(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl font-semibold text-red-400 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Reset Account
        </motion.button>
      </div>

      {/* Error Alert */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-400 text-sm font-medium">Error</p>
            <p className="text-red-400/80 text-sm mt-1">{error}</p>
          </div>
          <button
            onClick={clearError}
            className="text-red-400 hover:text-red-300 text-sm"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-purple-500/20 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-white/60">Total Balance</p>
              <p className="text-2xl font-bold">
                ${account?.current_value.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-purple-500/20 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                (account?.total_pnl || 0) >= 0
                  ? 'bg-gradient-to-br from-green-500 to-emerald-500'
                  : 'bg-gradient-to-br from-red-500 to-rose-500'
              }`}
            >
              {(account?.total_pnl || 0) >= 0 ? (
                <TrendingUp className="w-6 h-6" />
              ) : (
                <TrendingDown className="w-6 h-6" />
              )}
            </div>
            <div>
              <p className="text-sm text-white/60">Total P&L</p>
              <p
                className={`text-2xl font-bold ${
                  (account?.total_pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                ${account?.total_pnl.toFixed(2) || '0.00'} ({pnlPercent}%)
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-purple-500/20 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-white/60">Total Trades</p>
              <p className="text-2xl font-bold">{account?.total_trades || 0}</p>
              <p className="text-xs text-white/40">
                {account?.winning_trades || 0}W / {account?.losing_trades || 0}L
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-purple-500/20 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-white/60">Win Rate</p>
              <p className="text-2xl font-bold">{winRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* P&L Chart */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-purple-500/20 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">P&L Performance</h2>
            <p className="text-white/60 text-sm">Cumulative profit/loss over time</p>
          </div>
        </div>
        <div className="h-[300px]">
          {tradeHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis
                  dataKey="date"
                  stroke="rgba(255, 255, 255, 0.6)"
                  tick={{ fill: 'rgba(255, 255, 255, 0.6)' }}
                />
                <YAxis
                  stroke="rgba(255, 255, 255, 0.6)"
                  tick={{ fill: 'rgba(255, 255, 255, 0.6)' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    border: '1px solid rgba(168, 85, 247, 0.2)',
                    borderRadius: '0.75rem',
                  }}
                  labelStyle={{ color: 'rgba(255, 255, 255, 0.8)' }}
                />
                <Area
                  type="monotone"
                  dataKey="pnl"
                  stroke="#a855f7"
                  fillOpacity={1}
                  fill="url(#colorPnl)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-white/40">
              No trade history yet. Start trading to see your performance!
            </div>
          )}
        </div>
      </div>

      {/* Positions & Balances */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Balances */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-purple-500/20 p-6">
          <h3 className="text-xl font-bold mb-4">Balances</h3>
          <div className="space-y-2">
            {balances.length > 0 ? (
              balances.map((balance) => (
                <div
                  key={balance.currency}
                  className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl"
                >
                  <span className="font-medium">{balance.currency}</span>
                  <span className="text-white/80">{balance.amount.toFixed(6)}</span>
                </div>
              ))
            ) : (
              <p className="text-white/40 text-center py-4">No balances</p>
            )}
          </div>
        </div>

        {/* Positions */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-purple-500/20 p-6">
          <h3 className="text-xl font-bold mb-4">Open Positions</h3>
          <div className="space-y-2">
            {positions.length > 0 ? (
              positions.map((position) => (
                <div
                  key={position.symbol}
                  className="p-3 bg-slate-900/50 rounded-xl space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{position.symbol}</span>
                    <span
                      className={`font-semibold ${
                        position.unrealized_pnl >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {position.unrealized_pnl >= 0 ? '+' : ''}
                      {position.unrealized_pnl.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>Amount: {position.amount.toFixed(6)}</span>
                    <span>Avg: ${position.average_entry_price.toFixed(2)}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-white/40 text-center py-4">No open positions</p>
            )}
          </div>
        </div>
      </div>

      {/* Trade History */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-purple-500/20 p-6">
        <h3 className="text-xl font-bold mb-4">Trade History</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-purple-500/20">
                <th className="text-left p-3 text-sm font-semibold text-white/60">Date</th>
                <th className="text-left p-3 text-sm font-semibold text-white/60">Type</th>
                <th className="text-left p-3 text-sm font-semibold text-white/60">Pair</th>
                <th className="text-right p-3 text-sm font-semibold text-white/60">Amount</th>
                <th className="text-right p-3 text-sm font-semibold text-white/60">Price</th>
                <th className="text-right p-3 text-sm font-semibold text-white/60">Fee</th>
                <th className="text-right p-3 text-sm font-semibold text-white/60">P&L</th>
              </tr>
            </thead>
            <tbody>
              {tradeHistory.length > 0 ? (
                tradeHistory.slice(0, 20).map((trade) => (
                  <tr key={trade.id} className="border-b border-slate-700/50">
                    <td className="p-3 text-sm text-white/80">
                      {new Date(trade.timestamp).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          trade.trade_type === 'buy'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {trade.trade_type.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-white/80">
                      {trade.input_symbol}/{trade.output_symbol}
                    </td>
                    <td className="p-3 text-sm text-white/80 text-right">
                      {trade.input_amount.toFixed(6)}
                    </td>
                    <td className="p-3 text-sm text-white/80 text-right">
                      ${trade.price.toFixed(6)}
                    </td>
                    <td className="p-3 text-sm text-white/60 text-right">
                      ${trade.fee.toFixed(4)}
                    </td>
                    <td
                      className={`p-3 text-sm font-semibold text-right ${
                        trade.realized_pnl >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {trade.realized_pnl >= 0 ? '+' : ''}${trade.realized_pnl.toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-white/40">
                    No trades yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-purple-500/20 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Leaderboard</h3>
            <p className="text-white/60 text-sm">Top paper traders</p>
          </div>
        </div>
        <div className="space-y-2">
          {leaderboard.length > 0 ? (
            leaderboard.map((entry) => (
              <div
                key={entry.user_id}
                className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      entry.rank === 1
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : entry.rank === 2
                        ? 'bg-gray-400/20 text-gray-300'
                        : entry.rank === 3
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'bg-slate-700/50 text-white/60'
                    }`}
                  >
                    {entry.rank}
                  </span>
                  <span className="font-medium">{entry.username}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span
                    className={`font-semibold ${
                      entry.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    ${entry.total_pnl.toFixed(2)}
                  </span>
                  <span className="text-white/60">{entry.win_rate.toFixed(1)}%</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-white/40 text-center py-4">No leaderboard entries yet</p>
          )}
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800 rounded-3xl border border-purple-500/20 p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-2xl font-bold mb-4">Reset Paper Account</h3>
            <p className="text-white/60 mb-4">
              This will clear all your trades, positions, and reset your balance. This action
              cannot be undone.
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Initial Balance</label>
              <input
                type="number"
                value={resetBalance}
                onChange={(e) => setResetBalance(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
                placeholder="10000"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-3 bg-slate-700/50 hover:bg-slate-700 rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={loading}
                className="flex-1 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl font-semibold text-red-400 transition-colors disabled:opacity-50"
              >
                {loading ? 'Resetting...' : 'Reset'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default PaperTrading;

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Award,
  Target,
  BarChart3,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { usePaperTradingStore } from '../../store/paperTradingStore';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';

export function PaperTradingDashboard() {
  const [showResetModal, setShowResetModal] = useState(false);

  const {
    startingBalance,
    virtualBalance,
    trades,
    positions,
    getTotalPnL,
    getTotalPnLPercent,
    getBestTrade,
    getWorstTrade,
    getWinRate,
    getBalanceHistory,
    resetAccount,
  } = usePaperTradingStore();

  const totalPnL = getTotalPnL();
  const totalPnLPercent = getTotalPnLPercent();
  const bestTrade = getBestTrade();
  const worstTrade = getWorstTrade();
  const winRate = getWinRate();
  const balanceHistory = getBalanceHistory();

  const handleReset = () => {
    resetAccount();
    setShowResetModal(false);
  };

  // Prepare chart data
  const chartData = balanceHistory.map(entry => ({
    date: new Date(entry.timestamp).toLocaleDateString(),
    balance: Number(entry.balance.toFixed(2)),
  }));

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Paper Trading Dashboard</h1>
            <p className="text-white/60">Track your virtual trading performance</p>
          </div>
          <motion.button
            onClick={() => setShowResetModal(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl font-semibold text-red-400 transition-all"
          >
            <RotateCcw className="w-5 h-5" />
            Reset Account
          </motion.button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Virtual Balance */}
          <div className="bg-gradient-to-br from-orange-500/10 to-yellow-500/10 backdrop-blur-xl rounded-2xl border border-orange-500/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-white/60">Virtual Balance</p>
              <p className="text-3xl font-bold">${virtualBalance.toFixed(2)}</p>
              <p className="text-xs text-white/40">Starting: ${startingBalance.toFixed(2)}</p>
            </div>
          </div>

          {/* Total P&L */}
          <div
            className={`bg-gradient-to-br ${
              totalPnL >= 0
                ? 'from-green-500/10 to-emerald-500/10 border-green-500/20'
                : 'from-red-500/10 to-rose-500/10 border-red-500/20'
            } backdrop-blur-xl rounded-2xl border p-6`}
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                  totalPnL >= 0 ? 'from-green-500 to-emerald-500' : 'from-red-500 to-rose-500'
                } flex items-center justify-center`}
              >
                {totalPnL >= 0 ? (
                  <TrendingUp className="w-6 h-6" />
                ) : (
                  <TrendingDown className="w-6 h-6" />
                )}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-white/60">Total P&L</p>
              <p
                className={`text-3xl font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}
              >
                {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
              </p>
              <p className={`text-sm ${totalPnLPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {totalPnLPercent >= 0 ? '+' : ''}
                {totalPnLPercent.toFixed(2)}%
              </p>
            </div>
          </div>

          {/* Win Rate */}
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-xl rounded-2xl border border-blue-500/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Target className="w-6 h-6" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-white/60">Win Rate</p>
              <p className="text-3xl font-bold">{winRate.toFixed(1)}%</p>
              <p className="text-xs text-white/40">{trades.length} total trades</p>
            </div>
          </div>

          {/* Best Trade */}
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-white/60">Best Trade</p>
              {bestTrade ? (
                <>
                  <p className="text-3xl font-bold text-green-400">
                    +${(bestTrade.pnl || 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-white/40">
                    {bestTrade.fromToken}/{bestTrade.toToken}
                  </p>
                </>
              ) : (
                <p className="text-xl text-white/40">No trades yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Balance Chart */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-purple-500/20 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Balance Over Time</h2>
              <p className="text-white/60 text-sm">Your virtual portfolio value</p>
            </div>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(168, 85, 247, 0.1)" />
                <XAxis
                  dataKey="date"
                  stroke="rgba(255, 255, 255, 0.6)"
                  tick={{ fill: 'rgba(255, 255, 255, 0.6)' }}
                />
                <YAxis
                  stroke="rgba(255, 255, 255, 0.6)"
                  tick={{ fill: 'rgba(255, 255, 255, 0.6)' }}
                  tickFormatter={value => `${value}`}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(168, 85, 247, 0.2)',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'rgba(255, 255, 255, 0.9)' }}
                  itemStyle={{ color: 'rgba(255, 255, 255, 0.7)' }}
                />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke={totalPnL >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Open Positions */}
        {positions.length > 0 && (
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-purple-500/20 p-6">
            <h2 className="text-2xl font-bold mb-4">Open Positions</h2>
            <div className="space-y-3">
              {positions.map((position, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-slate-900/50 rounded-xl border border-purple-500/10 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="font-semibold">{position.token}</span>
                      <span className="text-sm text-white/60">
                        {position.amount.toFixed(4)} @ ${position.averagePrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div
                        className={`font-bold ${position.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}
                      >
                        {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)}
                      </div>
                      <div
                        className={`text-sm ${position.pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}
                      >
                        {position.pnlPercent >= 0 ? '+' : ''}
                        {position.pnlPercent.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Trades */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-purple-500/20 p-6">
          <h2 className="text-2xl font-bold mb-4">Recent Trades</h2>
          {trades.length === 0 ? (
            <div className="p-8 text-center text-white/40">
              <p>No trades yet. Start trading to see your history here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {trades.slice(0, 10).map(trade => (
                <div
                  key={trade.id}
                  className="p-4 bg-slate-900/50 rounded-xl border border-purple-500/10 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${
                        trade.side === 'buy'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {trade.side}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold">
                        {trade.fromToken} → {trade.toToken}
                      </span>
                      <span className="text-sm text-white/60">
                        {new Date(trade.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">
                      {trade.fromAmount.toFixed(4)} {trade.fromToken}
                    </div>
                    <div className="text-sm text-white/60">@ ${trade.price.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowResetModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
            >
              <div className="bg-slate-900 border border-red-500/30 rounded-2xl shadow-2xl">
                <div className="p-6 border-b border-red-500/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Reset Paper Trading Account</h3>
                      <p className="text-sm text-white/60">This action cannot be undone</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <p className="text-white/80">
                    Are you sure you want to reset your paper trading account? This will:
                  </p>
                  <ul className="space-y-2 text-sm text-white/60">
                    <li className="flex items-start gap-2">
                      <span className="text-red-400">•</span>
                      <span>Clear all trade history</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400">•</span>
                      <span>Close all open positions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400">•</span>
                      <span>Reset balance to ${startingBalance.toFixed(2)}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400">•</span>
                      <span>Reset all statistics</span>
                    </li>
                  </ul>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowResetModal(false)}
                      className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReset}
                      className="flex-1 py-3 bg-red-500 hover:bg-red-600 rounded-xl font-semibold transition-colors"
                    >
                      Reset Account
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

import { motion } from 'framer-motion';
import { Shield, Zap, TrendingUp, TrendingDown, ExternalLink, Clock } from 'lucide-react';
import { useTradingSettingsStore } from '../store/tradingSettingsStore';

export function TradeHistory() {
  const { tradeHistory, mevProtection } = useTradingSettingsStore();

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getSlippageColor = (slippage: number) => {
    if (slippage < 0.5) return 'text-green-400';
    if (slippage < 1) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getPriceImpactColor = (impact: number) => {
    if (impact < 1) return 'text-green-400';
    if (impact < 5) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-purple-500/20 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Trade History</h2>
          <p className="text-white/60 text-sm">Recent trades with execution details</p>
        </div>
        {mevProtection.enabled && (
          <div className="px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-green-400 font-semibold">MEV Protected Trades</span>
            </div>
            <div className="text-2xl font-bold text-green-400">{mevProtection.protectedTrades}</div>
          </div>
        )}
      </div>

      {tradeHistory.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-500/10 flex items-center justify-center">
            <Clock className="w-8 h-8 text-purple-400" />
          </div>
          <p className="text-white/60 text-lg">No trades yet</p>
          <p className="text-white/40 text-sm mt-2">Your trade history will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tradeHistory.map((trade, index) => (
            <motion.div
              key={trade.timestamp + index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 bg-slate-900/50 rounded-xl border border-purple-500/10 hover:border-purple-500/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold">
                      {trade.fromToken} → {trade.toToken}
                    </div>
                    <div className="text-sm text-white/60">{formatDate(trade.timestamp)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {trade.mevProtected && (
                    <div className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-1">
                      <Shield className="w-3 h-3 text-green-400" />
                      <span className="text-xs text-green-400 font-medium">Protected</span>
                    </div>
                  )}
                  {trade.txSignature && (
                    <a
                      href={`https://solscan.io/tx/${trade.txSignature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                      title="View on Solscan"
                    >
                      <ExternalLink className="w-4 h-4 text-purple-400" />
                    </a>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <div className="text-xs text-white/60 mb-1">Amount</div>
                  <div className="font-semibold">{trade.amount}</div>
                </div>

                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <div className="text-xs text-white/60 mb-1">Slippage</div>
                  <div className={`font-semibold ${getSlippageColor(trade.slippage)}`}>
                    {trade.slippage.toFixed(2)}%
                  </div>
                </div>

                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <div className="text-xs text-white/60 mb-1">Price Impact</div>
                  <div className={`font-semibold ${getPriceImpactColor(trade.priceImpact)}`}>
                    {trade.priceImpact.toFixed(2)}%
                  </div>
                </div>

                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <div className="text-xs text-white/60 mb-1 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Gas Cost
                  </div>
                  <div className="font-semibold">{trade.gasCost.toFixed(6)} SOL</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

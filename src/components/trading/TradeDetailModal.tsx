import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ExternalLink,
  Shield,
  Zap,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { EnhancedTradeMetrics } from '../../types/tradeReporting';
import { calculateExecutionQuality } from '../../utils/tradeFilters';

interface TradeDetailModalProps {
  trade: EnhancedTradeMetrics | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TradeDetailModal({ trade, isOpen, onClose }: TradeDetailModalProps) {
  if (!trade) return null;

  const executionQuality = calculateExecutionQuality(trade);

  const getStatusIcon = () => {
    switch (trade.status) {
      case 'filled':
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-400" />;
      case 'failed':
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'cancelled':
        return <X className="w-5 h-5 text-gray-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (trade.status) {
      case 'filled':
        return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'pending':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'failed':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'cancelled':
        return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getExecutionQualityColor = (quality: string) => {
    switch (quality) {
      case 'Excellent':
        return 'text-green-400';
      case 'Good':
        return 'text-blue-400';
      case 'Fair':
        return 'text-yellow-400';
      case 'Poor':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-slate-800/95 backdrop-blur-xl rounded-3xl border border-purple-500/20 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-slate-800/95 backdrop-blur-xl border-b border-purple-500/20 p-6 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold">Trade Details</h2>
                <p className="text-white/60 text-sm mt-1">
                  {format(new Date(trade.timestamp), 'PPpp')}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  {trade.side === 'buy' ? (
                    <TrendingUp className="w-7 h-7" />
                  ) : (
                    <TrendingDown className="w-7 h-7" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-2xl font-bold">
                    {trade.fromToken} → {trade.toToken}
                  </div>
                  <div className="text-white/60">
                    {trade.side === 'buy' ? 'Buy' : 'Sell'} • {trade.amount}
                  </div>
                </div>
                <div
                  className={`px-4 py-2 rounded-xl border flex items-center gap-2 ${getStatusColor()}`}
                >
                  {getStatusIcon()}
                  <span className="font-semibold capitalize">{trade.status}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-900/50 rounded-xl border border-purple-500/10">
                  <div className="text-xs text-white/60 mb-2">Execution Quality</div>
                  <div
                    className={`text-xl font-bold ${getExecutionQualityColor(executionQuality)}`}
                  >
                    {executionQuality}
                  </div>
                </div>

                {trade.pnl !== undefined && (
                  <div className="p-4 bg-slate-900/50 rounded-xl border border-purple-500/10">
                    <div className="text-xs text-white/60 mb-2">P&L</div>
                    <div
                      className={`text-xl font-bold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}
                    >
                      {trade.pnl >= 0 ? '+' : ''}
                      {trade.pnl.toFixed(6)} SOL
                    </div>
                    {trade.pnlPercent !== undefined && (
                      <div
                        className={`text-sm ${trade.pnlPercent >= 0 ? 'text-green-400/80' : 'text-red-400/80'}`}
                      >
                        {trade.pnlPercent >= 0 ? '+' : ''}
                        {trade.pnlPercent.toFixed(2)}%
                      </div>
                    )}
                  </div>
                )}

                {trade.mevProtected && (
                  <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                    <div className="text-xs text-white/60 mb-2 flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      MEV Protected
                    </div>
                    <div className="text-xl font-bold text-green-400">
                      {trade.mevSavings?.toFixed(6) || '0.000000'} SOL
                    </div>
                    <div className="text-sm text-green-400/80">Estimated Savings</div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Execution Details</h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-900/50 rounded-lg">
                    <div className="text-xs text-white/60 mb-1">Slippage</div>
                    <div
                      className={`font-semibold ${
                        trade.slippage < 0.5
                          ? 'text-green-400'
                          : trade.slippage < 1
                            ? 'text-yellow-400'
                            : 'text-red-400'
                      }`}
                    >
                      {trade.slippage.toFixed(2)}%
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900/50 rounded-lg">
                    <div className="text-xs text-white/60 mb-1">Price Impact</div>
                    <div
                      className={`font-semibold ${
                        trade.priceImpact < 1
                          ? 'text-green-400'
                          : trade.priceImpact < 5
                            ? 'text-yellow-400'
                            : 'text-red-400'
                      }`}
                    >
                      {trade.priceImpact.toFixed(2)}%
                    </div>
                  </div>

                  {trade.executionPrice !== undefined && (
                    <div className="p-3 bg-slate-900/50 rounded-lg">
                      <div className="text-xs text-white/60 mb-1">Execution Price</div>
                      <div className="font-semibold">{trade.executionPrice.toFixed(6)}</div>
                    </div>
                  )}

                  {trade.expectedPrice !== undefined && (
                    <div className="p-3 bg-slate-900/50 rounded-lg">
                      <div className="text-xs text-white/60 mb-1">Expected Price</div>
                      <div className="font-semibold">{trade.expectedPrice.toFixed(6)}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Fee Information</h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-900/50 rounded-lg">
                    <div className="text-xs text-white/60 mb-1 flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      Gas Cost
                    </div>
                    <div className="font-semibold">{trade.gasCost.toFixed(6)} SOL</div>
                  </div>

                  <div className="p-3 bg-slate-900/50 rounded-lg">
                    <div className="text-xs text-white/60 mb-1">Priority Fee</div>
                    <div className="font-semibold">
                      {(trade.priorityFeeMicroLamports / 1000000).toFixed(6)} SOL
                    </div>
                    <div className="text-xs text-white/40">
                      {trade.priorityFeeMicroLamports.toLocaleString()} μLamports
                    </div>
                  </div>
                </div>
              </div>

              {trade.txSignature && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Transaction</h3>

                  <div className="p-4 bg-slate-900/50 rounded-xl border border-purple-500/10">
                    <div className="text-xs text-white/60 mb-2">Transaction Signature</div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-sm font-mono bg-black/30 px-3 py-2 rounded-lg break-all">
                        {trade.txSignature}
                      </code>
                      <a
                        href={`https://solscan.io/tx/${trade.txSignature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                        title="View on Solscan"
                      >
                        <ExternalLink className="w-5 h-5 text-purple-400" />
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={`https://solscan.io/tx/${trade.txSignature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl transition-colors flex items-center justify-center gap-2 font-semibold"
                    >
                      View on Solscan
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <a
                      href={`https://explorer.solana.com/tx/${trade.txSignature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl transition-colors flex items-center justify-center gap-2 font-semibold"
                    >
                      View on Solana Explorer
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}

              {(trade.walletAddress || trade.isPaperTrade) && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Additional Information</h3>

                  {trade.walletAddress && (
                    <div className="p-3 bg-slate-900/50 rounded-lg">
                      <div className="text-xs text-white/60 mb-1">Wallet Address</div>
                      <code className="text-sm font-mono break-all">{trade.walletAddress}</code>
                    </div>
                  )}

                  {trade.isPaperTrade && (
                    <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                      <div className="text-sm text-yellow-400 font-semibold">
                        ⚠️ This is a paper trade (simulation)
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

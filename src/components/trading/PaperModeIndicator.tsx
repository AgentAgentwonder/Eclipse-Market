import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, TrendingUp, TrendingDown, AlertTriangle, X } from 'lucide-react';
import { usePaperTradingStore } from '../../store/paperTradingStore';

interface PaperModeIndicatorProps {
  onSwitchToLive?: () => void;
}

export function PaperModeIndicator({ onSwitchToLive }: PaperModeIndicatorProps) {
  const [showModal, setShowModal] = useState(false);
  const { isPaperMode, virtualBalance, getTotalPnL, getTotalPnLPercent, trades } =
    usePaperTradingStore();

  if (!isPaperMode) return null;

  const totalPnL = getTotalPnL();
  const totalPnLPercent = getTotalPnLPercent();

  return (
    <>
      {/* Banner Indicator */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-orange-500/90 to-yellow-500/90 backdrop-blur-sm border-b border-orange-400/30"
      >
        <div className="max-w-[1800px] mx-auto px-6 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5" />
              <span className="font-bold text-sm">📝 PAPER TRADING MODE</span>
              <span className="text-xs opacity-80">No real transactions will occur</span>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium transition-colors"
            >
              View Stats
            </button>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
            >
              <div className="bg-slate-900 border border-orange-500/30 rounded-2xl shadow-2xl">
                <div className="flex items-center justify-between p-6 border-b border-orange-500/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Paper Trading Stats</h3>
                      <p className="text-xs text-white/60">Your virtual performance</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  {/* Virtual Balance */}
                  <div className="p-4 bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border border-orange-500/20 rounded-xl">
                    <div className="text-sm text-white/60 mb-1">Virtual Balance</div>
                    <div className="text-2xl font-bold">${virtualBalance.toFixed(2)}</div>
                    <div className="text-xs text-white/40 mt-1">(Virtual)</div>
                  </div>

                  {/* P&L */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-slate-800/50 rounded-xl">
                      <div className="text-xs text-white/60 mb-1">Total P&L</div>
                      <div
                        className={`text-lg font-bold flex items-center gap-1 ${
                          totalPnL >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {totalPnL >= 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        ${Math.abs(totalPnL).toFixed(2)}
                      </div>
                    </div>
                    <div className="p-4 bg-slate-800/50 rounded-xl">
                      <div className="text-xs text-white/60 mb-1">P&L %</div>
                      <div
                        className={`text-lg font-bold ${
                          totalPnLPercent >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {totalPnLPercent >= 0 ? '+' : ''}
                        {totalPnLPercent.toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  {/* Trade Count */}
                  <div className="p-4 bg-slate-800/50 rounded-xl">
                    <div className="text-xs text-white/60 mb-1">Total Trades</div>
                    <div className="text-lg font-bold">{trades.length}</div>
                  </div>

                  {/* Switch to Live Warning */}
                  <div className="pt-4 border-t border-orange-500/20">
                    <button
                      onClick={() => {
                        setShowModal(false);
                        onSwitchToLive?.();
                      }}
                      className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl font-semibold transition-all shadow-lg shadow-purple-500/30"
                    >
                      Open Settings to Switch
                    </button>
                    <div className="flex items-start gap-2 mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-yellow-400/80">
                        Switching to live mode will execute real trades with real money. Confirm the
                        switch in Settings when you are ready.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

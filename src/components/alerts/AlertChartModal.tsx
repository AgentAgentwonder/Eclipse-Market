import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap } from 'lucide-react';
import RealtimeChart from '../RealtimeChart';

interface AlertChartModalProps {
  isOpen: boolean;
  symbol: string;
  timestamp?: string;
  onClose: () => void;
  onQuickTrade?: (symbol: string) => void;
}

const AlertChartModal: React.FC<AlertChartModalProps> = ({
  isOpen,
  symbol,
  timestamp,
  onClose,
  onQuickTrade,
}) => {
  useEffect(() => {
    if (isOpen && timestamp) {
      console.log(`Opening chart for ${symbol} at timestamp ${timestamp}`);
    }
  }, [isOpen, symbol, timestamp]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-900 rounded-3xl border border-purple-500/30 shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-purple-500/20">
            <div>
              <h2 className="text-2xl font-bold">{symbol} Chart</h2>
              {timestamp && (
                <p className="text-sm text-slate-400">
                  Alert triggered at {new Date(timestamp).toLocaleString()}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {onQuickTrade && (
                <button
                  onClick={() => onQuickTrade(symbol)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-xl font-semibold transition"
                >
                  <Zap className="w-4 h-4" />
                  Quick Trade
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-purple-500/20 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 p-6 overflow-auto">
            <RealtimeChart
              symbol={symbol}
              title={`${symbol} Real-time Price`}
              height={500}
              showControls={true}
              intervalMs={1000}
            />

            {timestamp && (
              <div className="mt-6 p-4 bg-slate-800/60 rounded-xl">
                <h3 className="text-lg font-semibold mb-2">Alert Context</h3>
                <div className="text-sm text-slate-400">
                  <p>
                    This alert was triggered at{' '}
                    <span className="text-white font-semibold">
                      {new Date(timestamp).toLocaleString()}
                    </span>
                  </p>
                  <p className="mt-2">
                    The chart above shows real-time price data. Use the controls to pause/resume
                    streaming or adjust settings.
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AlertChartModal;

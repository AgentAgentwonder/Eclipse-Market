import { useState } from 'react';
import { motion } from 'framer-motion';
import { invoke } from '@tauri-apps/api/tauri';
import { X, Copy, CheckCircle, AlertCircle, Loader2, Settings2 } from 'lucide-react';
import { WalletActivity } from '../../types/insiders';
import { useWalletStore } from '../../store/walletStore';

interface CopyTradeModalProps {
  activity: WalletActivity;
  onClose: () => void;
}

export function CopyTradeModal({ activity, onClose }: CopyTradeModalProps) {
  const { publicKey } = useWalletStore();
  const [multiplier, setMultiplier] = useState(1.0);
  const [delaySeconds, setDelaySeconds] = useState(0);
  const [useCustomAmount, setUseCustomAmount] = useState(false);
  const [customAmount, setCustomAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const calculatedAmount =
    useCustomAmount && customAmount ? customAmount : (activity.amount || 0) * multiplier;

  const handleConfirm = async () => {
    if (!publicKey) {
      setStatus('error');
      setErrorMessage('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setStatus('idle');
    setErrorMessage(null);

    try {
      const request = {
        name: `Copy ${activity.wallet_label || activity.wallet_address} - ${activity.output_symbol || 'Token'}`,
        wallet_address: publicKey,
        source_wallet: activity.wallet_address,
        allocation_percentage: 100,
        multiplier,
        min_trade_amount: null,
        max_trade_amount: null,
        delay_seconds: delaySeconds,
        token_whitelist: activity.output_mint ? [activity.output_mint] : null,
        token_blacklist: null,
        stop_loss_percentage: null,
        take_profit_percentage: null,
        max_daily_trades: null,
        max_total_loss: null,
      };

      await invoke('copy_trading_create', { request });

      setStatus('success');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number | undefined) => {
    if (!amount) return 'N/A';
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(2)}K`;
    return `$${amount.toFixed(2)}`;
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-800 rounded-2xl border border-purple-500/20 shadow-xl max-w-lg w-full overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-purple-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <Copy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Copy Trade</h2>
              <p className="text-sm text-gray-400">Follow this wallet's trades</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {status === 'idle' && (
            <>
              <div className="bg-slate-700/30 rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Wallet</span>
                  <span className="font-mono">
                    {activity.wallet_label ||
                      `${activity.wallet_address.slice(0, 4)}...${activity.wallet_address.slice(-4)}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Action</span>
                  <span className="capitalize font-medium">{activity.type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Token</span>
                  <span className="font-medium">{activity.output_symbol || 'Unknown'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Original Amount</span>
                  <span className="font-semibold text-purple-400">
                    {formatAmount(activity.amount_usd)}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-gray-400">Copy Amount</label>
                    <button
                      onClick={() => setUseCustomAmount(!useCustomAmount)}
                      className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      {useCustomAmount ? 'Use Multiplier' : 'Custom Amount'}
                    </button>
                  </div>
                  {useCustomAmount ? (
                    <input
                      type="number"
                      value={customAmount || ''}
                      onChange={e => setCustomAmount(parseFloat(e.target.value) || null)}
                      placeholder="Enter custom amount in USD"
                      className="w-full bg-slate-700 px-4 py-3 rounded-lg border border-slate-600 focus:border-purple-500 focus:outline-none"
                    />
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="0.1"
                        max="5"
                        step="0.1"
                        value={multiplier}
                        onChange={e => setMultiplier(parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Multiplier: {multiplier.toFixed(1)}x</span>
                        <span className="font-semibold text-purple-400">
                          ≈ {formatAmount(calculatedAmount)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Delay (seconds)</label>
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {[0, 5, 10, 30].map(delay => (
                      <button
                        key={delay}
                        onClick={() => setDelaySeconds(delay)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          delaySeconds === delay
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                        }`}
                      >
                        {delay}s
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    value={delaySeconds}
                    onChange={e => setDelaySeconds(parseInt(e.target.value) || 0)}
                    placeholder="Custom delay"
                    className="w-full bg-slate-700 px-4 py-2 rounded-lg border border-slate-600 focus:border-purple-500 focus:outline-none text-sm"
                  />
                </div>

                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Settings2 className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="text-purple-300 font-medium mb-1">Copy Trading Setup</p>
                      <p className="text-gray-400">
                        This will create a copy trading configuration that will automatically
                        replicate trades from this wallet. You can manage this in the Copy Trading
                        settings.
                      </p>
                    </div>
                  </div>
                </div>

                {errorMessage && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">
                    {errorMessage}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading || !publicKey || (useCustomAmount && !customAmount)}
                  className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Setting Up...
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      Confirm Copy Trade
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {status === 'success' && (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-bold mb-2">Copy Trading Enabled!</h3>
              <p className="text-gray-400 text-sm">
                Your copy trade configuration has been created successfully
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-8">
              <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
              <h3 className="text-lg font-bold mb-2">Setup Failed</h3>
              <p className="text-gray-400 text-sm mb-4">{errorMessage}</p>
              <button
                onClick={() => setStatus('idle')}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

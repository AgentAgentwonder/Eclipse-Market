import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Loader2, AlertCircle, Shield } from 'lucide-react';
import { useMonitoredWallets } from '../../hooks/useWalletActivity';

interface WalletMonitorSettingsProps {
  onClose: () => void;
}

export function WalletMonitorSettings({ onClose }: WalletMonitorSettingsProps) {
  const { wallets, loading, error, addWallet, updateWallet, removeWallet, refresh } =
    useMonitoredWallets();
  const [newWallet, setNewWallet] = useState({
    address: '',
    label: '',
    isWhale: false,
    minAmount: 5000,
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleAddWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWallet.address) return;

    setSaving(true);
    setSaveError(null);

    try {
      await addWallet(
        newWallet.address.trim(),
        newWallet.label.trim() || undefined,
        newWallet.isWhale,
        newWallet.minAmount
      );
      setNewWallet({ address: '', label: '', isWhale: false, minAmount: 5000 });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await updateWallet(id, { is_active: !isActive });
    } catch (err) {
      console.error('Failed to toggle wallet', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-900 rounded-2xl border border-purple-500/20 shadow-2xl max-w-3xl w-full overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-purple-500/20">
          <div>
            <h2 className="text-xl font-bold">Wallet Monitor Settings</h2>
            <p className="text-sm text-gray-400">Manage wallets and alerts for the activity feed</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6 max-h-[80vh] overflow-y-auto">
          <form
            onSubmit={handleAddWallet}
            className="bg-slate-800/50 rounded-xl border border-purple-500/20 p-4 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-sm text-gray-400 mb-2">Wallet Address</label>
                <input
                  value={newWallet.address}
                  onChange={e => setNewWallet(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter Solana wallet address"
                  className="w-full bg-slate-900 px-4 py-2 rounded-lg border border-slate-700 focus:border-purple-500 focus:outline-none"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm text-gray-400 mb-2">Label (optional)</label>
                <input
                  value={newWallet.label}
                  onChange={e => setNewWallet(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="Whale wallet"
                  className="w-full bg-slate-900 px-4 py-2 rounded-lg border border-slate-700 focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Whale Indicator</label>
                <button
                  type="button"
                  onClick={() => setNewWallet(prev => ({ ...prev, isWhale: !prev.isWhale }))}
                  className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                    newWallet.isWhale
                      ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300'
                      : 'bg-slate-900 border-slate-700 text-gray-400'
                  }`}
                >
                  <Shield className="w-4 h-4 inline-block mr-2" />
                  {newWallet.isWhale ? 'Whale Tracked' : 'Mark as Whale'}
                </button>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Large Tx Alert Threshold (USD)
                </label>
                <input
                  type="number"
                  value={newWallet.minAmount}
                  onChange={e =>
                    setNewWallet(prev => ({ ...prev, minAmount: parseFloat(e.target.value) || 0 }))
                  }
                  className="w-full bg-slate-900 px-4 py-2 rounded-lg border border-slate-700 focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Add Wallet
                </button>
              </div>
            </div>

            {saveError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {saveError}
              </div>
            )}
          </form>

          <div className="bg-slate-800/30 rounded-xl border border-purple-500/20">
            <div className="px-4 py-3 border-b border-purple-500/20 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Monitored Wallets</h3>
              <button
                onClick={refresh}
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                Refresh
              </button>
            </div>
            <div className="divide-y divide-slate-800">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                </div>
              ) : wallets.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">
                  No wallets being monitored yet.
                </div>
              ) : (
                wallets.map(wallet => (
                  <div
                    key={wallet.id}
                    className="px-4 py-4 grid grid-cols-1 md:grid-cols-4 gap-3 text-sm"
                  >
                    <div>
                      <p className="font-mono text-gray-200">
                        {wallet.label ||
                          `${wallet.wallet_address.slice(0, 6)}...${wallet.wallet_address.slice(-4)}`}
                      </p>
                      <p className="text-xs text-gray-500">{wallet.wallet_address}</p>
                    </div>
                    <div className="text-gray-400">
                      <p>Whale: {wallet.is_whale ? 'Yes' : 'No'}</p>
                      {wallet.min_transaction_size && (
                        <p className="text-xs">Alert ≥ ${wallet.min_transaction_size}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          wallet.is_active
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {wallet.is_active ? 'Active' : 'Paused'}
                      </span>
                      <button
                        onClick={() => handleToggle(wallet.id, wallet.is_active)}
                        className="text-xs text-purple-400 hover:text-purple-300"
                      >
                        {wallet.is_active ? 'Pause' : 'Resume'}
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => removeWallet(wallet.id)}
                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

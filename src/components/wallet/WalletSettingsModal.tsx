import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Trash2 } from 'lucide-react';
import { useWalletStore, UpdateWalletRequest, WalletPreferences } from '../../store/walletStore';

interface WalletSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletId: string | null;
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
};

export function WalletSettingsModal({ isOpen, onClose, walletId }: WalletSettingsModalProps) {
  const wallets = useWalletStore(state => state.wallets);
  const groups = useWalletStore(state => state.groups);
  const updateWallet = useWalletStore(state => state.updateWallet);
  const removeWallet = useWalletStore(state => state.removeWallet);
  const isLoading = useWalletStore(state => state.multiWalletLoading);

  const wallet = wallets.find(w => w.id === walletId);

  const [formState, setFormState] = useState<{
    label: string;
    groupId?: string | null;
    preferences: WalletPreferences;
  }>({
    label: '',
    groupId: undefined,
    preferences: {
      tradingEnabled: true,
      autoApproveLimit: null,
      maxSlippage: null,
      defaultPriorityFee: null,
      notificationsEnabled: true,
      isolationMode: false,
    },
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (wallet) {
      setFormState({
        label: wallet.label,
        groupId: wallet.groupId ?? null,
        preferences: wallet.preferences,
      });
    }
  }, [wallet]);

  const handleSubmit = async () => {
    if (!walletId || !formState.label.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    const payload: UpdateWalletRequest = {
      walletId,
      label: formState.label,
      groupId: formState.groupId,
      preferences: formState.preferences,
    };

    try {
      await updateWallet(payload);
      onClose();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update wallet');
    }
  };

  const handleDelete = async () => {
    if (!walletId) return;

    if (confirm('Are you sure you want to remove this wallet?')) {
      try {
        await removeWallet(walletId);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to remove wallet');
      }
    }
  };

  if (!wallet) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative w-full max-w-lg mx-4 bg-slate-900/95 border border-purple-500/20 rounded-2xl shadow-2xl overflow-hidden"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-purple-500/20">
              <div>
                <h2 className="text-2xl font-bold">Wallet Settings</h2>
                <p className="text-sm text-gray-400">Configure wallet preferences</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="text-sm text-gray-300">Wallet Label</label>
                <input
                  value={formState.label}
                  onChange={e => setFormState(state => ({ ...state, label: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 bg-slate-900 border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-500"
                  placeholder="My Trading Wallet"
                />
              </div>

              <div>
                <label className="text-sm text-gray-300">Public Key</label>
                <div className="mt-1 px-3 py-2 bg-slate-800/50 border border-purple-500/20 rounded-lg font-mono text-sm text-gray-400">
                  {wallet.publicKey}
                </div>
              </div>

              {groups.length > 0 && (
                <div>
                  <label className="text-sm text-gray-300">Assign to Group</label>
                  <select
                    value={formState.groupId ?? ''}
                    onChange={e =>
                      setFormState(state => ({ ...state, groupId: e.target.value || null }))
                    }
                    className="mt-1 w-full px-3 py-2 bg-slate-900 border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-500"
                  >
                    <option value="">No Group</option>
                    {groups.map(group => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-300 border-b border-purple-500/20 pb-2">
                  Trading Preferences
                </h3>

                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-300">Enable Trading</label>
                  <input
                    type="checkbox"
                    checked={formState.preferences.tradingEnabled}
                    onChange={e =>
                      setFormState(state => ({
                        ...state,
                        preferences: { ...state.preferences, tradingEnabled: e.target.checked },
                      }))
                    }
                    className="h-4 w-4 text-purple-500 bg-slate-900 border-purple-500 rounded focus:ring-purple-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-300">Isolation Mode</label>
                  <input
                    type="checkbox"
                    checked={formState.preferences.isolationMode}
                    onChange={e =>
                      setFormState(state => ({
                        ...state,
                        preferences: { ...state.preferences, isolationMode: e.target.checked },
                      }))
                    }
                    className="h-4 w-4 text-purple-500 bg-slate-900 border-purple-500 rounded focus:ring-purple-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-300">Notifications</label>
                  <input
                    type="checkbox"
                    checked={formState.preferences.notificationsEnabled}
                    onChange={e =>
                      setFormState(state => ({
                        ...state,
                        preferences: {
                          ...state.preferences,
                          notificationsEnabled: e.target.checked,
                        },
                      }))
                    }
                    className="h-4 w-4 text-purple-500 bg-slate-900 border-purple-500 rounded focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-300">Auto-Approve Limit (SOL)</label>
                  <input
                    type="number"
                    value={formState.preferences.autoApproveLimit ?? ''}
                    onChange={e =>
                      setFormState(state => ({
                        ...state,
                        preferences: {
                          ...state.preferences,
                          autoApproveLimit: e.target.value ? Number(e.target.value) : null,
                        },
                      }))
                    }
                    className="mt-1 w-full px-3 py-2 bg-slate-900 border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-500"
                    placeholder="No limit"
                    min={0}
                    step={0.1}
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-300">Max Slippage (%)</label>
                  <input
                    type="number"
                    value={formState.preferences.maxSlippage ?? ''}
                    onChange={e =>
                      setFormState(state => ({
                        ...state,
                        preferences: {
                          ...state.preferences,
                          maxSlippage: e.target.value ? Number(e.target.value) : null,
                        },
                      }))
                    }
                    className="mt-1 w-full px-3 py-2 bg-slate-900 border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-500"
                    placeholder="Default"
                    min={0}
                    step={0.01}
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-300">
                    Default Priority Fee (microlamports)
                  </label>
                  <input
                    type="number"
                    value={formState.preferences.defaultPriorityFee ?? ''}
                    onChange={e =>
                      setFormState(state => ({
                        ...state,
                        preferences: {
                          ...state.preferences,
                          defaultPriorityFee: e.target.value ? Number(e.target.value) : null,
                        },
                      }))
                    }
                    className="mt-1 w-full px-3 py-2 bg-slate-900 border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-500"
                    placeholder="Default"
                    min={0}
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-purple-500/20">
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-all flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg border border-purple-500/30 hover:border-purple-500/50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

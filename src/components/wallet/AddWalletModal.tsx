import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletStore, AddWalletRequest, WalletType } from '../../store/walletStore';

interface AddWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
};

export function AddWalletModal({ isOpen, onClose }: AddWalletModalProps) {
  const { publicKey, wallet } = useWallet();
  const addWallet = useWalletStore(state => state.addWallet);
  const groups = useWalletStore(state => state.groups);
  const isLoading = useWalletStore(state => state.multiWalletLoading);

  const [formState, setFormState] = useState<{
    label: string;
    publicKey: string;
    network: string;
    walletType: WalletType;
    groupId?: string;
  }>({
    label: '',
    publicKey: publicKey?.toBase58() ?? '',
    network: 'devnet',
    walletType: 'phantom',
    groupId: undefined,
  });

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!formState.label.trim() || !formState.publicKey.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    const payload: AddWalletRequest = {
      publicKey: formState.publicKey,
      label: formState.label,
      network: formState.network,
      walletType: formState.walletType,
      groupId: formState.groupId || null,
    };

    try {
      await addWallet(payload);
      onClose();
      setFormState({
        label: '',
        publicKey: '',
        network: 'devnet',
        walletType: 'phantom',
        groupId: undefined,
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add wallet');
    }
  };

  const handleUseConnected = () => {
    if (publicKey) {
      setFormState(state => ({
        ...state,
        publicKey: publicKey.toBase58(),
        label: wallet?.adapter.name ?? 'Phantom Wallet',
        walletType: wallet?.adapter.name.toLowerCase().includes('ledger')
          ? 'hardware_ledger'
          : wallet?.adapter.name.toLowerCase().includes('trezor')
            ? 'hardware_trezor'
            : 'phantom',
      }));
      setError(null);
    }
  };

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
            className="relative w-full max-w-md mx-4 bg-slate-900/95 border border-purple-500/20 rounded-2xl shadow-2xl overflow-hidden"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-purple-500/20">
              <div>
                <h2 className="text-2xl font-bold">Add Wallet</h2>
                <p className="text-sm text-gray-400">Add a new wallet to your portfolio</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {publicKey && (
                <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                  <p className="text-sm text-gray-300 mb-2">Use currently connected wallet?</p>
                  <button
                    onClick={handleUseConnected}
                    className="w-full px-4 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 transition-all text-sm"
                  >
                    {wallet?.adapter.name} - {publicKey.toBase58().slice(0, 4)}...
                    {publicKey.toBase58().slice(-4)}
                  </button>
                </div>
              )}

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
                <input
                  value={formState.publicKey}
                  onChange={e => setFormState(state => ({ ...state, publicKey: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 bg-slate-900 border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-500 font-mono text-sm"
                  placeholder="Enter Solana public key"
                />
              </div>

              <div>
                <label className="text-sm text-gray-300">Network</label>
                <select
                  value={formState.network}
                  onChange={e => setFormState(state => ({ ...state, network: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 bg-slate-900 border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-500"
                >
                  <option value="devnet">Devnet</option>
                  <option value="testnet">Testnet</option>
                  <option value="mainnet-beta">Mainnet</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-300">Wallet Type</label>
                <select
                  value={formState.walletType}
                  onChange={e =>
                    setFormState(state => ({ ...state, walletType: e.target.value as WalletType }))
                  }
                  className="mt-1 w-full px-3 py-2 bg-slate-900 border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-500"
                >
                  <option value="phantom">Phantom</option>
                  <option value="hardware_ledger">Hardware (Ledger)</option>
                  <option value="hardware_trezor">Hardware (Trezor)</option>
                  <option value="imported">Imported</option>
                </select>
              </div>

              {groups.length > 0 && (
                <div>
                  <label className="text-sm text-gray-300">Assign to Group (Optional)</label>
                  <select
                    value={formState.groupId ?? ''}
                    onChange={e =>
                      setFormState(state => ({ ...state, groupId: e.target.value || undefined }))
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

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-purple-500/20">
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
                  Add Wallet
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

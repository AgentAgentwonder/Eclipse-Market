import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Wallet, Plus, Settings as SettingsIcon, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWalletStore } from '../../store/walletStore';

interface WalletSwitcherProps {
  onAddWallet?: () => void;
  onManageGroups?: () => void;
  onWalletSettings?: (walletId: string) => void;
}

export function WalletSwitcher({
  onAddWallet,
  onManageGroups,
  onWalletSettings,
}: WalletSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const wallets = useWalletStore(state => state.wallets);
  const activeWalletId = useWalletStore(state => state.activeWalletId);
  const aggregatedPortfolio = useWalletStore(state => state.aggregatedPortfolio);
  const setActiveWallet = useWalletStore(state => state.setActiveWallet);
  const listWallets = useWalletStore(state => state.listWallets);
  const getAggregatedPortfolio = useWalletStore(state => state.getAggregatedPortfolio);

  useEffect(() => {
    listWallets();
    getAggregatedPortfolio();
  }, [listWallets, getAggregatedPortfolio]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const activeWallet = wallets.find(w => w.id === activeWalletId);

  const handleWalletSelect = async (walletId: string) => {
    try {
      await setActiveWallet(walletId);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to switch wallet:', error);
    }
  };

  if (wallets.length === 0) {
    return (
      <button
        onClick={onAddWallet}
        className="px-6 py-2 rounded-xl font-medium transition-all shadow-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-purple-500/30"
      >
        <span className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Wallet
        </span>
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 hover:border-purple-500/50 transition-all"
      >
        {activeWallet && (
          <>
            <Wallet className="w-4 h-4" />
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">{activeWallet.label}</span>
              <span className="text-xs text-gray-400 font-mono">
                {activeWallet.publicKey.slice(0, 4)}...{activeWallet.publicKey.slice(-4)}
              </span>
            </div>
            <div className="ml-4 px-3 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30">
              <span className="text-sm font-bold">{activeWallet.balance.toFixed(4)} SOL</span>
            </div>
          </>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full right-0 mt-2 w-96 bg-slate-900/95 backdrop-blur-xl border border-purple-500/20 rounded-xl shadow-2xl overflow-hidden z-50"
          >
            {aggregatedPortfolio && wallets.length > 1 && (
              <div className="p-4 border-b border-purple-500/20">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Portfolio Overview</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="px-3 py-2 rounded-lg bg-purple-500/10">
                    <div className="text-xs text-gray-400">Total Balance</div>
                    <div className="text-sm font-bold">
                      {aggregatedPortfolio.totalBalance.toFixed(4)} SOL
                    </div>
                  </div>
                  <div className="px-3 py-2 rounded-lg bg-purple-500/10">
                    <div className="text-xs text-gray-400">Total Wallets</div>
                    <div className="text-sm font-bold">{aggregatedPortfolio.totalWallets}</div>
                  </div>
                  <div className="px-3 py-2 rounded-lg bg-green-500/10">
                    <div className="text-xs text-gray-400">Realized P&L</div>
                    <div
                      className={`text-sm font-bold ${aggregatedPortfolio.totalRealizedPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}
                    >
                      {aggregatedPortfolio.totalRealizedPnl >= 0 ? '+' : ''}
                      {aggregatedPortfolio.totalRealizedPnl.toFixed(2)} SOL
                    </div>
                  </div>
                  <div className="px-3 py-2 rounded-lg bg-blue-500/10">
                    <div className="text-xs text-gray-400">Total Volume</div>
                    <div className="text-sm font-bold">
                      {aggregatedPortfolio.totalVolume.toFixed(2)} SOL
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="max-h-80 overflow-y-auto">
              <div className="p-2">
                <h3 className="text-xs font-medium text-gray-400 px-2 py-1 uppercase">Wallets</h3>
                {wallets.map(wallet => (
                  <button
                    key={wallet.id}
                    onClick={() => handleWalletSelect(wallet.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                      wallet.id === activeWalletId
                        ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-500/50'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Wallet className="w-4 h-4" />
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium">{wallet.label}</span>
                        <span className="text-xs text-gray-400 font-mono">
                          {wallet.publicKey.slice(0, 4)}...{wallet.publicKey.slice(-4)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{wallet.balance.toFixed(4)}</span>
                      {onWalletSettings && (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onWalletSettings(wallet.id);
                            setIsOpen(false);
                          }}
                          className="p-1 hover:bg-white/10 rounded transition-all"
                        >
                          <SettingsIcon className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-purple-500/20 p-2 flex gap-2">
              {onAddWallet && (
                <button
                  onClick={() => {
                    onAddWallet();
                    setIsOpen(false);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm">Add Wallet</span>
                </button>
              )}
              {onManageGroups && (
                <button
                  onClick={() => {
                    onManageGroups();
                    setIsOpen(false);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 transition-all"
                >
                  <Users className="w-4 h-4" />
                  <span className="text-sm">Groups</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

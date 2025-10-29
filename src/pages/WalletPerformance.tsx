import { WalletPerformanceDashboard } from '../components/wallet/WalletPerformanceDashboard';
import { useWalletStore } from '../store/walletStore';
import { Wallet } from 'lucide-react';

export default function WalletPerformance() {
  const wallets = useWalletStore((state) => state.wallets);
  const activeWalletId = useWalletStore((state) => state.activeWalletId);

  const activeWallet = wallets.find((w) => w.id === activeWalletId);

  if (!activeWallet) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Wallet size={48} className="text-gray-500 mb-4" />
        <p className="text-gray-400 mb-4">No wallet selected</p>
        <p className="text-sm text-gray-500">Please connect a wallet to view performance metrics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Wallet Performance</h1>
        <p className="text-gray-400 mt-1">
          {activeWallet.label} • {activeWallet.publicKey.slice(0, 8)}...
          {activeWallet.publicKey.slice(-8)}
        </p>
      </div>

      <WalletPerformanceDashboard walletAddress={activeWallet.publicKey} />
    </div>
  );
}

import { DeFiHub } from '../components/defi/DeFiHub';
import { useWalletStore } from '../store/walletStore';

export default function DeFi() {
  const { wallets, activeWalletId } = useWalletStore(state => ({
    wallets: state.wallets,
    activeWalletId: state.activeWalletId,
  }));

  const activeWallet = wallets.find(w => w.id === activeWalletId);
  const walletAddress = activeWallet?.address || 'No wallet connected';

  return (
    <div className="p-6">
      {activeWallet ? (
        <DeFiHub wallet={walletAddress} />
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">Please connect a wallet to view DeFi positions</p>
        </div>
      )}
    </div>
  );
}

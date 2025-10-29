import { PropsWithChildren, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { clusterApiUrl } from '@solana/web3.js';
import { useWalletStore } from '../store/walletStore';

export function SolanaWalletProvider({ children }: PropsWithChildren) {
  const network = useWalletStore(state => state.network);
  const endpointPreference = useWalletStore(state => state.endpoint);
  const autoReconnect = useWalletStore(state => state.autoReconnect);

  const endpoint = useMemo(() => {
    if (endpointPreference) {
      return endpointPreference;
    }
    return clusterApiUrl(network as WalletAdapterNetwork);
  }, [endpointPreference, network]);

  const wallets = useMemo(() => [new PhantomWalletAdapter({ network })], [network]);

  return (
    <ConnectionProvider endpoint={endpoint} config={{ commitment: 'confirmed' }}>
      <WalletProvider wallets={wallets} autoConnect={autoReconnect}>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
}

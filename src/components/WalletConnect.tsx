import { useState } from 'react';

type PhantomEvent = 'connect' | 'disconnect' | 'accountChanged';

type ConnectOpts = {
  onlyIfTrusted: boolean;
};

type PhantomProvider = {
  connect: (opts?: Partial<ConnectOpts>) => Promise<{ publicKey: string }>;
  disconnect: () => Promise<void>;
  on: (event: PhantomEvent, callback: (args: any) => void) => void;
  isPhantom: boolean;
};

declare global {
  interface Window {
    solana?: PhantomProvider;
  }
}

export function WalletConnect() {
  const [publicKey, setPublicKey] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleConnect = async () => {
    try {
      if (!window.solana?.isPhantom) {
        throw new Error('Phantom wallet not found');
      }

      const response = await window.solana.connect();
      setPublicKey(response.publicKey);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    }
  };

  return (
    <div className="wallet-connect">
      <button
        onClick={handleConnect}
        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
      >
        Connect Wallet
      </button>

      {publicKey && (
        <div className="mt-2 text-green-500 text-sm">
          Connected: {publicKey.slice(0, 4)}...{publicKey.slice(-4)}
        </div>
      )}

      {error && <div className="mt-2 text-red-500 text-sm">Error: {error}</div>}
    </div>
  );
}

// Test stub to be implemented

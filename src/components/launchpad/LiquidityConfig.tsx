import { useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { Lock } from 'lucide-react';

interface LiquidityConfigProps {
  launchId: string | null;
}

export default function LiquidityConfig({ launchId }: LiquidityConfigProps) {
  const [tokenMint, setTokenMint] = useState('');
  const [poolAddress, setPoolAddress] = useState('');
  const [amount, setAmount] = useState(0);
  const [duration, setDuration] = useState(180);
  const [beneficiary, setBeneficiary] = useState('');
  const [isRevocable, setIsRevocable] = useState(false);

  const handleCreate = async () => {
    try {
      await invoke('create_liquidity_lock', {
        request: {
          tokenMint,
          poolAddress,
          amount,
          durationSeconds: duration * 86400,
          beneficiary,
          isRevocable,
        },
      });
    } catch (err) {
      console.error('Failed to create liquidity lock:', err);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Lock className="w-5 h-5 text-purple-500" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Liquidity Lock Configuration
        </h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Token Mint</label>
          <input
            type="text"
            value={tokenMint}
            onChange={(e) => setTokenMint(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2"
            placeholder="Token mint address"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Pool Address</label>
          <input
            type="text"
            value={poolAddress}
            onChange={(e) => setPoolAddress(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2"
            placeholder="Liquidity pool address"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Duration (days)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Beneficiary Address</label>
          <input
            type="text"
            value={beneficiary}
            onChange={(e) => setBeneficiary(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2"
            placeholder="Address to receive locked funds"
          />
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isRevocable}
            onChange={(e) => setIsRevocable(e.target.checked)}
            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Revocable</span>
        </label>

        <button
          onClick={handleCreate}
          className="w-full rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
        >
          Create Liquidity Lock
        </button>
      </div>
    </div>
  );
}

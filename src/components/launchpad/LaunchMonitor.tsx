import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { Activity, Loader2 } from 'lucide-react';

interface LaunchMonitorProps {
  launchId: string | null;
}

interface DistributionMetrics {
  tokenMint: string;
  totalDistributed: number;
  totalRecipients: number;
  successfulTransfers: number;
  failedTransfers: number;
  vestingActive: number;
  vestingCompleted: number;
  liquidityLockedAmount: number;
  timestamp: string;
}

export default function LaunchMonitor({ launchId }: LaunchMonitorProps) {
  const [tokenMint, setTokenMint] = useState('');
  const [metrics, setMetrics] = useState<DistributionMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  const loadMetrics = async () => {
    if (!tokenMint) return;
    setLoading(true);
    try {
      const result = await invoke<DistributionMetrics>('get_distribution_metrics', {
        tokenMint,
      });
      setMetrics(result);
    } catch (err) {
      console.error('Failed to load distribution metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tokenMint) {
      loadMetrics();
    }
  }, [tokenMint]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Activity className="w-5 h-5 text-purple-500" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Launch Monitoring Dashboard
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
          />
        </div>

        <button
          onClick={loadMetrics}
          disabled={!tokenMint}
          className="w-full rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 disabled:opacity-50"
        >
          Refresh Metrics
        </button>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Updating metrics...
          </div>
        )}

        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Token
              </div>
              <div className="mt-1 font-mono text-sm text-gray-900 dark:text-gray-100">
                {metrics.tokenMint.slice(0, 12)}...
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Last updated {new Date(metrics.timestamp).toLocaleTimeString()}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Distribution
              </div>
              <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                {metrics.totalDistributed.toLocaleString()}
              </div>
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Across {metrics.totalRecipients.toLocaleString()} recipients
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Transfers
              </div>
              <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                Successful: {metrics.successfulTransfers.toLocaleString()}
              </div>
              <div className="text-sm text-gray-900 dark:text-gray-100">
                Failed: {metrics.failedTransfers.toLocaleString()}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Vesting & Liquidity
              </div>
              <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                Active vesting schedules: {metrics.vestingActive}
              </div>
              <div className="text-sm text-gray-900 dark:text-gray-100">
                Liquidity locked: {metrics.liquidityLockedAmount.toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

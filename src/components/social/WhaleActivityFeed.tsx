import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { ArrowDownRight, ArrowUpRight, RefreshCw } from 'lucide-react';

interface WhaleActivityFeedProps {
  tokenAddress: string;
  fullWidth?: boolean;
}

export default function WhaleActivityFeed({ tokenAddress, fullWidth }: WhaleActivityFeedProps) {
  const [activity, setActivity] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivity();
  }, [tokenAddress]);

  const loadActivity = async () => {
    try {
      setLoading(true);
      const result = await invoke('get_whale_activity', { tokenAddress });
      setActivity(result);
    } catch (error) {
      console.error('Failed to load whale activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const containerClasses = fullWidth
    ? 'bg-slate-800/50 border border-slate-700 rounded-lg p-6'
    : 'bg-slate-800/50 border border-slate-700 rounded-lg p-6';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={containerClasses}
    >
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold">Whale Activity</h2>
          <p className="text-sm text-gray-400">Track large moves from smart money wallets</p>
        </div>
        <button onClick={loadActivity} className="text-xs flex items-center gap-1 text-gray-400 hover:text-white">
          <RefreshCw className="w-3 h-3" />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      ) : !activity ? (
        <div className="text-sm text-gray-400">No recent whale activity detected.</div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-900/60 rounded-lg p-3">
              <div className="text-xs text-gray-400 uppercase">Accumulation</div>
              <div className="text-lg font-semibold text-green-400">{activity.accumulation_score.toFixed(1)}%</div>
            </div>
            <div className="bg-slate-900/60 rounded-lg p-3">
              <div className="text-xs text-gray-400 uppercase">Distribution</div>
              <div className="text-lg font-semibold text-red-400">{activity.distribution_score.toFixed(1)}%</div>
            </div>
            <div className="bg-slate-900/60 rounded-lg p-3">
              <div className="text-xs text-gray-400 uppercase">Unique Whales</div>
              <div className="text-lg font-semibold text-blue-400">{activity.unique_whales}</div>
            </div>
          </div>

          <div className="space-y-3">
            {activity.recent_transactions?.slice(0, 5).map((tx: any) => {
              const isBuy = tx.action === 'BUY';
              return (
                <div
                  key={tx.id}
                  className="bg-slate-900/40 rounded-lg p-4 flex items-center justify-between hover:bg-slate-900/60 transition-colors"
                >
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {tx.wallet_label || tx.wallet_address.slice(0, 8)} · {tx.action}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {tx.amount.toLocaleString()} {tx.token} · ${tx.usd_value.toLocaleString()}
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 ${isBuy ? 'text-green-400' : 'text-red-400'}`}>
                    {isBuy ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                    <span className="text-xs">{isBuy ? 'Accumulating' : 'Distributing'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}

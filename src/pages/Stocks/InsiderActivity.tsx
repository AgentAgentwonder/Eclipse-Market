import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { UserCheck, TrendingUp, TrendingDown, AlertCircle, RefreshCw } from 'lucide-react';
import type { InsiderActivity as InsiderActivityType } from '../../types/stocks';

interface InsiderActivityProps {
  symbol?: string;
}

export function InsiderActivity({ symbol }: InsiderActivityProps) {
  const [activities, setActivities] = useState<InsiderActivityType[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!symbol) {
      setActivities([]);
      return;
    }

    const fetchActivity = async () => {
      setLoading(true);
      try {
        const result = await invoke<InsiderActivityType[]>('get_insider_activity', {
          symbol,
        });
        setActivities(result);
      } catch (error) {
        console.error('Failed to fetch insider activity:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [symbol]);

  const getTransactionIcon = (type: InsiderActivityType['transactionType']) => {
    switch (type) {
      case 'buy':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'sell':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getTransactionColor = (type: InsiderActivityType['transactionType']) => {
    switch (type) {
      case 'buy':
        return 'bg-green-500/20 text-green-300';
      case 'sell':
        return 'bg-red-500/20 text-red-300';
      default:
        return 'bg-yellow-500/20 text-yellow-300';
    }
  };

  if (!symbol) {
    return (
      <div className="bg-slate-900/40 border border-purple-500/10 rounded-2xl p-6 text-center text-gray-400">
        <UserCheck className="w-6 h-6 mx-auto mb-2" />
        <p>Select a stock to view insider trading activity.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/40 border border-purple-500/10 rounded-2xl p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-purple-300" />
          Insider Trading Activity
        </h3>
        <p className="text-sm text-gray-400">
          Recent insider transactions for {symbol} with significance indicators
        </p>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Loading insider data…</span>
        </div>
      )}

      <div className="overflow-x-auto -mx-4 lg:mx-0">
        <table className="min-w-full divide-y divide-slate-800">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Insider
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Shares
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Value
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Transaction Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Filing Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {activities.map((activity, idx) => (
              <tr key={`${activity.insiderName}-${activity.transactionDate}-${idx}`} className="hover:bg-slate-800/40">
                <td className="px-4 py-3 text-sm">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-200">{activity.insiderName}</span>
                    <span className="text-xs text-gray-400">{activity.insiderTitle}</span>
                    {activity.isSignificant && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-500/40 mt-1 inline-flex items-center gap-1 w-fit">
                        <AlertCircle className="w-3 h-3" />
                        Significant
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getTransactionColor(
                      activity.transactionType
                    )}`}
                  >
                    {getTransactionIcon(activity.transactionType)}
                    {activity.transactionType.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">{activity.shares.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm">${activity.price.toFixed(2)}</td>
                <td className="px-4 py-3 text-sm">
                  ${activity.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
                <td className="px-4 py-3 text-sm text-gray-300">
                  {new Date(activity.transactionDate).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-sm text-gray-300">
                  {new Date(activity.filingDate).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {activities.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-400">
          <p>No insider trading activity available.</p>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Clock, TrendingUp } from 'lucide-react';
import { SwapForm } from '../SwapForm';
import { useJupiter } from '../../hooks/useJupiter';
import { useWallet } from '../../hooks/useWallet';
import { invoke } from '@tauri-apps/api/tauri';
import type { SwapHistoryEntry } from '../../types/wallet';

interface SwapViewProps {
  onSuccess?: () => void;
}

export function SwapView({ onSuccess }: SwapViewProps) {
  const jupiter = useJupiter();
  const wallet = useWallet();
  const [recentSwaps, setRecentSwaps] = useState<SwapHistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadRecentSwaps();
  }, []);

  const loadRecentSwaps = async () => {
    try {
      const swaps = await invoke<SwapHistoryEntry[]>('swap_history_get_recent', { limit: 10 });
      setRecentSwaps(swaps);
    } catch (err) {
      console.error('Failed to load swap history:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <SwapForm jupiter={jupiter} wallet={wallet} />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Swaps
            </h3>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-sm text-purple-400 hover:text-purple-300"
            >
              {showHistory ? 'Hide' : 'Show All'}
            </button>
          </div>

          {recentSwaps.length === 0 ? (
            <div className="bg-gray-700/50 rounded-xl p-8 text-center">
              <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No swap history yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentSwaps.slice(0, showHistory ? undefined : 5).map(swap => (
                <div
                  key={swap.id}
                  className="bg-gray-700/50 rounded-xl p-4 hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold">{swap.fromToken}</span>
                      <span className="text-gray-500">→</span>
                      <span className="font-semibold">{swap.toToken}</span>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-lg ${
                        swap.status === 'completed'
                          ? 'bg-green-500/20 text-green-400'
                          : swap.status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {swap.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-400">Amount</p>
                      <p className="font-medium">{swap.fromAmount.toFixed(6)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Received</p>
                      <p className="font-medium">{swap.toAmount.toFixed(6)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Rate</p>
                      <p className="font-medium">{swap.rate.toFixed(6)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Impact</p>
                      <p className={swap.priceImpact > 5 ? 'text-red-400' : 'text-gray-300'}>
                        {swap.priceImpact.toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  {swap.txSignature && (
                    <div className="mt-2 pt-2 border-t border-gray-600">
                      <p className="text-xs text-gray-500 font-mono truncate">{swap.txSignature}</p>
                    </div>
                  )}

                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(swap.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

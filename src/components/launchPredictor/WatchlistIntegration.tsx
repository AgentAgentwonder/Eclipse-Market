import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Check, Bookmark } from 'lucide-react';
import { useWatchlistStore } from '../../store/watchlistStore';
import type { LaunchPrediction } from './LaunchPredictorPanel';

interface WatchlistIntegrationProps {
  tokenAddress: string;
  prediction: LaunchPrediction;
}

export function WatchlistIntegration({ tokenAddress, prediction }: WatchlistIntegrationProps) {
  const { watchlists, addItem, fetchWatchlists } = useWatchlistStore();
  const [selectedWatchlistId, setSelectedWatchlistId] = useState<string>('');
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    fetchWatchlists().catch(err => console.error('Failed to load watchlists', err));
  }, [fetchWatchlists]);

  const handleAddToWatchlist = async () => {
    if (!selectedWatchlistId) {
      return;
    }

    setAdding(true);
    try {
      await addItem(selectedWatchlistId, tokenAddress, tokenAddress);
      setAdded(true);
      setTimeout(() => setAdded(false), 3000);
    } catch (error) {
      console.error('Failed to add to watchlist:', error);
    } finally {
      setAdding(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="bg-slate-900/60 border border-purple-500/20 rounded-3xl p-6"
    >
      <div className="flex items-center gap-2 mb-6">
        <Bookmark className="w-6 h-6 text-purple-400" />
        <h3 className="text-xl font-semibold">Watchlist Integration</h3>
      </div>

      <div className="flex items-center gap-4">
        <select
          value={selectedWatchlistId}
          onChange={e => setSelectedWatchlistId(e.target.value)}
          className="flex-1 px-4 py-3 bg-slate-800/60 border border-purple-500/20 rounded-2xl text-white focus:outline-none focus:border-purple-500/40"
        >
          <option value="">Select a watchlist...</option>
          {watchlists.map(list => (
            <option key={list.id} value={list.id}>
              {list.name} ({list.items.length} items)
            </option>
          ))}
        </select>

        <button
          onClick={handleAddToWatchlist}
          disabled={!selectedWatchlistId || adding || added}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-2xl font-medium transition-all duration-200 flex items-center gap-2 whitespace-nowrap"
        >
          {added ? (
            <>
              <Check className="w-5 h-5" />
              Added
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              Add Token
            </>
          )}
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-800/40 border border-purple-500/10 rounded-2xl">
          <p className="text-xs uppercase text-slate-400 mb-2">Recommendation</p>
          <p className="text-sm text-white">
            {prediction.successProbability >= 70
              ? 'Strong candidate for watchlist'
              : prediction.successProbability >= 50
              ? 'Monitor with caution'
              : 'High risk - watch closely'}
          </p>
        </div>

        <div className="p-4 bg-slate-800/40 border border-purple-500/10 rounded-2xl">
          <p className="text-xs uppercase text-slate-400 mb-2">Predicted Peak</p>
          <p className="text-sm text-white">
            {prediction.predictedPeakTimeframe || 'Not estimated'}
          </p>
        </div>

        <div className="p-4 bg-slate-800/40 border border-purple-500/10 rounded-2xl">
          <p className="text-xs uppercase text-slate-400 mb-2">Active Warnings</p>
          <p className="text-sm text-white">
            {prediction.earlyWarnings.length} {prediction.earlyWarnings.length === 1 ? 'warning' : 'warnings'}
          </p>
        </div>
      </div>

      <p className="text-xs text-slate-500 mt-4">
        Add this token to a watchlist for continuous monitoring. Price alerts and notification triggers can be configured in the Alerts panel.
      </p>
    </motion.div>
  );
}

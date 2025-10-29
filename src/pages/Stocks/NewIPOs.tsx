import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { Calendar, TrendingUp, RefreshCw } from 'lucide-react';
import type { NewIPO } from '../../types/stocks';

export function NewIPOs() {
  const [ipos, setIpos] = useState<NewIPO[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchIPOs = async () => {
    setLoading(true);
    try {
      const result = await invoke<NewIPO[]>('get_new_ipos');
      setIpos(result);
    } catch (error) {
      console.error('Failed to fetch IPOs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIPOs();
  }, []);

  const getStatusColor = (status: NewIPO['status']) => {
    switch (status) {
      case 'today':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'upcoming':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'recent':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">New IPOs</h2>
          <p className="text-sm text-gray-400">Recent and upcoming public offerings</p>
        </div>
        <button
          onClick={fetchIPOs}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {ipos.map(ipo => (
          <div
            key={ipo.symbol}
            className="bg-slate-800/50 rounded-2xl p-5 border border-purple-500/20 hover:border-purple-500/40 transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold">{ipo.symbol}</h3>
                <p className="text-sm text-gray-400">{ipo.name}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs border ${getStatusColor(ipo.status)}`}>
                {ipo.status.charAt(0).toUpperCase() + ipo.status.slice(1)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-400">IPO Date</p>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  <p className="text-sm font-medium">{ipo.ipoDate}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400">Exchange</p>
                <p className="text-sm font-medium">{ipo.exchange}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-700">
              <div>
                <p className="text-xs text-gray-400">Offer Price</p>
                <p className="text-sm font-semibold">${ipo.offerPrice.toFixed(2)}</p>
              </div>
              {ipo.currentPrice && (
                <>
                  <div>
                    <p className="text-xs text-gray-400">Current</p>
                    <p className="text-sm font-semibold">${ipo.currentPrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Change</p>
                    <div className="flex items-center gap-1">
                      <TrendingUp
                        className={`w-3 h-3 ${
                          (ipo.percentChange || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}
                      />
                      <span
                        className={`text-sm font-semibold ${
                          (ipo.percentChange || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {(ipo.percentChange || 0).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {ipos.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-400">
          <p>No IPO data available</p>
        </div>
      )}
    </div>
  );
}

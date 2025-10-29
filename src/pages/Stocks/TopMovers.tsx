import { useEffect, useMemo, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import type { TopMover } from '../../types/stocks';

const sessions = [
  { id: 'regular', label: 'Regular Hours' },
  { id: 'premarket', label: 'Pre-Market' },
  { id: 'afterhours', label: 'After-Hours' },
];

type SortField = 'percentChange' | 'volume' | 'price';
type SortDirection = 'asc' | 'desc';

interface TopMoversProps {
  selectedSymbol?: string;
  onSelect?: (symbol: string) => void;
}

export function TopMovers({ selectedSymbol, onSelect }: TopMoversProps) {
  const [session, setSession] = useState<'regular' | 'premarket' | 'afterhours'>('regular');
  const [movers, setMovers] = useState<TopMover[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState<SortField>('percentChange');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const fetchMovers = async (selectedSession: typeof session) => {
    setLoading(true);
    try {
      const result = await invoke<TopMover[]>('get_top_movers', {
        session: selectedSession,
      });
      setMovers(result);
    } catch (error) {
      console.error('Failed to fetch top movers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovers(session);
  }, [session]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedMovers = useMemo(() => {
    const sorted = [...movers].sort((a, b) => {
      const valueA = a[sortField];
      const valueB = b[sortField];
      if (valueA === valueB) return 0;
      return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
    });
    return sorted;
  }, [movers, sortField, sortDirection]);

  const formatNumber = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(2);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Top Movers</h2>
          <p className="text-sm text-gray-400">
            Biggest gainers and losers across regular and extended sessions
          </p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex rounded-xl bg-slate-800/60 p-1">
            {sessions.map(item => (
              <button
                key={item.id}
                onClick={() => setSession(item.id as typeof session)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  session === item.id
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => fetchMovers(session)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-purple-500/20 bg-slate-900/40">
        <table className="min-w-full divide-y divide-slate-700/80">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Symbol
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Company
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('price')}
              >
                Price
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('percentChange')}
              >
                Change
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('volume')}
              >
                Volume
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Indicators
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Narrative
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {sortedMovers.map(mover => (
              <tr
                key={`${mover.symbol}-${mover.session}`}
                className={`cursor-pointer transition-colors ${
                  selectedSymbol === mover.symbol
                    ? 'bg-purple-500/10 border-l-2 border-purple-400'
                    : 'hover:bg-slate-800/40'
                }`}
                onClick={() => onSelect?.(mover.symbol)}
              >
                <td className="px-4 py-3 whitespace-nowrap font-semibold">
                  <div className="flex items-center gap-2">
                    <span>{mover.symbol}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${
                        mover.direction === 'gainer'
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}
                    >
                      {mover.direction === 'gainer' ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      {mover.direction === 'gainer' ? 'Gainer' : 'Loser'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-300">{mover.name}</td>
                <td className="px-4 py-3 text-sm">${mover.price.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 text-sm font-medium ${
                      mover.percentChange >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {mover.percentChange >= 0 ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    {mover.percentChange.toFixed(2)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">{formatNumber(mover.volume)}</td>
                <td className="px-4 py-3 text-xs text-gray-300">
                  <div className="flex flex-col gap-1">
                    {mover.technicalIndicators.rsi && (
                      <span>RSI: {mover.technicalIndicators.rsi.toFixed(1)}</span>
                    )}
                    {mover.technicalIndicators.macd && <span>MACD: {mover.technicalIndicators.macd}</span>}
                    <span>Volume Ratio: {mover.technicalIndicators.volumeRatio.toFixed(2)}x</span>
                    {mover.technicalIndicators.momentum && (
                      <span>Momentum: {mover.technicalIndicators.momentum}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-300 max-w-xs">
                  <p className="line-clamp-3">{mover.reason}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {sortedMovers.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-400">
            <p>No movers data available for the selected session</p>
          </div>
        )}
      </div>
    </div>
  );
}

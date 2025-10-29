import { useEffect, useMemo, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { Building2, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import type { InstitutionalHolding } from '../../types/stocks';

interface InstitutionalHoldingsProps {
  symbol?: string;
}

export function InstitutionalHoldings({ symbol }: InstitutionalHoldingsProps) {
  const [holdings, setHoldings] = useState<InstitutionalHolding[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!symbol) {
      setHoldings([]);
      return;
    }

    const fetchHoldings = async () => {
      setLoading(true);
      try {
        const result = await invoke<InstitutionalHolding[]>('get_institutional_holdings', {
          symbol,
        });
        setHoldings(result);
      } catch (error) {
        console.error('Failed to fetch holdings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHoldings();
  }, [symbol]);

  const totalShares = useMemo(
    () => holdings.reduce((sum, item) => sum + item.shares, 0),
    [holdings]
  );

  if (!symbol) {
    return (
      <div className="bg-slate-900/40 border border-purple-500/10 rounded-2xl p-6 text-center text-gray-400">
        <Building2 className="w-6 h-6 mx-auto mb-2" />
        <p>Select a stock to view institutional positioning.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/40 border border-purple-500/10 rounded-2xl p-6 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-300" />
            Institutional Holdings
          </h3>
          <p className="text-sm text-gray-400">Quarterly changes and whale activity for {symbol}</p>
        </div>
        <div className="text-sm text-gray-300">
          <span className="font-semibold">Total Tracked Shares:</span>{' '}
          {totalShares.toLocaleString()}
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Loading institutional data…</span>
        </div>
      )}

      <div className="overflow-x-auto -mx-4 lg:mx-0">
        <table className="min-w-full divide-y divide-slate-800">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Institution
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Shares
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Value
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Portfolio %
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                QoQ Change
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Quarter
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {holdings.map(holding => (
              <tr key={`${holding.institutionName}-${holding.quarter}`} className="hover:bg-slate-800/40">
                <td className="px-4 py-3 text-sm font-medium text-gray-200">
                  <div className="flex items-center gap-2">
                    <span>{holding.institutionName}</span>
                    {holding.isWhale && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-500/40">
                        Whale
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">
                  {holding.shares.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm">
                  ${holding.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
                <td className="px-4 py-3 text-sm">
                  {holding.percentOfPortfolio.toFixed(2)}%
                </td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={`inline-flex items-center gap-1 ${
                      holding.changePercent >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {holding.changePercent >= 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {holding.changePercent >= 0 ? '+' : ''}
                    {holding.changePercent.toFixed(2)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-300">{holding.quarter}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {holdings.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-400">
          <p>No institutional data available.</p>
        </div>
      )}
    </div>
  );
}

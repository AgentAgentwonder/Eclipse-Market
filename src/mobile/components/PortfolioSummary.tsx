import React from 'react';
import { MobileCard } from '../layout/MobileCard';

interface PortfolioSummaryProps {
  portfolio: {
    total_value: number;
    total_change_24h: number;
    total_change_pct: number;
    top_holdings: Array<{
      symbol: string;
      amount: number;
      value: number;
      change_pct: number;
    }>;
  };
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value > 10000 ? 0 : 2,
  }).format(value);

const formatPercent = (value: number) =>
  `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;

export const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({ portfolio }) => {
  return (
    <div className="bg-gray-800 rounded-2xl p-4 shadow-lg">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h2 className="text-lg font-semibold">Portfolio Value</h2>
          <div className="text-3xl font-bold mt-2">{formatCurrency(portfolio.total_value)}</div>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            portfolio.total_change_24h >= 0
              ? 'bg-emerald-500/20 text-emerald-300'
              : 'bg-red-500/20 text-red-300'
          }`}
        >
          {formatPercent(portfolio.total_change_pct)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-900/60 rounded-xl p-3">
          <div className="text-xs text-gray-400">24h Change</div>
          <div className="text-lg font-semibold">
            {formatCurrency(portfolio.total_change_24h)}
          </div>
        </div>
        <div className="bg-gray-900/60 rounded-xl p-3">
          <div className="text-xs text-gray-400">Top Asset</div>
          <div className="text-lg font-semibold">
            {portfolio.top_holdings[0]?.symbol ?? 'N/A'}
          </div>
        </div>
      </div>

      {portfolio.top_holdings.length > 0 && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold text-gray-300">Top Holdings</h3>
            <span className="text-xs text-gray-400">24h Change</span>
          </div>
          <div className="space-y-2">
            {portfolio.top_holdings.map((holding) => (
              <div
                key={holding.symbol}
                className="flex items-center justify-between bg-gray-900/40 rounded-xl px-3 py-2"
              >
                <div>
                  <div className="text-sm font-semibold">{holding.symbol}</div>
                  <div className="text-xs text-gray-400">
                    {holding.amount.toLocaleString()} • {formatCurrency(holding.value)}
                  </div>
                </div>
                <div
                  className={`text-sm font-semibold ${
                    holding.change_pct >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {formatPercent(holding.change_pct)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

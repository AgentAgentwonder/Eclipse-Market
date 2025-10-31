import React from 'react';

interface PriceWatchProps {
  markets: Array<{
    symbol: string;
    price: number;
    change_24h: number;
    volume_24h: number;
    timestamp: number;
  }>;
}

const formatCurrency = (value: number, symbol: string) => {
  if (value < 0.001) {
    return `$${value.toFixed(6)}`;
  }
  if (value < 1) {
    return `$${value.toFixed(4)}`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
};

const formatVolume = (value: number) => {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
};

export const PriceWatch: React.FC<PriceWatchProps> = ({ markets }) => {
  return (
    <div className="bg-gray-800 rounded-2xl p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Price Watch</h2>
        <span className="text-xs text-gray-400">Live</span>
      </div>

      <div className="space-y-3">
        {markets.map((market) => {
          const isPositive = market.change_24h >= 0;

          return (
            <div
              key={market.symbol}
              className="bg-gray-900/40 rounded-xl px-4 py-3 flex items-center justify-between"
            >
              <div>
                <div className="text-sm font-semibold">{market.symbol}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Vol: {formatVolume(market.volume_24h)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">
                  {formatCurrency(market.price, market.symbol)}
                </div>
                <div
                  className={`text-xs font-medium ${
                    isPositive ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {isPositive ? '+' : ''}
                  {market.change_24h.toFixed(2)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

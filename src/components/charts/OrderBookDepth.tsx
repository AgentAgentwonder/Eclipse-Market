import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { calculateOrderBookDepth, computeQuickTradeRecommendation } from '../../utils/orderBook';
import { OrderBookDepthData } from '../../types/indicators';

interface DepthProps {
  bids: Array<{ price: number; amount: number }>;
  asks: Array<{ price: number; amount: number }>;
  height?: number;
  onQuickTrade?: (side: 'buy' | 'sell') => void;
}

export const OrderBookDepth: React.FC<DepthProps> = ({
  bids,
  asks,
  height = 300,
  onQuickTrade,
}) => {
  const depth = useMemo<OrderBookDepthData>(() => calculateOrderBookDepth(bids, asks), [bids, asks]);
  const recommendation = useMemo(() => computeQuickTradeRecommendation(depth), [depth]);

  const maxTotal = Math.max(
    Math.max(...depth.bids.map(level => level.total), 1),
    Math.max(...depth.asks.map(level => level.total), 1)
  );

  const renderLevel = (
    side: 'bid' | 'ask',
    level: OrderBookDepthData['bids'][number],
    index: number
  ) => {
    const percentage = level.total / maxTotal;
    const widthClass = `${Math.max(percentage * 90, 5)}%`;
    const isBid = side === 'bid';

    return (
      <div key={`${side}-${index}`} className="grid grid-cols-4 text-xs font-mono relative">
        <div className="py-1 px-2 z-10 text-right">{level.price.toFixed(4)}</div>
        <div className="py-1 px-2 z-10 text-right text-slate-300">{level.amount.toFixed(3)}</div>
        <div className="py-1 px-2 z-10 text-right text-slate-400">{level.total.toFixed(3)}</div>
        <div className="py-1 px-2 z-10 text-right text-slate-500">{level.percentage.toFixed(1)}%</div>
        <div
          className={`absolute inset-y-1 ${
            isBid ? 'right-0 bg-emerald-500/20' : 'left-0 bg-rose-500/20'
          } rounded-sm transition-all duration-300`}
          style={{ width: widthClass }}
        />
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/60 border border-slate-700/50 rounded-xl overflow-hidden text-slate-100"
    >
      <div className="px-4 py-3 flex items-center justify-between border-b border-slate-700/50">
        <div>
          <h3 className="text-lg font-semibold">Depth Map</h3>
          <p className="text-xs text-slate-400">
            Spread: ${depth.spread.toFixed(4)} ({depth.spreadPercent.toFixed(3)}%) · Imbalance:{' '}
            {depth.imbalance.toFixed(2)}
          </p>
        </div>
        {onQuickTrade && recommendation.bias !== 'neutral' && (
          <button
            onClick={() => onQuickTrade(recommendation.bias)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold shadow-sm transition-colors ${
              recommendation.bias === 'buy'
                ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
            }`}
          >
            Quick {recommendation.bias === 'buy' ? 'Buy' : 'Sell'} ·
            {' '}
            {(recommendation.confidence * 100).toFixed(0)}% confidence
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2" style={{ minHeight: height }}>
        <div className="border-b md:border-b-0 md:border-r border-slate-800/60">
          <div className="px-4 py-2 text-emerald-300 text-xs font-semibold uppercase tracking-widest">
            Bids ({depth.totalBidVolume.toFixed(2)})
          </div>
          <div className="px-2 space-y-1">
            {depth.bids.slice(0, 15).map((level, i) => renderLevel('bid', level, i))}
          </div>
        </div>
        <div>
          <div className="px-4 py-2 text-rose-300 text-xs font-semibold uppercase tracking-widest">
            Asks ({depth.totalAskVolume.toFixed(2)})
          </div>
          <div className="px-2 space-y-1">
            {depth.asks.slice(0, 15).map((level, i) => renderLevel('ask', level, i))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

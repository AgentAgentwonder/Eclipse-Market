import { OrderBookDepthData, OrderBookLevel } from '../types/indicators';

type RawOrder = {
  price: number;
  amount: number;
};

export function calculateOrderBookDepth(
  bids: RawOrder[],
  asks: RawOrder[]
): OrderBookDepthData {
  const sortedBids = [...bids].sort((a, b) => b.price - a.price);
  const sortedAsks = [...asks].sort((a, b) => a.price - b.price);

  const bidLevels = buildDepthLevels(sortedBids, 'bid');
  const askLevels = buildDepthLevels(sortedAsks, 'ask');

  const bestBid = bidLevels[0]?.price ?? 0;
  const bestAsk = askLevels[0]?.price ?? 0;
  const midPrice = bestBid && bestAsk ? (bestBid + bestAsk) / 2 : bestBid || bestAsk || 0;
  const spread = bestAsk > 0 && bestBid > 0 ? bestAsk - bestBid : 0;
  const spreadPercent = midPrice > 0 ? (spread / midPrice) * 100 : 0;

  const totalBidVolume = bidLevels.reduce((acc, level) => acc + level.amount, 0);
  const totalAskVolume = askLevels.reduce((acc, level) => acc + level.amount, 0);
  const imbalance = totalAskVolume > 0 ? totalBidVolume / totalAskVolume : 0;

  return {
    bids: bidLevels,
    asks: askLevels,
    spread,
    spreadPercent,
    midPrice,
    imbalance,
    totalBidVolume,
    totalAskVolume,
  };
}

function buildDepthLevels(orders: RawOrder[], type: 'bid' | 'ask'): OrderBookLevel[] {
  let cumulative = 0;
  const totalVolume = orders.reduce((acc, cur) => acc + cur.amount, 0);

  return orders.map(order => {
    cumulative += order.amount;
    return {
      price: order.price,
      amount: order.amount,
      total: cumulative,
      percentage: totalVolume > 0 ? (cumulative / totalVolume) * 100 : 0,
    };
  });
}

export function computeQuickTradeRecommendation(depth: OrderBookDepthData): {
  bias: 'buy' | 'sell' | 'neutral';
  confidence: number;
} {
  const { imbalance, spreadPercent } = depth;

  if (!Number.isFinite(imbalance) || imbalance === 0) {
    return { bias: 'neutral', confidence: 0 };
  }

  const normalized = Math.min(Math.abs(imbalance - 1), 1);
  const confidence = Math.max(0, 1 - Math.min(spreadPercent / 1.5, 1)) * normalized;

  if (imbalance > 1.05) {
    return { bias: 'buy', confidence };
  }
  
  if (imbalance < 0.95) {
    return { bias: 'sell', confidence };
  }

  return { bias: 'neutral', confidence: normalized * 0.5 };
}

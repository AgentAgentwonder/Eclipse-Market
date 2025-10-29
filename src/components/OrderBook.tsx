import { useOrderBook } from '../hooks/useOrderBook';
import { OrderBookDepth } from './charts/OrderBookDepth';

export function OrderBook() {
  const { bids, asks } = useOrderBook();

  return <OrderBookDepth bids={bids} asks={asks} height={400} />;
}

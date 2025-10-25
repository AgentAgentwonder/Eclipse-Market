import { MarketData } from '../components/MarketData';
import { LiveChart } from '../components/LiveChart';
import { OrderBook } from '../components/OrderBook';

export function Market() {
  return (
    <div className="space-y-4">
      <MarketData />
      <LiveChart />
      <OrderBook />
    </div>
  );
}

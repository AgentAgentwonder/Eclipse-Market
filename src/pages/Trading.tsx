import { OrderBook } from '../components/OrderBook';
import { SwapForm } from '../components/SwapForm';
import { useJupiter } from '../hooks/useJupiter';
import { useWallet } from '../hooks/useWallet';

export function Trading() {
  const jupiter = useJupiter();
  const wallet = useWallet();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
      <div className="lg:col-span-2 order-2 lg:order-1">
        <OrderBook />
      </div>
      <div className="order-1 lg:order-2">
        <SwapForm jupiter={jupiter} wallet={wallet} />
      </div>
    </div>
  );
}

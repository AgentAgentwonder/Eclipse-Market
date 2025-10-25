import { SwapForm } from '../components/SwapForm';
import { OrderBook } from '../components/OrderBook';
import { useSwap } from '../hooks/useJupiter';

export function Trading() {
  const { executeSwap, loading } = useSwap();

  return (
    <div className="grid grid-cols-3 gap-4 p-4">
      <div className="col-span-2">
        <OrderBook />
      </div>
      <div>
        <SwapForm onSubmit={executeSwap} loading={loading} />
      </div>
    </div>
  );
}

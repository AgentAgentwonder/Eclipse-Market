import { useOrderBook } from '../hooks/useOrderBook';

export function OrderBook() {
  const { bids, asks } = useOrderBook();

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <h2 className="p-4 text-lg font-semibold border-b border-gray-700">
        Order Book
      </h2>
      
      <div className="grid grid-cols-2">
        <div className="border-r border-gray-700">
          <div className="p-2 bg-red-900/20 text-sm text-red-400 font-mono">
            BIDS
          </div>
          {bids.map((bid, i) => (
            <div key={i} className="grid grid-cols-3 p-1 px-2 text-sm font-mono">
              <div className="text-green-400">{bid.price.toFixed(4)}</div>
              <div className="text-right">{bid.amount.toFixed(4)}</div>
              <div className="text-right text-gray-400">
                {(bid.price * bid.amount).toFixed(4)}
              </div>
            </div>
          ))}
        </div>
        
        <div>
          <div className="p-2 bg-green-900/20 text-sm text-green-400 font-mono">
            ASKS
          </div>
          {asks.map((ask, i) => (
            <div key={i} className="grid grid-cols-3 p-1 px-2 text-sm font-mono">
              <div className="text-red-400">{ask.price.toFixed(4)}</div>
              <div className="text-right">{ask.amount.toFixed(4)}</div>
              <div className="text-right text-gray-400">
                {(ask.price * ask.amount).toFixed(4)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

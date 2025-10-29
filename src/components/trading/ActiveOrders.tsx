import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { Loader2, XCircle, TrendingUp, TrendingDown } from 'lucide-react';
import type { Order, OrderStatus, OrderType } from '../../types/trading';

interface ActiveOrdersProps {
  walletAddress?: string;
}

const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  market: 'Market',
  limit: 'Limit',
  stop_loss: 'Stop Loss',
  take_profit: 'Take Profit',
  trailing_stop: 'Trailing Stop',
};

const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'text-yellow-400',
  partially_filled: 'text-blue-400',
  filled: 'text-green-400',
  cancelled: 'text-gray-500',
  expired: 'text-gray-500',
  failed: 'text-red-400',
};

export function ActiveOrders({ walletAddress }: ActiveOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!walletAddress) return;

    let unsubscribe: (() => void) | undefined;

    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await invoke<Order[]>('get_active_orders', {
          walletAddress,
        });
        setOrders(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    const listenForUpdates = async () => {
      const { listen } = await import('@tauri-apps/api/event');
      unsubscribe = await listen<Order>('order_update', event => {
        setOrders(current => {
          const idx = current.findIndex(o => o.id === event.payload.id);
          if (idx === -1) {
            return [event.payload, ...current];
          }
          const updated = [...current];
          updated[idx] = event.payload;
          return updated;
        });
      });
    };

    fetchOrders();
    listenForUpdates();

    return () => {
      unsubscribe?.();
    };
  }, [walletAddress]);

  const handleCancel = async (orderId: string) => {
    try {
      await invoke('cancel_order', { orderId });
    } catch (err) {
      console.error('Failed to cancel order:', err);
    }
  };

  if (!walletAddress) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 text-sm text-gray-400">
        Connect your wallet to view active orders.
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold">Active Orders</h2>
      </div>

      {loading ? (
        <div className="p-6 flex items-center justify-center text-gray-400">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Loading orders...
        </div>
      ) : error ? (
        <div className="p-4 text-sm text-red-400">{error}</div>
      ) : orders.length === 0 ? (
        <div className="p-6 text-sm text-gray-400">No active orders</div>
      ) : (
        <div className="divide-y divide-gray-700">
          {orders.map(order => (
            <div key={order.id} className="p-4 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-200">
                      {ORDER_TYPE_LABELS[order.order_type]}
                    </span>
                    <span
                      className={`text-xs uppercase font-semibold ${
                        order.side === 'buy' ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {order.side}
                    </span>
                    <span className={`text-xs ${ORDER_STATUS_COLORS[order.status]}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {order.input_symbol} → {order.output_symbol}
                  </div>
                </div>

                {order.status === 'pending' && (
                  <button
                    onClick={() => handleCancel(order.id)}
                    className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded font-medium"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                <div className="bg-gray-700/40 p-2 rounded">
                  <div className="text-gray-500">Amount</div>
                  <div className="text-gray-200">{order.amount}</div>
                </div>
                <div className="bg-gray-700/40 p-2 rounded">
                  <div className="text-gray-500">Filled</div>
                  <div className="text-gray-200">{order.filled_amount}</div>
                </div>

                {order.limit_price && (
                  <div className="bg-gray-700/40 p-2 rounded">
                    <div className="text-gray-500">Limit Price</div>
                    <div className="text-gray-200">${order.limit_price.toFixed(4)}</div>
                  </div>
                )}

                {order.stop_price && (
                  <div className="bg-gray-700/40 p-2 rounded">
                    <div className="text-gray-500">Stop Price</div>
                    <div className="text-gray-200">${order.stop_price.toFixed(4)}</div>
                  </div>
                )}

                {order.trailing_percent && (
                  <div className="bg-gray-700/40 p-2 rounded">
                    <div className="text-gray-500">Trailing</div>
                    <div className="text-gray-200">{order.trailing_percent}%</div>
                  </div>
                )}

                {order.tx_signature && (
                  <div className="bg-gray-700/40 p-2 rounded col-span-2">
                    <div className="text-gray-500">Transaction</div>
                    <div className="text-gray-200 font-mono text-xs break-all">
                      {order.tx_signature}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

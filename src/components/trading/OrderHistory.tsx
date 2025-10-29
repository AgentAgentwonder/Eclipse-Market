import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { Order, OrderStatus, OrderType } from '../../types/trading';

interface OrderHistoryProps {
  walletAddress?: string;
  limit?: number;
}

const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  market: 'Market',
  limit: 'Limit',
  stop_loss: 'Stop Loss',
  take_profit: 'Take Profit',
  trailing_stop: 'Trailing Stop',
};

const STATUS_ICONS: Record<OrderStatus, React.ReactNode> = {
  filled: <CheckCircle className="w-4 h-4 text-green-400" />,
  cancelled: <XCircle className="w-4 h-4 text-gray-500" />,
  failed: <AlertCircle className="w-4 h-4 text-red-400" />,
  expired: <XCircle className="w-4 h-4 text-gray-500" />,
  pending: <Loader2 className="w-4 h-4 text-yellow-400" />,
  partially_filled: <Loader2 className="w-4 h-4 text-blue-400" />,
};

export function OrderHistory({ walletAddress, limit = 50 }: OrderHistoryProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!walletAddress) return;

    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await invoke<Order[]>('get_order_history', {
          walletAddress,
          limit,
        });
        setOrders(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [walletAddress, limit]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (!walletAddress) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 text-sm text-gray-400">
        Connect your wallet to view order history.
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold">Order History</h2>
      </div>

      {loading ? (
        <div className="p-6 flex items-center justify-center text-gray-400">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Loading history...
        </div>
      ) : error ? (
        <div className="p-4 text-sm text-red-400">{error}</div>
      ) : orders.length === 0 ? (
        <div className="p-6 text-sm text-gray-400">No order history</div>
      ) : (
        <div className="divide-y divide-gray-700">
          {orders.map(order => (
            <div key={order.id} className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  {STATUS_ICONS[order.status]}
                  <div>
                    <div className="text-sm font-medium">
                      {ORDER_TYPE_LABELS[order.order_type]}
                      <span
                        className={`ml-2 uppercase font-semibold ${
                          order.side === 'buy' ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {order.side}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {order.input_symbol} → {order.output_symbol}
                    </div>
                  </div>
                </div>

                <div className="text-right text-xs text-gray-400">
                  {formatDate(order.created_at)}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-gray-700/40 p-2 rounded">
                  <div className="text-gray-500">Amount</div>
                  <div className="text-gray-200">{order.amount}</div>
                </div>
                <div className="bg-gray-700/40 p-2 rounded">
                  <div className="text-gray-500">Filled</div>
                  <div className="text-gray-200">{order.filled_amount}</div>
                </div>
                <div className="bg-gray-700/40 p-2 rounded">
                  <div className="text-gray-500">Status</div>
                  <div className="text-gray-200 capitalize">{order.status.replace('_', ' ')}</div>
                </div>

                {order.limit_price && (
                  <div className="bg-gray-700/40 p-2 rounded">
                    <div className="text-gray-500">Price</div>
                    <div className="text-gray-200">${order.limit_price.toFixed(4)}</div>
                  </div>
                )}

                {order.triggered_at && (
                  <div className="bg-gray-700/40 p-2 rounded col-span-2">
                    <div className="text-gray-500">Triggered</div>
                    <div className="text-gray-200">{formatDate(order.triggered_at)}</div>
                  </div>
                )}
              </div>

              {order.error_message && (
                <div className="mt-2 text-xs text-red-400 bg-red-500/10 p-2 rounded">
                  {order.error_message}
                </div>
              )}

              {order.tx_signature && (
                <div className="mt-2 text-xs text-gray-400 bg-gray-700/40 p-2 rounded">
                  <span className="text-gray-500">TX: </span>
                  <span className="font-mono">{order.tx_signature}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

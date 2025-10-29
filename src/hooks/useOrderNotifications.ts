import { useEffect } from 'react';
import { listen, UnlistenFn } from '@tauri-apps/api/event';

interface OrderTriggeredEvent {
  order_id: string;
  order_type: string;
  symbol: string;
  side: string;
  trigger_price: number;
  amount: number;
}

export function useOrderNotifications() {
  useEffect(() => {
    let unlisten: UnlistenFn | undefined;

    const setupListener = async () => {
      unlisten = await listen<OrderTriggeredEvent>('order_triggered', event => {
        const { order_type, symbol, side, trigger_price, amount } = event.payload;

        showNotification({
          title: `Order Triggered: ${order_type}`,
          message: `${side.toUpperCase()} ${amount} ${symbol} at $${trigger_price.toFixed(4)}`,
          type: 'success',
        });
      });
    };

    setupListener();

    return () => {
      unlisten?.();
    };
  }, []);
}

function showNotification(options: {
  title: string;
  message: string;
  type: 'success' | 'error' | 'info';
}) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(options.title, {
      body: options.message,
      icon: '/icon.png',
    });
  } else {
    console.log(`[${options.type}] ${options.title}: ${options.message}`);
  }
}

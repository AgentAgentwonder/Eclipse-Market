import { useEffect } from 'react';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { useAlertStore } from '../store/alertStore';

interface AlertTriggeredEvent {
  alertId: string;
  alertName: string;
  symbol: string;
  currentPrice: number;
  conditionsMet: string;
  triggeredAt: string;
}

export function useAlertNotifications() {
  const setLastTriggerEvent = useAlertStore((state) => state.setLastTriggerEvent);

  useEffect(() => {
    let unlisten: UnlistenFn | undefined;

    const setupListener = async () => {
      unlisten = await listen<AlertTriggeredEvent>('alert_triggered', (event) => {
        const { alertName, symbol, currentPrice, conditionsMet } = event.payload;

        showNotification({
          title: `Alert Triggered: ${alertName}`,
          message: `${symbol} at $${currentPrice.toFixed(4)} - ${conditionsMet}`,
          type: 'success',
        });

        setLastTriggerEvent(event.payload);
      });
    };

    setupListener();

    return () => {
      unlisten?.();
    };
  }, [setLastTriggerEvent]);
}

function showNotification(options: { title: string; message: string; type: 'success' | 'error' | 'info' }) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(options.title, {
      body: options.message,
      icon: '/icon.png',
    });
  } else if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        new Notification(options.title, {
          body: options.message,
          icon: '/icon.png',
        });
      }
    });
  } else {
    console.log(`[${options.type}] ${options.title}: ${options.message}`);
  }
}

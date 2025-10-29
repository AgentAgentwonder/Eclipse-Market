import { useEffect } from 'react';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { useAlertStore } from '../store/alertStore';
import { EnhancedAlertNotification, TransactionDetails } from '../types/alertNotifications';

interface AlertTriggeredEvent {
  alertId: string;
  alertName: string;
  symbol: string;
  currentPrice: number;
  conditionsMet: string;
  triggeredAt: string;
  priceChange24h?: number;
  priceChange7d?: number;
  transaction?: TransactionDetails;
  contextMessage?: string;
  similarOpportunities?: Array<{
    symbol: string;
    mint: string;
    currentPrice: number;
    priceChange24h: number;
    matchReason: string;
    volume24h?: number;
  }>;
}

export function useAlertNotifications() {
  const setLastTriggerEvent = useAlertStore(state => state.setLastTriggerEvent);
  const addEnhancedNotification = useAlertStore(state => state.addEnhancedNotification);

  useEffect(() => {
    let unlisten: UnlistenFn | undefined;

    const setupListener = async () => {
      unlisten = await listen<AlertTriggeredEvent>('alert_triggered', event => {
        const { alertName, symbol, currentPrice, conditionsMet } = event.payload;

        showNotification({
          title: `Alert Triggered: ${alertName}`,
          message: `${symbol} at ${currentPrice.toFixed(4)} - ${conditionsMet}`,
          type: 'success',
        });

        setLastTriggerEvent({
          alertId: event.payload.alertId,
          alertName: event.payload.alertName,
          symbol: event.payload.symbol,
          currentPrice: event.payload.currentPrice,
          conditionsMet: event.payload.conditionsMet,
          triggeredAt: event.payload.triggeredAt,
        });

        const enhancedNotification: EnhancedAlertNotification = {
          alertId: event.payload.alertId,
          alertName: event.payload.alertName,
          symbol: event.payload.symbol,
          currentPrice: event.payload.currentPrice,
          priceChange24h: event.payload.priceChange24h,
          priceChange7d: event.payload.priceChange7d,
          conditionsMet: event.payload.conditionsMet,
          triggeredAt: event.payload.triggeredAt,
          transaction: event.payload.transaction,
          contextMessage: event.payload.contextMessage,
          similarOpportunities: event.payload.similarOpportunities,
        };

        addEnhancedNotification(enhancedNotification);
      });
    };

    setupListener();

    return () => {
      unlisten?.();
    };
  }, [setLastTriggerEvent, addEnhancedNotification]);
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
  } else if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
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

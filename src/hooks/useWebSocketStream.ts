import { useEffect, useRef, useState, useCallback } from 'react';
import { listen, UnlistenFn } from '@tauri-apps/api/event';

export interface ConnectionStatus {
  provider: string;
  state: 'Connecting' | 'Connected' | 'Disconnecting' | 'Disconnected' | 'Failed' | 'Fallback';
  lastMessage: number | null;
  statistics: {
    messagesReceived: number;
    messagesSent: number;
    bytesReceived: number;
    bytesSent: number;
    reconnectCount: number;
    uptimeMs: number;
    averageLatencyMs: number;
    droppedMessages: number;
  };
  subscriptions: {
    prices: string[];
    wallets: string[];
  };
  fallback?: {
    active: boolean;
    lastSuccess: number | null;
    intervalMs: number;
    reason: string | null;
  };
}

export function useWebSocketStream<T>(
  eventName: string,
  options?: {
    onData?: (data: T) => void;
    enabled?: boolean;
  }
) {
  const [data, setData] = useState<T | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const unlistenRef = useRef<UnlistenFn>();

  const { onData, enabled = true } = options || {};

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let mounted = true;

    const setupListener = async () => {
      const unlisten = await listen<T>(eventName, event => {
        if (!mounted) return;

        const payload = event.payload;
        setData(payload);
        setIsConnected(true);

        if (onData) {
          onData(payload);
        }
      });

      if (mounted) {
        unlistenRef.current = unlisten;
      } else {
        unlisten();
      }
    };

    setupListener();

    return () => {
      mounted = false;
      if (unlistenRef.current) {
        unlistenRef.current();
      }
    };
  }, [eventName, enabled, onData]);

  return {
    data,
    isConnected,
  };
}

export function useStreamStatus() {
  const [statuses, setStatuses] = useState<ConnectionStatus[]>([]);

  useEffect(() => {
    let unlisten: UnlistenFn | undefined;

    const setupListener = async () => {
      unlisten = await listen<ConnectionStatus>('stream_status_change', event => {
        setStatuses(prev => {
          const updated = prev.filter(s => s.provider !== event.payload.provider);
          return [...updated, event.payload];
        });
      });
    };

    setupListener();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, []);

  return statuses;
}

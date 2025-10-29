import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/tauri';
import { EnhancedAlertNotification } from '../types/alertNotifications';

export type AlertConditionType = 'above' | 'below' | 'percent_change' | 'volume_spike';
export type LogicalOperator = 'and' | 'or';
export type AlertState = 'active' | 'triggered' | 'cooldown' | 'disabled';
export type NotificationChannel =
  | 'in_app'
  | 'system'
  | 'email'
  | 'webhook'
  | 'telegram'
  | 'slack'
  | 'discord';

export interface AlertCondition {
  conditionType: AlertConditionType;
  value: number;
  timeframeMinutes?: number | null;
}

export interface CompoundCondition {
  conditions: AlertCondition[];
  operator: LogicalOperator;
}

export interface PriceAlert {
  id: string;
  name: string;
  symbol: string;
  mint: string;
  watchlistId?: string | null;
  compoundCondition: CompoundCondition;
  notificationChannels: NotificationChannel[];
  cooldownMinutes: number;
  state: AlertState;
  lastTriggeredAt?: string | null;
  cooldownUntil?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AlertTestResult {
  alertId: string;
  wouldTrigger: boolean;
  conditionsMet: boolean[];
  currentPrice: number;
  message: string;
}

interface AlertStateStore {
  alerts: PriceAlert[];
  isLoading: boolean;
  error: string | null;
  lastTriggerEvent: {
    alertId: string;
    alertName: string;
    symbol: string;
    currentPrice: number;
    conditionsMet: string;
    triggeredAt: string;
  } | null;
  enhancedNotifications: EnhancedAlertNotification[];

  fetchAlerts: () => Promise<void>;
  createAlert: (
    payload: Omit<
      PriceAlert,
      'id' | 'state' | 'createdAt' | 'updatedAt' | 'lastTriggeredAt' | 'cooldownUntil'
    >
  ) => Promise<PriceAlert>;
  updateAlert: (id: string, payload: Partial<PriceAlert>) => Promise<PriceAlert>;
  deleteAlert: (id: string) => Promise<void>;
  testAlert: (
    id: string,
    currentPrice: number,
    price24hAgo?: number | null,
    volume24h?: number | null
  ) => Promise<AlertTestResult>;
  setLastTriggerEvent: (event: AlertStateStore['lastTriggerEvent']) => void;
  addEnhancedNotification: (notification: EnhancedAlertNotification) => void;
  dismissNotification: (alertId: string) => void;
}

export const useAlertStore = create<AlertStateStore>((set, get) => ({
  alerts: [],
  isLoading: false,
  error: null,
  lastTriggerEvent: null,
  enhancedNotifications: [],

  fetchAlerts: async () => {
    set({ isLoading: true, error: null });
    try {
      const alerts = await invoke<PriceAlert[]>('alert_list');
      set({ alerts, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  createAlert: async payload => {
    set({ error: null });
    try {
      const alert = await invoke<PriceAlert>('alert_create', {
        req: {
          name: payload.name,
          symbol: payload.symbol,
          mint: payload.mint,
          watchlistId: payload.watchlistId ?? null,
          compoundCondition: payload.compoundCondition,
          notificationChannels: payload.notificationChannels,
          cooldownMinutes: payload.cooldownMinutes,
        },
      });
      set(state => ({ alerts: [alert, ...state.alerts] }));
      return alert;
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  updateAlert: async (id, payload) => {
    set({ error: null });
    try {
      const alert = await invoke<PriceAlert>('alert_update', {
        id,
        req: {
          name: payload.name,
          compoundCondition: payload.compoundCondition,
          notificationChannels: payload.notificationChannels,
          cooldownMinutes: payload.cooldownMinutes,
          state: payload.state,
        },
      });
      set(state => ({
        alerts: state.alerts.map(a => (a.id === id ? alert : a)),
      }));
      return alert;
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  deleteAlert: async id => {
    set({ error: null });
    try {
      await invoke('alert_delete', { id });
      set(state => ({ alerts: state.alerts.filter(a => a.id !== id) }));
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  testAlert: async (id, currentPrice, price24hAgo, volume24h) => {
    set({ error: null });
    try {
      const result = await invoke<AlertTestResult>('alert_test', {
        id,
        currentPrice,
        price24hAgo: price24hAgo ?? null,
        volume24h: volume24h ?? null,
      });
      return result;
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  setLastTriggerEvent: event => set({ lastTriggerEvent: event }),

  addEnhancedNotification: notification => {
    set(state => {
      const filtered = state.enhancedNotifications.filter(
        existing => existing.alertId !== notification.alertId
      );
      return {
        enhancedNotifications: [notification, ...filtered].slice(0, 3),
      };
    });
  },

  dismissNotification: alertId => {
    set(state => ({
      enhancedNotifications: state.enhancedNotifications.filter(n => n.alertId !== alertId),
    }));
  },
}));

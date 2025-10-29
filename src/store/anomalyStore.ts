import { create } from 'zustand';
import { invoke } from '@tauri-apps/api';
import type {
  Anomaly,
  AnomalyDetectionConfig,
  AnomalyStatistics,
  PriceData,
  TransactionData,
} from '../types/anomalies';

interface AnomalyState {
  anomalies: Anomaly[];
  activeAnomalies: Anomaly[];
  config: AnomalyDetectionConfig | null;
  statistics: Record<string, AnomalyStatistics>;
  loading: boolean;
  error: string | null;

  fetchAnomalies: (tokenAddress?: string, anomalyType?: string) => Promise<void>;
  fetchActiveAnomalies: () => Promise<void>;
  addPriceData: (tokenAddress: string, data: PriceData) => Promise<void>;
  addTransactionData: (tokenAddress: string, data: TransactionData) => Promise<void>;
  dismissAnomaly: (anomalyId: string) => Promise<void>;
  updateConfig: (config: AnomalyDetectionConfig) => Promise<void>;
  fetchConfig: () => Promise<void>;
  fetchStatistics: (tokenAddress: string) => Promise<void>;
  generateMockData: (tokenAddress: string) => Promise<void>;
}

export const useAnomalyStore = create<AnomalyState>((set, get) => ({
  anomalies: [],
  activeAnomalies: [],
  config: null,
  statistics: {},
  loading: false,
  error: null,

  fetchAnomalies: async (tokenAddress?: string, anomalyType?: string) => {
    try {
      set({ loading: true, error: null });
      const result = await invoke<Anomaly[]>('get_anomalies', {
        tokenAddress: tokenAddress ?? null,
        anomalyType: anomalyType ?? null,
      });
      set({ anomalies: result, loading: false });
    } catch (error) {
      set({ error: String(error), loading: false });
    }
  },

  fetchActiveAnomalies: async () => {
    try {
      set({ loading: true, error: null });
      const result = await invoke<Anomaly[]>('get_active_anomalies');
      set({ activeAnomalies: result, loading: false });
    } catch (error) {
      set({ error: String(error), loading: false });
    }
  },

  addPriceData: async (tokenAddress: string, data: PriceData) => {
    try {
      await invoke('add_price_data', { tokenAddress, data });
      await get().fetchAnomalies(tokenAddress);
    } catch (error) {
      set({ error: String(error) });
    }
  },

  addTransactionData: async (tokenAddress: string, data: TransactionData) => {
    try {
      await invoke('add_transaction_data', { tokenAddress, data });
      await get().fetchAnomalies(tokenAddress);
    } catch (error) {
      set({ error: String(error) });
    }
  },

  dismissAnomaly: async (anomalyId: string) => {
    try {
      await invoke('dismiss_anomaly', { anomalyId });
      set((state) => ({
        anomalies: state.anomalies.map((anomaly) =>
          anomaly.id === anomalyId ? { ...anomaly, is_active: false } : anomaly
        ),
        activeAnomalies: state.activeAnomalies.filter((anomaly) => anomaly.id !== anomalyId),
      }));
    } catch (error) {
      set({ error: String(error) });
    }
  },

  updateConfig: async (config: AnomalyDetectionConfig) => {
    try {
      set({ loading: true, error: null });
      await invoke('update_anomaly_detection_config', { config });
      set({ config, loading: false });
    } catch (error) {
      set({ error: String(error), loading: false });
    }
  },

  fetchConfig: async () => {
    try {
      set({ loading: true, error: null });
      const result = await invoke<AnomalyDetectionConfig>('get_anomaly_detection_config');
      set({ config: result, loading: false });
    } catch (error) {
      set({ error: String(error), loading: false });
    }
  },

  fetchStatistics: async (tokenAddress: string) => {
    try {
      set({ loading: true, error: null });
      const result = await invoke<AnomalyStatistics | null>('get_anomaly_statistics', {
        tokenAddress,
      });
      if (result) {
        set((state) => ({
          statistics: {
            ...state.statistics,
            [tokenAddress]: result,
          },
          loading: false,
        }));
      } else {
        set({ loading: false });
      }
    } catch (error) {
      set({ error: String(error), loading: false });
    }
  },

  generateMockData: async (tokenAddress: string) => {
    try {
      set({ loading: true, error: null });
      await invoke('generate_mock_anomaly_data', { tokenAddress });
      await Promise.all([
        get().fetchAnomalies(tokenAddress),
        get().fetchActiveAnomalies(),
        get().fetchStatistics(tokenAddress),
      ]);
      set({ loading: false });
    } catch (error) {
      set({ error: String(error), loading: false });
    }
  },
}));

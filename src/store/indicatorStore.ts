import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/tauri';
import type {
  IndicatorConfig,
  IndicatorPreset,
  IndicatorAlert,
  IndicatorConfigType,
  IndicatorPanel,
} from '../types/indicators';
import { DEFAULT_INDICATOR_PARAMS } from '../types/indicators';

interface IndicatorState {
  indicators: IndicatorConfig[];
  presets: IndicatorPreset[];
  alerts: IndicatorAlert[];
  isLoading: boolean;
  error: string | null;

  // Indicator management
  addIndicator: (type: IndicatorConfigType, panel?: IndicatorPanel) => IndicatorConfig;
  removeIndicator: (id: string) => void;
  updateIndicator: (id: string, updates: Partial<IndicatorConfig>) => void;
  toggleIndicator: (id: string) => void;
  clearIndicators: () => void;
  duplicateIndicator: (id: string) => IndicatorConfig | null;

  // Preset management
  loadPresets: () => Promise<void>;
  savePreset: (name: string, description?: string) => Promise<IndicatorPreset>;
  loadPreset: (presetId: string) => void;
  deletePreset: (presetId: string) => Promise<void>;
  updatePreset: (presetId: string, updates: Partial<IndicatorPreset>) => Promise<void>;

  // Alert management
  loadAlerts: () => Promise<void>;
  addAlert: (
    indicatorId: string,
    condition: 'above' | 'below' | 'crosses_above' | 'crosses_below',
    threshold: number
  ) => Promise<IndicatorAlert>;
  removeAlert: (alertId: string) => Promise<void>;
  updateAlert: (alertId: string, updates: Partial<IndicatorAlert>) => Promise<void>;
  toggleAlert: (alertId: string) => void;

  // Persistence
  saveIndicators: () => Promise<void>;
  loadIndicators: () => Promise<void>;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export const useIndicatorStore = create<IndicatorState>((set, get) => ({
  indicators: [],
  presets: [],
  alerts: [],
  isLoading: false,
  error: null,

  addIndicator: (type: IndicatorConfigType, panel: IndicatorPanel = 'overlay') => {
    const indicator: IndicatorConfig = {
      id: generateId(),
      type,
      enabled: true,
      panel,
      params: { ...DEFAULT_INDICATOR_PARAMS[type] },
      color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      lineWidth: 2,
      style: 'solid',
      visible: true,
    };

    set(state => ({ indicators: [...state.indicators, indicator] }));
    get().saveIndicators();
    return indicator;
  },

  removeIndicator: (id: string) => {
    set(state => ({
      indicators: state.indicators.filter(ind => ind.id !== id),
      alerts: state.alerts.filter(alert => alert.indicatorId !== id),
    }));
    get().saveIndicators();
  },

  updateIndicator: (id: string, updates: Partial<IndicatorConfig>) => {
    set(state => ({
      indicators: state.indicators.map(ind => (ind.id === id ? { ...ind, ...updates } : ind)),
    }));
    get().saveIndicators();
  },

  toggleIndicator: (id: string) => {
    set(state => ({
      indicators: state.indicators.map(ind =>
        ind.id === id ? { ...ind, enabled: !ind.enabled } : ind
      ),
    }));
    get().saveIndicators();
  },

  clearIndicators: () => {
    set({ indicators: [], alerts: [] });
    get().saveIndicators();
  },

  duplicateIndicator: (id: string) => {
    const state = get();
    const original = state.indicators.find(ind => ind.id === id);
    if (!original) return null;

    const duplicate: IndicatorConfig = {
      ...original,
      id: generateId(),
    };

    set(state => ({ indicators: [...state.indicators, duplicate] }));
    get().saveIndicators();
    return duplicate;
  },

  loadPresets: async () => {
    set({ isLoading: true, error: null });
    try {
      const presets = await invoke<IndicatorPreset[]>('indicator_list_presets');
      set({ presets, isLoading: false });
    } catch (error) {
      console.error('Failed to load presets:', error);
      set({ error: String(error), isLoading: false });
    }
  },

  savePreset: async (name: string, description?: string) => {
    const state = get();
    set({ error: null });
    
    try {
      const preset: IndicatorPreset = {
        id: generateId(),
        name,
        description,
        indicators: state.indicators,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await invoke('indicator_save_preset', { preset });
      set(state => ({ presets: [...state.presets, preset] }));
      return preset;
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  loadPreset: (presetId: string) => {
    const state = get();
    const preset = state.presets.find(p => p.id === presetId);
    
    if (preset) {
      // Reset IDs to create new instances
      const indicators = preset.indicators.map(ind => ({
        ...ind,
        id: generateId(),
      }));
      
      set({ indicators });
      get().saveIndicators();
    }
  },

  deletePreset: async (presetId: string) => {
    set({ error: null });
    try {
      await invoke('indicator_delete_preset', { presetId });
      set(state => ({ presets: state.presets.filter(p => p.id !== presetId) }));
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  updatePreset: async (presetId: string, updates: Partial<IndicatorPreset>) => {
    set({ error: null });
    try {
      const updatedPreset = {
        ...get().presets.find(p => p.id === presetId),
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      
      await invoke('indicator_update_preset', { preset: updatedPreset });
      set(state => ({
        presets: state.presets.map(p => (p.id === presetId ? updatedPreset as IndicatorPreset : p)),
      }));
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  loadAlerts: async () => {
    set({ isLoading: true, error: null });
    try {
      const alerts = await invoke<IndicatorAlert[]>('indicator_list_alerts');
      set({ alerts, isLoading: false });
    } catch (error) {
      console.error('Failed to load alerts:', error);
      set({ error: String(error), isLoading: false });
    }
  },

  addAlert: async (indicatorId, condition, threshold) => {
    set({ error: null });
    try {
      const alert: IndicatorAlert = {
        id: generateId(),
        indicatorId,
        condition,
        threshold,
        enabled: true,
        notificationChannels: ['app'],
      };

      await invoke('indicator_create_alert', { alert });
      set(state => ({ alerts: [...state.alerts, alert] }));
      return alert;
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  removeAlert: async (alertId: string) => {
    set({ error: null });
    try {
      await invoke('indicator_delete_alert', { alertId });
      set(state => ({ alerts: state.alerts.filter(a => a.id !== alertId) }));
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  updateAlert: async (alertId: string, updates: Partial<IndicatorAlert>) => {
    set({ error: null });
    try {
      await invoke('indicator_update_alert', { alertId, updates });
      set(state => ({
        alerts: state.alerts.map(a => (a.id === alertId ? { ...a, ...updates } : a)),
      }));
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  toggleAlert: (alertId: string) => {
    const state = get();
    const alert = state.alerts.find(a => a.id === alertId);
    if (alert) {
      get().updateAlert(alertId, { enabled: !alert.enabled });
    }
  },

  saveIndicators: async () => {
    const state = get();
    try {
      await invoke('indicator_save_state', { indicators: state.indicators });
    } catch (error) {
      console.error('Failed to save indicators:', error);
    }
  },

  loadIndicators: async () => {
    set({ isLoading: true, error: null });
    try {
      const indicators = await invoke<IndicatorConfig[]>('indicator_load_state');
      set({ indicators, isLoading: false });
    } catch (error) {
      console.error('Failed to load indicators:', error);
      set({ error: String(error), isLoading: false });
    }
  },
}));

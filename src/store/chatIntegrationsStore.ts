import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/tauri';
import type {
  ChatIntegrationSettings,
  TelegramConfig,
  SlackConfig,
  DiscordConfig,
  DeliveryLog,
  TestMessageResult,
  RateLimitStatus,
} from '../types/chatIntegrations';

interface ChatIntegrationsState {
  settings: ChatIntegrationSettings;
  deliveryLogs: DeliveryLog[];
  rateLimits: RateLimitStatus[];
  isLoading: boolean;
  error: string | null;

  loadSettings: () => Promise<void>;
  saveSettings: (settings: ChatIntegrationSettings) => Promise<void>;

  addTelegramConfig: (config: Omit<TelegramConfig, 'id'>) => Promise<TelegramConfig>;
  updateTelegramConfig: (id: string, config: Partial<TelegramConfig>) => Promise<void>;
  deleteTelegramConfig: (id: string) => Promise<void>;

  addSlackConfig: (config: Omit<SlackConfig, 'id'>) => Promise<SlackConfig>;
  updateSlackConfig: (id: string, config: Partial<SlackConfig>) => Promise<void>;
  deleteSlackConfig: (id: string) => Promise<void>;

  addDiscordConfig: (config: Omit<DiscordConfig, 'id'>) => Promise<DiscordConfig>;
  updateDiscordConfig: (id: string, config: Partial<DiscordConfig>) => Promise<void>;
  deleteDiscordConfig: (id: string) => Promise<void>;

  testTelegramConfig: (id: string, message?: string) => Promise<TestMessageResult>;
  testSlackConfig: (id: string, message?: string) => Promise<TestMessageResult>;
  testDiscordConfig: (id: string, message?: string) => Promise<TestMessageResult>;

  fetchDeliveryLogs: (limit?: number, serviceType?: string) => Promise<void>;
  clearDeliveryLogs: () => Promise<void>;

  fetchRateLimits: () => Promise<void>;
}

export const useChatIntegrationsStore = create<ChatIntegrationsState>((set, get) => ({
  settings: {
    telegram: [],
    slack: [],
    discord: [],
  },
  deliveryLogs: [],
  rateLimits: [],
  isLoading: false,
  error: null,

  loadSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const settings = await invoke<ChatIntegrationSettings>('chat_integration_get_settings');
      set({ settings, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  saveSettings: async settings => {
    set({ isLoading: true, error: null });
    try {
      await invoke('chat_integration_save_settings', { settings });
      set({ settings, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  addTelegramConfig: async config => {
    set({ error: null });
    try {
      const newConfig = await invoke<TelegramConfig>('chat_integration_add_telegram', { config });
      set(state => ({
        settings: {
          ...state.settings,
          telegram: [...state.settings.telegram, newConfig],
        },
      }));
      return newConfig;
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  updateTelegramConfig: async (id, config) => {
    set({ error: null });
    try {
      await invoke('chat_integration_update_telegram', { id, config });
      set(state => ({
        settings: {
          ...state.settings,
          telegram: state.settings.telegram.map(c => (c.id === id ? { ...c, ...config } : c)),
        },
      }));
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  deleteTelegramConfig: async id => {
    set({ error: null });
    try {
      await invoke('chat_integration_delete_telegram', { id });
      set(state => ({
        settings: {
          ...state.settings,
          telegram: state.settings.telegram.filter(c => c.id !== id),
        },
      }));
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  addSlackConfig: async config => {
    set({ error: null });
    try {
      const newConfig = await invoke<SlackConfig>('chat_integration_add_slack', { config });
      set(state => ({
        settings: {
          ...state.settings,
          slack: [...state.settings.slack, newConfig],
        },
      }));
      return newConfig;
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  updateSlackConfig: async (id, config) => {
    set({ error: null });
    try {
      await invoke('chat_integration_update_slack', { id, config });
      set(state => ({
        settings: {
          ...state.settings,
          slack: state.settings.slack.map(c => (c.id === id ? { ...c, ...config } : c)),
        },
      }));
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  deleteSlackConfig: async id => {
    set({ error: null });
    try {
      await invoke('chat_integration_delete_slack', { id });
      set(state => ({
        settings: {
          ...state.settings,
          slack: state.settings.slack.filter(c => c.id !== id),
        },
      }));
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  addDiscordConfig: async config => {
    set({ error: null });
    try {
      const newConfig = await invoke<DiscordConfig>('chat_integration_add_discord', { config });
      set(state => ({
        settings: {
          ...state.settings,
          discord: [...state.settings.discord, newConfig],
        },
      }));
      return newConfig;
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  updateDiscordConfig: async (id, config) => {
    set({ error: null });
    try {
      await invoke('chat_integration_update_discord', { id, config });
      set(state => ({
        settings: {
          ...state.settings,
          discord: state.settings.discord.map(c => (c.id === id ? { ...c, ...config } : c)),
        },
      }));
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  deleteDiscordConfig: async id => {
    set({ error: null });
    try {
      await invoke('chat_integration_delete_discord', { id });
      set(state => ({
        settings: {
          ...state.settings,
          discord: state.settings.discord.filter(c => c.id !== id),
        },
      }));
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  testTelegramConfig: async (id, message = 'Test message from Crypto Trading Dashboard') => {
    set({ error: null });
    try {
      const result = await invoke<TestMessageResult>('chat_integration_test_telegram', {
        id,
        message,
      });
      return result;
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  testSlackConfig: async (id, message = 'Test message from Crypto Trading Dashboard') => {
    set({ error: null });
    try {
      const result = await invoke<TestMessageResult>('chat_integration_test_slack', {
        id,
        message,
      });
      return result;
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  testDiscordConfig: async (id, message = 'Test message from Crypto Trading Dashboard') => {
    set({ error: null });
    try {
      const result = await invoke<TestMessageResult>('chat_integration_test_discord', {
        id,
        message,
      });
      return result;
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  fetchDeliveryLogs: async (limit = 100, serviceType) => {
    set({ isLoading: true, error: null });
    try {
      const logs = await invoke<DeliveryLog[]>('chat_integration_get_delivery_logs', {
        limit,
        serviceType,
      });
      set({ deliveryLogs: logs, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  clearDeliveryLogs: async () => {
    set({ error: null });
    try {
      await invoke('chat_integration_clear_delivery_logs');
      set({ deliveryLogs: [] });
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  fetchRateLimits: async () => {
    set({ error: null });
    try {
      const limits = await invoke<RateLimitStatus[]>('chat_integration_get_rate_limits');
      set({ rateLimits: limits });
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },
}));

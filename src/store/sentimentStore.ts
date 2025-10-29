import { create } from 'zustand';
import { invoke } from '@tauri-apps/api';
import {
  TokenSentiment,
  SentimentAlert,
  SentimentAlertConfig,
  SocialPost,
} from '../types/sentiment';

interface SentimentState {
  sentiments: Record<string, TokenSentiment>;
  alerts: SentimentAlert[];
  config: SentimentAlertConfig | null;
  loading: boolean;
  error: string | null;

  fetchTokenSentiment: (tokenAddress: string) => Promise<void>;
  fetchAllSentiments: () => Promise<void>;
  ingestSocialData: (tokenAddress: string, posts: SocialPost[]) => Promise<void>;
  fetchAlerts: (tokenAddress?: string) => Promise<void>;
  dismissAlert: (alertId: string) => Promise<void>;
  updateConfig: (config: SentimentAlertConfig) => Promise<void>;
  fetchConfig: () => Promise<void>;
  fetchSocialMentions: (tokenAddress: string) => Promise<void>;
}

export const useSentimentStore = create<SentimentState>((set, get) => ({
  sentiments: {},
  alerts: [],
  config: null,
  loading: false,
  error: null,

  fetchTokenSentiment: async (tokenAddress: string) => {
    try {
      set({ loading: true, error: null });
      const result = await invoke<TokenSentiment | null>('get_token_sentiment', {
        tokenAddress,
      });
      if (result) {
        set((state) => ({
          sentiments: { ...state.sentiments, [tokenAddress]: result },
          loading: false,
        }));
      } else {
        set({ loading: false });
      }
    } catch (error) {
      set({ error: String(error), loading: false });
    }
  },

  fetchAllSentiments: async () => {
    try {
      set({ loading: true, error: null });
      const result = await invoke<TokenSentiment[]>('get_all_token_sentiments');
      const sentimentsMap: Record<string, TokenSentiment> = {};
      result.forEach((sentiment) => {
        sentimentsMap[sentiment.token_address] = sentiment;
      });
      set({ sentiments: sentimentsMap, loading: false });
    } catch (error) {
      set({ error: String(error), loading: false });
    }
  },

  ingestSocialData: async (tokenAddress: string, posts: SocialPost[]) => {
    try {
      set({ loading: true, error: null });
      await invoke('ingest_social_data', { tokenAddress, posts });
      await get().fetchTokenSentiment(tokenAddress);
    } catch (error) {
      set({ error: String(error), loading: false });
    }
  },

  fetchAlerts: async (tokenAddress?: string) => {
    try {
      set({ loading: true, error: null });
      const result = await invoke<SentimentAlert[]>('get_sentiment_alerts', {
        tokenAddress: tokenAddress || null,
      });
      set({ alerts: result, loading: false });
    } catch (error) {
      set({ error: String(error), loading: false });
    }
  },

  dismissAlert: async (alertId: string) => {
    try {
      await invoke('dismiss_sentiment_alert', { alertId });
      set((state) => ({
        alerts: state.alerts.map((alert) =>
          alert.id === alertId ? { ...alert, is_active: false } : alert
        ),
      }));
    } catch (error) {
      set({ error: String(error) });
    }
  },

  updateConfig: async (config: SentimentAlertConfig) => {
    try {
      set({ loading: true, error: null });
      await invoke('update_sentiment_alert_config', { config });
      set({ config, loading: false });
    } catch (error) {
      set({ error: String(error), loading: false });
    }
  },

  fetchConfig: async () => {
    try {
      set({ loading: true, error: null });
      const result = await invoke<SentimentAlertConfig>('get_sentiment_alert_config');
      set({ config: result, loading: false });
    } catch (error) {
      set({ error: String(error), loading: false });
    }
  },

  fetchSocialMentions: async (tokenAddress: string) => {
    try {
      set({ loading: true, error: null });
      const posts = await invoke<SocialPost[]>('fetch_social_mentions', {
        tokenAddress,
      });
      await get().ingestSocialData(tokenAddress, posts);
    } catch (error) {
      set({ error: String(error), loading: false });
    }
  },
}));

import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/tauri';

export interface TwitterConfig {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessSecret: string;
  bearerToken: string;
  enabled: boolean;
  autoTweetEnabled: boolean;
  sentimentTrackingEnabled: boolean;
}

export interface TwitterSentimentKeyword {
  id: string;
  keyword: string;
  category: string;
  enabled: boolean;
  createdAt: string;
}

export interface TwitterInfluencer {
  id: string;
  username: string;
  displayName: string;
  followerCount: number | null;
  enabled: boolean;
  createdAt: string;
}

export interface TwitterSentimentData {
  id: string;
  keyword: string;
  sentimentScore: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  totalMentions: number;
  trending: boolean;
  fetchedAt: string;
}

export interface TweetRecord {
  id: string;
  tweetId: string | null;
  content: string;
  tweetType: string;
  status: 'pending' | 'posted' | 'failed';
  error: string | null;
  postedAt: string;
}

export interface TwitterStats {
  totalTweetsPosted: number;
  totalSentimentChecks: number;
  trackedKeywords: number;
  trackedInfluencers: number;
  averageSentimentScore: number;
  last24hTweets: number;
  lastSentimentCheck: string | null;
}

interface TwitterStore {
  config: TwitterConfig | null;
  keywords: TwitterSentimentKeyword[];
  influencers: TwitterInfluencer[];
  sentimentHistory: Record<string, TwitterSentimentData[]>;
  stats: TwitterStats | null;
  tweetHistory: TweetRecord[];
  isLoading: boolean;
  error: string | null;
  testConnectionResult: { success: boolean; message?: string; error?: string } | null;

  saveConfig: (config: TwitterConfig) => Promise<void>;
  getConfig: () => Promise<void>;
  deleteConfig: () => Promise<void>;
  testConnection: (config: TwitterConfig) => Promise<void>;
  addKeyword: (keyword: string, category: string) => Promise<void>;
  removeKeyword: (id: string) => Promise<void>;
  loadKeywords: () => Promise<void>;
  addInfluencer: (username: string, displayName: string) => Promise<void>;
  removeInfluencer: (id: string) => Promise<void>;
  loadInfluencers: () => Promise<void>;
  fetchSentiment: (keyword: string) => Promise<void>;
  loadSentimentHistory: (keyword: string, limit?: number) => Promise<void>;
  loadStats: () => Promise<void>;
  loadTweetHistory: (limit?: number) => Promise<void>;
}

export const useTwitterStore = create<TwitterStore>((set, get) => ({
  config: null,
  keywords: [],
  influencers: [],
  sentimentHistory: {},
  stats: null,
  tweetHistory: [],
  isLoading: false,
  error: null,
  testConnectionResult: null,

  saveConfig: async (config) => {
    set({ isLoading: true, error: null });
    try {
      await invoke('twitter_save_config', { config });
      set({ config, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  getConfig: async () => {
    set({ isLoading: true, error: null });
    try {
      const config = await invoke<TwitterConfig>('twitter_get_config');
      set({ config, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false, config: null });
    }
  },

  deleteConfig: async () => {
    set({ isLoading: true, error: null });
    try {
      await invoke('twitter_delete_config');
      set({ config: null, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  testConnection: async (config) => {
    set({ isLoading: true, error: null, testConnectionResult: null });
    try {
      const message = await invoke<string>('twitter_test_connection', { config });
      set({
        testConnectionResult: { success: true, message },
        isLoading: false,
      });
    } catch (error) {
      set({
        testConnectionResult: { success: false, error: String(error) },
        error: String(error),
        isLoading: false,
      });
    }
  },

  addKeyword: async (keyword, category) => {
    set({ isLoading: true, error: null });
    try {
      const added = await invoke<TwitterSentimentKeyword>('twitter_add_keyword', {
        keyword,
        category,
      });
      set(state => ({
        keywords: [added, ...state.keywords],
        isLoading: false,
      }));
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  removeKeyword: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await invoke('twitter_remove_keyword', { id });
      set(state => ({
        keywords: state.keywords.filter(keyword => keyword.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  loadKeywords: async () => {
    set({ isLoading: true, error: null });
    try {
      const keywords = await invoke<TwitterSentimentKeyword[]>('twitter_list_keywords');
      set({ keywords, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  addInfluencer: async (username, displayName) => {
    set({ isLoading: true, error: null });
    try {
      const influencer = await invoke<TwitterInfluencer>('twitter_add_influencer', {
        username,
        displayName,
      });
      set(state => ({
        influencers: [influencer, ...state.influencers],
        isLoading: false,
      }));
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  removeInfluencer: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await invoke('twitter_remove_influencer', { id });
      set(state => ({
        influencers: state.influencers.filter(influencer => influencer.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  loadInfluencers: async () => {
    set({ isLoading: true, error: null });
    try {
      const influencers = await invoke<TwitterInfluencer[]>('twitter_list_influencers');
      set({ influencers, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  fetchSentiment: async (keyword) => {
    set({ isLoading: true, error: null });
    try {
      const data = await invoke<TwitterSentimentData>('twitter_fetch_sentiment', { keyword });
      set(state => ({
        sentimentHistory: {
          ...state.sentimentHistory,
          [keyword]: [data, ...(state.sentimentHistory[keyword] || [])],
        },
        isLoading: false,
      }));
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  loadSentimentHistory: async (keyword, limit = 50) => {
    set({ isLoading: true, error: null });
    try {
      const history = await invoke<TwitterSentimentData[]>('twitter_get_sentiment_history', {
        keyword,
        limit,
      });
      set(state => ({
        sentimentHistory: {
          ...state.sentimentHistory,
          [keyword]: history,
        },
        isLoading: false,
      }));
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  loadStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const stats = await invoke<TwitterStats>('twitter_get_stats');
      set({ stats, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  loadTweetHistory: async (limit = 50) => {
    set({ isLoading: true, error: null });
    try {
      const history = await invoke<TweetRecord[]>('twitter_get_tweet_history', { limit });
      set({ tweetHistory: history, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },
}));

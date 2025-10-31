import { create } from 'zustand';
import { invoke } from '@tauri-apps/api';
import {
  SocialDashboardSnapshot,
  Influencer,
  WhaleWallet,
  BehaviorPattern,
  SocialConfig,
} from '../types/social';

interface SocialState {
  snapshot: SocialDashboardSnapshot | null;
  loading: boolean;
  error: string | null;
  refreshing: boolean;

  fetchDashboard: () => Promise<void>;
  refreshData: () => Promise<void>;
  
  // Influencer management
  addInfluencer: (influencer: Influencer) => Promise<void>;
  removeInfluencer: (id: string) => Promise<void>;
  updateInfluencer: (influencer: Influencer) => Promise<void>;
  getInfluencers: () => Promise<Influencer[]>;
  
  // Whale management
  followWhale: (address: string) => Promise<void>;
  unfollowWhale: (address: string) => Promise<void>;
  getFollowedWhales: () => Promise<WhaleWallet[]>;
  getAllWhales: () => Promise<WhaleWallet[]>;
  analyzeWhaleBehavior: (address: string) => Promise<BehaviorPattern>;
  
  // Configuration
  getConfig: () => Promise<SocialConfig>;
  updateConfig: (config: SocialConfig) => Promise<void>;
}

export const useSocialStore = create<SocialState>((set, get) => ({
  snapshot: null,
  loading: false,
  error: null,
  refreshing: false,

  fetchDashboard: async () => {
    try {
      set({ loading: true, error: null });
      const snapshot = await invoke<SocialDashboardSnapshot>('social_get_dashboard_snapshot');
      set({ snapshot, loading: false });
    } catch (error) {
      set({ error: String(error), loading: false });
    }
  },

  refreshData: async () => {
    try {
      set({ refreshing: true, error: null });
      await invoke('social_refresh_data');
      await get().fetchDashboard();
      set({ refreshing: false });
    } catch (error) {
      set({ error: String(error), refreshing: false });
    }
  },

  addInfluencer: async (influencer: Influencer) => {
    try {
      set({ error: null });
      await invoke('social_add_influencer', { influencer });
      await get().fetchDashboard();
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  removeInfluencer: async (id: string) => {
    try {
      set({ error: null });
      await invoke('social_remove_influencer', { id });
      await get().fetchDashboard();
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  updateInfluencer: async (influencer: Influencer) => {
    try {
      set({ error: null });
      await invoke('social_update_influencer', { influencer });
      await get().fetchDashboard();
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  getInfluencers: async () => {
    try {
      return await invoke<Influencer[]>('social_get_influencers');
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  followWhale: async (address: string) => {
    try {
      set({ error: null });
      await invoke('social_follow_whale', { address });
      await get().fetchDashboard();
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  unfollowWhale: async (address: string) => {
    try {
      set({ error: null });
      await invoke('social_unfollow_whale', { address });
      await get().fetchDashboard();
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  getFollowedWhales: async () => {
    try {
      return await invoke<WhaleWallet[]>('social_get_followed_whales');
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  getAllWhales: async () => {
    try {
      return await invoke<WhaleWallet[]>('social_get_all_whales');
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  analyzeWhaleBehavior: async (address: string) => {
    try {
      return await invoke<BehaviorPattern>('social_analyze_whale_behavior', { address });
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  getConfig: async () => {
    try {
      return await invoke<SocialConfig>('social_get_config');
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  updateConfig: async (config: SocialConfig) => {
    try {
      set({ error: null });
      await invoke('social_update_config', { config });
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },
}));

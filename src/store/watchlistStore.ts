import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/tauri';

export interface WatchlistItem {
  symbol: string;
  mint: string;
  position: number;
  addedAt: string;
}

export interface Watchlist {
  id: string;
  name: string;
  items: WatchlistItem[];
  createdAt: string;
  updatedAt: string;
}

interface WatchlistState {
  watchlists: Watchlist[];
  selectedWatchlistId: string | null;
  isLoading: boolean;
  error: string | null;

  fetchWatchlists: () => Promise<void>;
  createWatchlist: (name: string) => Promise<Watchlist>;
  updateWatchlist: (id: string, name: string) => Promise<Watchlist>;
  deleteWatchlist: (id: string) => Promise<void>;
  addItem: (watchlistId: string, symbol: string, mint: string) => Promise<Watchlist>;
  removeItem: (watchlistId: string, mint: string) => Promise<Watchlist>;
  reorderItems: (
    watchlistId: string,
    items: Array<{ symbol: string; mint: string; position: number }>
  ) => Promise<Watchlist>;
  exportWatchlist: (id: string) => Promise<string>;
  importWatchlist: (data: string) => Promise<Watchlist>;
  setSelectedWatchlist: (id: string | null) => void;
}

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
  watchlists: [],
  selectedWatchlistId: null,
  isLoading: false,
  error: null,

  fetchWatchlists: async () => {
    set({ isLoading: true, error: null });
    try {
      const watchlists = await invoke<Watchlist[]>('watchlist_list');
      set({ watchlists, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  createWatchlist: async (name: string) => {
    set({ error: null });
    try {
      const watchlist = await invoke<Watchlist>('watchlist_create', { name });
      set(state => ({ watchlists: [watchlist, ...state.watchlists] }));
      return watchlist;
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  updateWatchlist: async (id: string, name: string) => {
    set({ error: null });
    try {
      const watchlist = await invoke<Watchlist>('watchlist_update', { id, name });
      set(state => ({
        watchlists: state.watchlists.map(w => (w.id === id ? watchlist : w)),
      }));
      return watchlist;
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  deleteWatchlist: async (id: string) => {
    set({ error: null });
    try {
      await invoke('watchlist_delete', { id });
      set(state => ({
        watchlists: state.watchlists.filter(w => w.id !== id),
        selectedWatchlistId: state.selectedWatchlistId === id ? null : state.selectedWatchlistId,
      }));
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  addItem: async (watchlistId: string, symbol: string, mint: string) => {
    set({ error: null });
    try {
      const watchlist = await invoke<Watchlist>('watchlist_add_item', {
        watchlistId,
        symbol,
        mint,
      });
      set(state => ({
        watchlists: state.watchlists.map(w => (w.id === watchlistId ? watchlist : w)),
      }));
      return watchlist;
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  removeItem: async (watchlistId: string, mint: string) => {
    set({ error: null });
    try {
      const watchlist = await invoke<Watchlist>('watchlist_remove_item', {
        watchlistId,
        mint,
      });
      set(state => ({
        watchlists: state.watchlists.map(w => (w.id === watchlistId ? watchlist : w)),
      }));
      return watchlist;
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  reorderItems: async (
    watchlistId: string,
    items: Array<{ symbol: string; mint: string; position: number }>
  ) => {
    set({ error: null });
    try {
      const watchlist = await invoke<Watchlist>('watchlist_reorder_items', {
        watchlistId,
        items,
      });
      set(state => ({
        watchlists: state.watchlists.map(w => (w.id === watchlistId ? watchlist : w)),
      }));
      return watchlist;
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  exportWatchlist: async (id: string) => {
    set({ error: null });
    try {
      const data = await invoke<string>('watchlist_export', { id });
      return data;
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  importWatchlist: async (data: string) => {
    set({ error: null });
    try {
      const watchlist = await invoke<Watchlist>('watchlist_import', { data });
      set(state => ({ watchlists: [watchlist, ...state.watchlists] }));
      return watchlist;
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  setSelectedWatchlist: (id: string | null) => {
    set({ selectedWatchlistId: id });
  },
}));

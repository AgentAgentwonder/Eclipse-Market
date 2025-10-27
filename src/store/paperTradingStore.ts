import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/tauri';

export interface PaperBalance {
  currency: string;
  amount: number;
}

export interface PaperTrade {
  id: string;
  trade_type: string;
  input_symbol: string;
  output_symbol: string;
  input_amount: number;
  output_amount: number;
  price: number;
  fee: number;
  slippage: number;
  realized_pnl: number;
  timestamp: string;
  order_id?: string;
}

export interface PaperPosition {
  symbol: string;
  amount: number;
  average_entry_price: number;
  current_price: number;
  unrealized_pnl: number;
  realized_pnl: number;
}

export interface PaperAccount {
  enabled: boolean;
  balances: Record<string, number>;
  initial_balance: number;
  current_value: number;
  total_pnl: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  created_at: string;
  reset_count: number;
}

export interface PaperTradingConfig {
  slippage_percent: number;
  fee_percent: number;
  max_slippage_percent: number;
  simulate_failures: boolean;
  failure_rate: number;
}

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  total_pnl: number;
  total_pnl_percent: number;
  total_trades: number;
  win_rate: number;
  rank: number;
  updated_at: string;
}

interface PaperTradingState {
  enabled: boolean;
  account: PaperAccount | null;
  balances: PaperBalance[];
  positions: PaperPosition[];
  tradeHistory: PaperTrade[];
  leaderboard: LeaderboardEntry[];
  config: PaperTradingConfig;
  loading: boolean;
  error: string | null;

  // Actions
  checkStatus: () => Promise<void>;
  setEnabled: (enabled: boolean) => Promise<void>;
  loadAccount: () => Promise<void>;
  loadBalances: () => Promise<void>;
  loadPositions: () => Promise<void>;
  loadTradeHistory: (limit?: number) => Promise<void>;
  loadLeaderboard: (limit?: number) => Promise<void>;
  executeTrade: (
    tradeType: string,
    inputSymbol: string,
    outputSymbol: string,
    inputAmount: number,
    expectedOutputAmount: number,
    orderId?: string
  ) => Promise<PaperTrade>;
  resetAccount: (initialBalance: number) => Promise<void>;
  updateConfig: (config: PaperTradingConfig) => Promise<void>;
  loadConfig: () => Promise<void>;
  submitToLeaderboard: (userId: string, username: string) => Promise<void>;
  updatePrice: (symbol: string, price: number) => Promise<void>;
  clearError: () => void;
}

export const usePaperTradingStore = create<PaperTradingState>()(
  persist(
    (set, get) => ({
      enabled: false,
      account: null,
      balances: [],
      positions: [],
      tradeHistory: [],
      leaderboard: [],
      config: {
        slippage_percent: 0.1,
        fee_percent: 0.05,
        max_slippage_percent: 1.0,
        simulate_failures: false,
        failure_rate: 0.01,
      },
      loading: false,
      error: null,

      checkStatus: async () => {
        try {
          const enabled = await invoke<boolean>('paper_get_status');
          set({ enabled });
        } catch (err) {
          console.error('Failed to check paper trading status:', err);
          set({ error: String(err) });
        }
      },

      setEnabled: async (enabled: boolean) => {
        set({ loading: true, error: null });
        try {
          await invoke('paper_set_enabled', { enabled });
          set({ enabled });
          if (enabled) {
            await get().loadAccount();
            await get().loadBalances();
            await get().loadPositions();
          }
        } catch (err) {
          console.error('Failed to set paper trading status:', err);
          set({ error: String(err) });
          throw err;
        } finally {
          set({ loading: false });
        }
      },

      loadAccount: async () => {
        try {
          const account = await invoke<PaperAccount>('paper_get_account');
          set({ account });
        } catch (err) {
          console.error('Failed to load paper account:', err);
          set({ error: String(err) });
        }
      },

      loadBalances: async () => {
        try {
          const balances = await invoke<PaperBalance[]>('paper_get_balances');
          set({ balances });
        } catch (err) {
          console.error('Failed to load balances:', err);
          set({ error: String(err) });
        }
      },

      loadPositions: async () => {
        try {
          const positions = await invoke<PaperPosition[]>('paper_get_positions');
          set({ positions });
        } catch (err) {
          console.error('Failed to load positions:', err);
          set({ error: String(err) });
        }
      },

      loadTradeHistory: async (limit?: number) => {
        try {
          const tradeHistory = await invoke<PaperTrade[]>('paper_get_trade_history', {
            limit,
          });
          set({ tradeHistory });
        } catch (err) {
          console.error('Failed to load trade history:', err);
          set({ error: String(err) });
        }
      },

      loadLeaderboard: async (limit?: number) => {
        try {
          const leaderboard = await invoke<LeaderboardEntry[]>('paper_get_leaderboard', {
            limit,
          });
          set({ leaderboard });
        } catch (err) {
          console.error('Failed to load leaderboard:', err);
          set({ error: String(err) });
        }
      },

      executeTrade: async (
        tradeType: string,
        inputSymbol: string,
        outputSymbol: string,
        inputAmount: number,
        expectedOutputAmount: number,
        orderId?: string
      ) => {
        set({ loading: true, error: null });
        try {
          const trade = await invoke<PaperTrade>('paper_execute_trade', {
            tradeType,
            inputSymbol,
            outputSymbol,
            inputAmount,
            expectedOutputAmount,
            orderId,
          });

          // Refresh data
          await get().loadAccount();
          await get().loadBalances();
          await get().loadPositions();
          await get().loadTradeHistory(100);

          return trade;
        } catch (err) {
          console.error('Failed to execute paper trade:', err);
          set({ error: String(err) });
          throw err;
        } finally {
          set({ loading: false });
        }
      },

      resetAccount: async (initialBalance: number) => {
        set({ loading: true, error: null });
        try {
          await invoke('paper_reset_account', { initialBalance });
          await get().loadAccount();
          await get().loadBalances();
          await get().loadPositions();
          set({ tradeHistory: [] });
        } catch (err) {
          console.error('Failed to reset account:', err);
          set({ error: String(err) });
          throw err;
        } finally {
          set({ loading: false });
        }
      },

      updateConfig: async (config: PaperTradingConfig) => {
        set({ loading: true, error: null });
        try {
          await invoke('paper_update_config', { config });
          set({ config });
        } catch (err) {
          console.error('Failed to update config:', err);
          set({ error: String(err) });
          throw err;
        } finally {
          set({ loading: false });
        }
      },

      loadConfig: async () => {
        try {
          const config = await invoke<PaperTradingConfig>('paper_get_config');
          set({ config });
        } catch (err) {
          console.error('Failed to load config:', err);
          set({ error: String(err) });
        }
      },

      submitToLeaderboard: async (userId: string, username: string) => {
        set({ loading: true, error: null });
        try {
          await invoke('paper_submit_to_leaderboard', { userId, username });
          await get().loadLeaderboard();
        } catch (err) {
          console.error('Failed to submit to leaderboard:', err);
          set({ error: String(err) });
          throw err;
        } finally {
          set({ loading: false });
        }
      },

      updatePrice: async (symbol: string, price: number) => {
        try {
          await invoke('paper_update_price', { symbol, price });
        } catch (err) {
          console.error('Failed to update price:', err);
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'paper-trading-storage',
      partialize: (state) => ({
        config: state.config,
      }),
    }
  )
);

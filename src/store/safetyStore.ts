import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/tauri';

export interface SafetyPolicy {
  enabled: boolean;
  cooldown_enabled: boolean;
  cooldown_seconds: number;
  max_trade_amount_usd: number | null;
  max_daily_trades: number | null;
  require_simulation: boolean;
  block_high_risk: boolean;
  high_risk_threshold: number;
  require_insurance_above_usd: number | null;
  max_price_impact_percent: number;
  max_slippage_percent: number;
}

export interface CooldownStatus {
  wallet_address: string;
  cooldown_seconds: number;
  remaining_seconds: number;
  last_trade_timestamp: number;
}

interface SafetyState {
  policy: SafetyPolicy | null;
  loading: boolean;
  error: string | null;
  
  fetchPolicy: () => Promise<void>;
  updatePolicy: (policy: SafetyPolicy) => Promise<void>;
  getCooldownStatus: (walletAddress: string) => Promise<CooldownStatus | null>;
  resetError: () => void;
}

const DEFAULT_POLICY: SafetyPolicy = {
  enabled: true,
  cooldown_enabled: true,
  cooldown_seconds: 30,
  max_trade_amount_usd: 10000.0,
  max_daily_trades: 100,
  require_simulation: true,
  block_high_risk: true,
  high_risk_threshold: 40.0,
  require_insurance_above_usd: 50000.0,
  max_price_impact_percent: 10.0,
  max_slippage_percent: 5.0,
};

export const useSafetyStore = create<SafetyState>()(
  persist(
    (set, get) => ({
      policy: DEFAULT_POLICY,
      loading: false,
      error: null,

      fetchPolicy: async () => {
        set({ loading: true, error: null });
        try {
          const policy = await invoke<SafetyPolicy>('get_safety_policy');
          set({ policy, loading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch safety policy',
            loading: false,
          });
        }
      },

      updatePolicy: async (policy: SafetyPolicy) => {
        set({ loading: true, error: null });
        try {
          await invoke('update_safety_policy', { policy });
          set({ policy, loading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update safety policy',
            loading: false,
          });
          throw error;
        }
      },

      getCooldownStatus: async (walletAddress: string) => {
        try {
          const status = await invoke<CooldownStatus | null>('get_cooldown_status', {
            walletAddress,
          });
          return status;
        } catch (error) {
          console.error('Failed to get cooldown status:', error);
          return null;
        }
      },

      resetError: () => set({ error: null }),
    }),
    {
      name: 'safety-storage',
      partialize: state => ({ policy: state.policy }),
    }
  )
);

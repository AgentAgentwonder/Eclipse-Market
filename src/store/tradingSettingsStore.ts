import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { EnhancedTradeMetrics, TradeFilters } from '../types/tradeReporting';

export type PriorityFeePreset = 'slow' | 'normal' | 'fast' | 'custom';

export interface PriorityFeeOption {
  preset: PriorityFeePreset;
  microLamports: number;
  estimatedConfirmationTime: string;
}

export interface SlippageConfig {
  tolerance: number; // in bps (e.g., 50 = 0.5%)
  autoAdjust: boolean; // enable volatility-based adjustments
  maxTolerance: number; // maximum allowed slippage in bps
  rejectAboveThreshold: boolean; // auto-reject trades exceeding threshold
}

export interface MEVProtectionConfig {
  enabled: boolean;
  useJito: boolean; // use Jito bundle submission
  usePrivateRPC: boolean; // use private RPC endpoints
  protectedTrades: number; // count of protected trades
  estimatedSavings: number; // in SOL
}

export interface GasOptimizationConfig {
  priorityFeePreset: PriorityFeePreset;
  customPriorityFee?: number; // in micro lamports
  historicalData: {
    averageFee: number;
    medianFee: number;
    congestionLevel: 'low' | 'medium' | 'high';
  };
}

export type TradeMetrics = EnhancedTradeMetrics;

export interface TradePagination {
  page: number;
  pageSize: number;
  sortBy: keyof TradeMetrics;
  sortOrder: 'asc' | 'desc';
}

const DEFAULT_TRADE_FILTERS: TradeFilters = {
  side: 'all',
  status: 'all',
  isPaperTrade: 'all',
  tokens: [],
  searchQuery: '',
  pnlRange: { min: null, max: null },
  dateRange: { start: null, end: null },
};

const DEFAULT_PAGINATION: TradePagination = {
  page: 1,
  pageSize: 10,
  sortBy: 'timestamp',
  sortOrder: 'desc',
};

const DEFAULT_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

interface TradingSettingsState {
  slippage: SlippageConfig;
  mevProtection: MEVProtectionConfig;
  gasOptimization: GasOptimizationConfig;
  tradeHistory: TradeMetrics[];
  tradeFilters: TradeFilters;
  tradePagination: TradePagination;
  timezone: string;

  // Actions
  setSlippageTolerance: (tolerance: number) => void;
  setSlippageAutoAdjust: (enabled: boolean) => void;
  setSlippageMaxTolerance: (maxTolerance: number) => void;
  setSlippageRejectAbove: (enabled: boolean) => void;

  toggleMEVProtection: (enabled: boolean) => void;
  setJitoEnabled: (enabled: boolean) => void;
  setPrivateRPCEnabled: (enabled: boolean) => void;

  setPriorityFeePreset: (preset: PriorityFeePreset) => void;
  setCustomPriorityFee: (fee: number) => void;
  updateCongestionData: (
    level: 'low' | 'medium' | 'high',
    avgFee: number,
    medianFee: number
  ) => void;

  addTradeToHistory: (trade: TradeMetrics) => void;
  updateTradeInHistory: (tradeId: string, updates: Partial<TradeMetrics>) => void;
  removeTradeFromHistory: (tradeId: string) => void;
  clearTradeHistory: () => void;
  setTradeFilters: (filters: Partial<TradeFilters>) => void;
  resetTradeFilters: () => void;
  setTradePagination: (pagination: Partial<TradePagination>) => void;
  setTimezone: (timezone: string) => void;

  getRecommendedSlippage: (volatility: number) => number;
  getPriorityFeeForPreset: (preset: PriorityFeePreset) => PriorityFeeOption;
  shouldBlockTrade: (priceImpact: number, slippage: number) => boolean;
}

const DEFAULT_PRIORITY_FEES = {
  slow: {
    preset: 'slow' as PriorityFeePreset,
    microLamports: 1000,
    estimatedConfirmationTime: '30-60s',
  },
  normal: {
    preset: 'normal' as PriorityFeePreset,
    microLamports: 5000,
    estimatedConfirmationTime: '10-20s',
  },
  fast: {
    preset: 'fast' as PriorityFeePreset,
    microLamports: 10000,
    estimatedConfirmationTime: '5-10s',
  },
};

export const useTradingSettingsStore = create<TradingSettingsState>()(
  persist(
    (set, get) => ({
      slippage: {
        tolerance: 50, // 0.5%
        autoAdjust: true,
        maxTolerance: 1000, // 10%
        rejectAboveThreshold: true,
      },
      mevProtection: {
        enabled: false,
        useJito: false,
        usePrivateRPC: false,
        protectedTrades: 0,
        estimatedSavings: 0,
      },
      gasOptimization: {
        priorityFeePreset: 'normal',
        customPriorityFee: undefined,
        historicalData: {
          averageFee: 5000,
          medianFee: 5000,
          congestionLevel: 'medium',
        },
      },
      tradeHistory: [],
      tradeFilters: { ...DEFAULT_TRADE_FILTERS },
      tradePagination: { ...DEFAULT_PAGINATION },
      timezone: DEFAULT_TIMEZONE,

      setSlippageTolerance: (tolerance: number) =>
        set(state => ({
          slippage: { ...state.slippage, tolerance },
        })),

      setSlippageAutoAdjust: (enabled: boolean) =>
        set(state => ({
          slippage: { ...state.slippage, autoAdjust: enabled },
        })),

      setSlippageMaxTolerance: (maxTolerance: number) =>
        set(state => ({
          slippage: { ...state.slippage, maxTolerance },
        })),

      setSlippageRejectAbove: (enabled: boolean) =>
        set(state => ({
          slippage: { ...state.slippage, rejectAboveThreshold: enabled },
        })),

      toggleMEVProtection: (enabled: boolean) =>
        set(state => ({
          mevProtection: { ...state.mevProtection, enabled },
        })),

      setJitoEnabled: (enabled: boolean) =>
        set(state => ({
          mevProtection: { ...state.mevProtection, useJito: enabled },
        })),

      setPrivateRPCEnabled: (enabled: boolean) =>
        set(state => ({
          mevProtection: { ...state.mevProtection, usePrivateRPC: enabled },
        })),

      setPriorityFeePreset: (preset: PriorityFeePreset) =>
        set(state => ({
          gasOptimization: { ...state.gasOptimization, priorityFeePreset: preset },
        })),

      setCustomPriorityFee: (fee: number) =>
        set(state => ({
          gasOptimization: {
            ...state.gasOptimization,
            customPriorityFee: fee,
            priorityFeePreset: 'custom',
          },
        })),

      updateCongestionData: (level, avgFee, medianFee) =>
        set(state => ({
          gasOptimization: {
            ...state.gasOptimization,
            historicalData: {
              averageFee: avgFee,
              medianFee: medianFee,
              congestionLevel: level,
            },
          },
        })),

      addTradeToHistory: (trade: TradeMetrics) =>
        set(state => {
          const generateId = () =>
            `${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;

          const tradeWithId = {
            ...trade,
            id: trade.id || generateId(),
            status: trade.status || 'filled',
          };

          const updatedHistory = [tradeWithId, ...state.tradeHistory].slice(0, 100); // Keep last 100 trades

          // Update MEV metrics if trade was protected
          let updatedMevProtection = state.mevProtection;
          if (trade.mevProtected) {
            updatedMevProtection = {
              ...state.mevProtection,
              protectedTrades: state.mevProtection.protectedTrades + 1,
              estimatedSavings: state.mevProtection.estimatedSavings + (trade.mevSavings ?? 0),
            };
          }

          return {
            tradeHistory: updatedHistory,
            mevProtection: updatedMevProtection,
          };
        }),

      updateTradeInHistory: (tradeId, updates) =>
        set(state => ({
          tradeHistory: state.tradeHistory.map(trade =>
            trade.id === tradeId ? { ...trade, ...updates } : trade
          ),
        })),

      removeTradeFromHistory: tradeId =>
        set(state => ({
          tradeHistory: state.tradeHistory.filter(trade => trade.id !== tradeId),
        })),

      clearTradeHistory: () => set({ tradeHistory: [] }),

      setTradeFilters: filters =>
        set(state => ({
          tradeFilters: { ...state.tradeFilters, ...filters },
        })),

      resetTradeFilters: () =>
        set({
          tradeFilters: { ...DEFAULT_TRADE_FILTERS },
        }),

      setTradePagination: pagination =>
        set(state => ({
          tradePagination: { ...state.tradePagination, ...pagination },
        })),

      setTimezone: timezone => set({ timezone }),

      getRecommendedSlippage: (volatility: number) => {
        const state = get();
        if (!state.slippage.autoAdjust) {
          return state.slippage.tolerance;
        }

        // Adjust slippage based on volatility
        // Higher volatility = higher slippage tolerance
        let adjustedSlippage = state.slippage.tolerance;

        if (volatility > 5) {
          adjustedSlippage = state.slippage.tolerance * 2;
        } else if (volatility > 3) {
          adjustedSlippage = state.slippage.tolerance * 1.5;
        } else if (volatility > 1) {
          adjustedSlippage = state.slippage.tolerance * 1.2;
        }

        // Cap at max tolerance
        return Math.min(adjustedSlippage, state.slippage.maxTolerance);
      },

      getPriorityFeeForPreset: (preset: PriorityFeePreset) => {
        const state = get();

        if (preset === 'custom' && state.gasOptimization.customPriorityFee) {
          return {
            preset: 'custom',
            microLamports: state.gasOptimization.customPriorityFee,
            estimatedConfirmationTime: 'varies',
          };
        }

        // Adjust fees based on congestion
        const baseFees =
          DEFAULT_PRIORITY_FEES[preset as keyof typeof DEFAULT_PRIORITY_FEES] ||
          DEFAULT_PRIORITY_FEES.normal;
        const congestion = state.gasOptimization.historicalData.congestionLevel;

        let multiplier = 1;
        if (congestion === 'high') {
          multiplier = 2;
        } else if (congestion === 'low') {
          multiplier = 0.75;
        }

        return {
          ...baseFees,
          microLamports: Math.floor(baseFees.microLamports * multiplier),
        };
      },

      shouldBlockTrade: (priceImpact: number, slippage: number) => {
        const state = get();

        if (!state.slippage.rejectAboveThreshold) {
          return false;
        }

        // Convert slippage from bps to percentage for comparison
        const slippagePercent = slippage / 100;
        const maxTolerancePercent = state.slippage.maxTolerance / 100;

        // Block if price impact or slippage exceeds max tolerance
        return priceImpact > maxTolerancePercent || slippagePercent > maxTolerancePercent;
      },
    }),
    {
      name: 'trading-settings-storage',
    }
  )
);

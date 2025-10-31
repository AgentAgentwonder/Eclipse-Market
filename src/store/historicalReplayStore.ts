import { create } from 'zustand';

export interface HistoricalDataPoint {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface HistoricalDataSet {
  symbol: string;
  interval: string;
  data: HistoricalDataPoint[];
  fetched_at: string;
}

export interface SimulationAction {
  timestamp: number;
  action_type: 'Buy' | 'Sell' | 'Rebalance';
}

export interface PortfolioHolding {
  symbol: string;
  quantity: number;
  average_entry_price: number;
  first_purchase_time: number;
}

export interface PortfolioSnapshot {
  timestamp: number;
  holdings: PortfolioHolding[];
  cash_balance: number;
  total_value: number;
  unrealized_pnl: number;
  realized_pnl: number;
}

export interface SimulationResult {
  config: {
    start_time: number;
    end_time: number;
    initial_capital: number;
    commission_rate: number;
    slippage_rate: number;
  };
  snapshots: PortfolioSnapshot[];
  final_value: number;
  total_return: number;
  total_return_percent: number;
  max_drawdown: number;
  sharpe_ratio: number;
  num_trades: number;
  total_fees: number;
}

export interface CounterfactualResult {
  symbol: string;
  quantity: number;
  start_price: number;
  end_price: number;
  start_value: number;
  final_value: number;
  absolute_return: number;
  percent_return: number;
  max_drawdown: number;
  annualized_return: number;
  volatility: number;
  points: Array<{
    timestamp: number;
    price: number;
    value: number;
    percent_change: number;
  }>;
}

interface HistoricalReplayState {
  datasets: Record<string, HistoricalDataSet>;
  currentDataset: HistoricalDataSet | null;
  simulationResult: SimulationResult | null;
  counterfactuals: CounterfactualResult[];
  isLoading: boolean;
  error: string | null;
  playbackState: {
    isPlaying: boolean;
    currentTime: number;
    speed: number;
  };
  
  setDataset: (symbol: string, dataset: HistoricalDataSet) => void;
  setCurrentDataset: (dataset: HistoricalDataSet | null) => void;
  setSimulationResult: (result: SimulationResult | null) => void;
  addCounterfactual: (result: CounterfactualResult) => void;
  clearCounterfactuals: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPlaybackState: (state: Partial<HistoricalReplayState['playbackState']>) => void;
  reset: () => void;
}

const initialPlaybackState = {
  isPlaying: false,
  currentTime: 0,
  speed: 1,
};

export const useHistoricalReplayStore = create<HistoricalReplayState>((set) => ({
  datasets: {},
  currentDataset: null,
  simulationResult: null,
  counterfactuals: [],
  isLoading: false,
  error: null,
  playbackState: initialPlaybackState,

  setDataset: (symbol, dataset) =>
    set((state) => ({
      datasets: { ...state.datasets, [symbol]: dataset },
    })),

  setCurrentDataset: (dataset) => set({ currentDataset: dataset }),

  setSimulationResult: (result) => set({ simulationResult: result }),

  addCounterfactual: (result) =>
    set((state) => ({
      counterfactuals: [...state.counterfactuals, result],
    })),

  clearCounterfactuals: () => set({ counterfactuals: [] }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  setPlaybackState: (state) =>
    set((current) => ({
      playbackState: { ...current.playbackState, ...state },
    })),

  reset: () =>
    set({
      datasets: {},
      currentDataset: null,
      simulationResult: null,
      counterfactuals: [],
      isLoading: false,
      error: null,
      playbackState: initialPlaybackState,
    }),
}));

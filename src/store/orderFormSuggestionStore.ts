import { create } from 'zustand';

type OrderFormSuggestion = {
  amount?: number;
  limitPrice?: number;
  stopPrice?: number;
  side?: 'buy' | 'sell';
  orderType?: 'limit' | 'stop_loss' | 'take_profit';
  source: 'position_size' | 'risk_reward' | 'rebalancer';
  note?: string;
};

interface OrderFormSuggestionState {
  suggestion?: OrderFormSuggestion & { id: number };
  setSuggestion: (suggestion: OrderFormSuggestion) => void;
  consumeSuggestion: () => void;
}

export const useOrderFormSuggestionStore = create<OrderFormSuggestionState>(set => ({
  suggestion: undefined,
  setSuggestion: suggestion => set({ suggestion: { ...suggestion, id: Date.now() } }),
  consumeSuggestion: () => set({ suggestion: undefined }),
}));

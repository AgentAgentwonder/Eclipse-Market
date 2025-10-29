import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PaperTrade {
  id: string;
  timestamp: number;
  side: 'buy' | 'sell';
  fromToken: string;
  toToken: string;
  fromAmount: number;
  toAmount: number;
  price: number; // execution price denominated in USD-equivalent
  status: 'filled' | 'pending' | 'cancelled';
  slippage: number; // expressed in bps
  fees: number;
  pnl?: number;
  pnlPercent?: number;
}

export interface PaperPosition {
  token: string;
  amount: number;
  averagePrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
}

interface BalancePoint {
  timestamp: number;
  balance: number;
}

interface PaperTradingState {
  isPaperMode: boolean;
  startingBalance: number;
  virtualBalance: number;
  trades: PaperTrade[];
  positions: PaperPosition[];
  hasSeenTutorial: boolean;

  togglePaperMode: (enabled: boolean) => void;
  executePaperTrade: (trade: Omit<PaperTrade, 'id' | 'timestamp' | 'status'>) => void;
  updatePosition: (token: string, currentPrice: number) => void;
  resetAccount: () => void;
  setHasSeenTutorial: (seen: boolean) => void;

  getTotalPnL: () => number;
  getTotalPnLPercent: () => number;
  getBestTrade: () => PaperTrade | null;
  getWorstTrade: () => PaperTrade | null;
  getWinRate: () => number;
  getBalanceHistory: () => BalancePoint[];
}

const DEFAULT_STARTING_BALANCE = 10_000; // $10,000
const MIN_POSITION_AMOUNT = 0.000001;

const recalcPosition = (position: PaperPosition, priceOverride?: number): PaperPosition => {
  const effectivePrice = priceOverride ?? position.currentPrice ?? position.averagePrice;
  const pnl = (effectivePrice - position.averagePrice) * position.amount;
  const pnlPercent =
    position.averagePrice === 0
      ? 0
      : ((effectivePrice - position.averagePrice) / position.averagePrice) * 100;

  return {
    ...position,
    currentPrice: effectivePrice,
    pnl,
    pnlPercent,
  };
};

export const usePaperTradingStore = create<PaperTradingState>()(
  persist(
    (set, get) => ({
      isPaperMode: false,
      startingBalance: DEFAULT_STARTING_BALANCE,
      virtualBalance: DEFAULT_STARTING_BALANCE,
      trades: [],
      positions: [],
      hasSeenTutorial: false,

      togglePaperMode: (enabled: boolean) => {
        set({ isPaperMode: enabled });

        const state = get();
        if (enabled && state.trades.length === 0 && state.positions.length === 0) {
          set({
            virtualBalance: state.startingBalance,
          });
        }
      },

      executePaperTrade: tradeInput => {
        const state = get();

        const tokenForPosition =
          tradeInput.side === 'buy' ? tradeInput.toToken : tradeInput.fromToken;
        const positions = [...state.positions];
        const existingIndex = positions.findIndex(pos => pos.token === tokenForPosition);

        let realizedPnL = 0;
        let realizedPnLPercent = 0;

        if (tradeInput.side === 'buy') {
          if (existingIndex >= 0) {
            const existing = positions[existingIndex];
            const totalAmount = existing.amount + tradeInput.toAmount;
            const totalCost =
              existing.averagePrice * existing.amount + tradeInput.price * tradeInput.toAmount;
            positions[existingIndex] = recalcPosition(
              {
                ...existing,
                amount: totalAmount,
                averagePrice: totalCost / totalAmount,
              },
              tradeInput.price
            );
          } else {
            positions.push(
              recalcPosition(
                {
                  token: tradeInput.toToken,
                  amount: tradeInput.toAmount,
                  averagePrice: tradeInput.price,
                  currentPrice: tradeInput.price,
                  pnl: 0,
                  pnlPercent: 0,
                },
                tradeInput.price
              )
            );
          }
        } else {
          if (existingIndex >= 0) {
            const position = positions[existingIndex];
            const amountSold = Math.min(tradeInput.fromAmount, position.amount);
            const costBasis = position.averagePrice * amountSold;
            const proceeds = tradeInput.price * amountSold;

            realizedPnL = proceeds - costBasis;
            realizedPnLPercent = costBasis === 0 ? 0 : (realizedPnL / costBasis) * 100;

            const remainingAmount = position.amount - amountSold;

            if (remainingAmount <= MIN_POSITION_AMOUNT) {
              positions.splice(existingIndex, 1);
            } else {
              positions[existingIndex] = recalcPosition(
                {
                  ...position,
                  amount: remainingAmount,
                },
                tradeInput.price
              );
            }
          } else {
            // Selling an asset without an existing position — treat as closing a flat position with zero PnL
            realizedPnL = 0;
            realizedPnLPercent = 0;
          }
        }

        const newBalance =
          tradeInput.side === 'buy'
            ? state.virtualBalance - tradeInput.fromAmount - tradeInput.fees
            : state.virtualBalance + tradeInput.toAmount - tradeInput.fees;

        const newTrade: PaperTrade = {
          ...tradeInput,
          id: `paper-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          timestamp: Date.now(),
          status: 'filled',
          pnl: realizedPnL,
          pnlPercent: realizedPnLPercent,
        };

        set({
          trades: [newTrade, ...state.trades],
          virtualBalance: newBalance,
          positions,
        });
      },

      updatePosition: (token: string, currentPrice: number) => {
        const state = get();
        const positions = state.positions.map(position =>
          position.token === token ? recalcPosition(position, currentPrice) : position
        );
        set({ positions });
      },

      resetAccount: () => {
        const state = get();
        set({
          virtualBalance: state.startingBalance,
          trades: [],
          positions: [],
        });
      },

      setHasSeenTutorial: (seen: boolean) => {
        set({ hasSeenTutorial: seen });
      },

      getTotalPnL: () => {
        const state = get();
        const balanceChange = state.virtualBalance - state.startingBalance;
        const unrealized = state.positions.reduce((sum, pos) => sum + pos.pnl, 0);
        return balanceChange + unrealized;
      },

      getTotalPnLPercent: () => {
        const state = get();
        const totalPnL = get().getTotalPnL();
        return state.startingBalance === 0 ? 0 : (totalPnL / state.startingBalance) * 100;
      },

      getBestTrade: () => {
        const trades = get().trades.filter(trade => (trade.pnl ?? 0) > 0);
        if (trades.length === 0) return null;
        return trades.reduce((best, current) =>
          (current.pnl ?? 0) > (best.pnl ?? 0) ? current : best
        );
      },

      getWorstTrade: () => {
        const trades = get().trades.filter(trade => (trade.pnl ?? 0) < 0);
        if (trades.length === 0) return null;
        return trades.reduce((worst, current) =>
          (current.pnl ?? 0) < (worst.pnl ?? 0) ? current : worst
        );
      },

      getWinRate: () => {
        const trades = get().trades.filter(trade => trade.pnl !== undefined);
        if (trades.length === 0) return 0;
        const wins = trades.filter(trade => (trade.pnl ?? 0) > 0);
        return (wins.length / trades.length) * 100;
      },

      getBalanceHistory: () => {
        const state = get();
        const history: BalancePoint[] = [];

        const baselineTimestamp =
          state.trades.length > 0
            ? state.trades[state.trades.length - 1].timestamp - 1
            : Date.now();

        history.push({
          timestamp: baselineTimestamp,
          balance: state.startingBalance,
        });

        let runningBalance = state.startingBalance;
        state.trades
          .slice()
          .reverse()
          .forEach(trade => {
            const delta =
              trade.side === 'buy' ? -trade.fromAmount - trade.fees : trade.toAmount - trade.fees;
            runningBalance += delta;
            history.push({
              timestamp: trade.timestamp,
              balance: Number(runningBalance.toFixed(2)),
            });
          });

        return history;
      },
    }),
    {
      name: 'paper-trading-storage',
    }
  )
);

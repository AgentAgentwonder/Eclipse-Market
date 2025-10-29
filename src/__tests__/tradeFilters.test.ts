import { describe, it, expect } from 'vitest';
import {
  filterTrades,
  sortTrades,
  paginateTrades,
  calculateExecutionQuality,
} from '../utils/tradeFilters';
import { EnhancedTradeMetrics, TradeFilters } from '../types/tradeReporting';

const createMockTrade = (overrides?: Partial<EnhancedTradeMetrics>): EnhancedTradeMetrics => ({
  id: 'trade-1',
  timestamp: Date.now(),
  fromToken: 'SOL',
  toToken: 'USDC',
  side: 'buy',
  status: 'filled',
  amount: '1.0',
  slippage: 0.5,
  priceImpact: 0.3,
  gasCost: 0.00005,
  priorityFeeMicroLamports: 5000,
  mevProtected: false,
  executionPrice: 100,
  expectedPrice: 100.5,
  pnl: 0.5,
  pnlPercent: 0.5,
  ...overrides,
});

describe('filterTrades', () => {
  it('should filter trades by date range', () => {
    const now = Date.now();
    const yesterday = now - 86400000;
    const tomorrow = now + 86400000;

    const trades = [
      createMockTrade({ id: 'trade-1', timestamp: yesterday }),
      createMockTrade({ id: 'trade-2', timestamp: now }),
      createMockTrade({ id: 'trade-3', timestamp: tomorrow }),
    ];

    const filters: TradeFilters = {
      dateRange: {
        start: new Date(now),
        end: new Date(tomorrow + 1000),
      },
    };

    const filtered = filterTrades(trades, filters);
    expect(filtered).toHaveLength(2);
    expect(filtered.map(t => t.id)).toEqual(['trade-2', 'trade-3']);
  });

  it('should filter trades by token', () => {
    const trades = [
      createMockTrade({ id: 'trade-1', fromToken: 'SOL', toToken: 'USDC' }),
      createMockTrade({ id: 'trade-2', fromToken: 'USDC', toToken: 'RAY' }),
      createMockTrade({ id: 'trade-3', fromToken: 'SOL', toToken: 'RAY' }),
    ];

    const filters: TradeFilters = {
      tokens: ['SOL'],
    };

    const filtered = filterTrades(trades, filters);
    expect(filtered).toHaveLength(2);
    expect(filtered.map(t => t.id)).toEqual(['trade-1', 'trade-3']);
  });

  it('should filter trades by side', () => {
    const trades = [
      createMockTrade({ id: 'trade-1', side: 'buy' }),
      createMockTrade({ id: 'trade-2', side: 'sell' }),
      createMockTrade({ id: 'trade-3', side: 'buy' }),
    ];

    const filters: TradeFilters = {
      side: 'buy',
    };

    const filtered = filterTrades(trades, filters);
    expect(filtered).toHaveLength(2);
    expect(filtered.map(t => t.id)).toEqual(['trade-1', 'trade-3']);
  });

  it('should filter trades by status', () => {
    const trades = [
      createMockTrade({ id: 'trade-1', status: 'filled' }),
      createMockTrade({ id: 'trade-2', status: 'pending' }),
      createMockTrade({ id: 'trade-3', status: 'filled' }),
    ];

    const filters: TradeFilters = {
      status: 'filled',
    };

    const filtered = filterTrades(trades, filters);
    expect(filtered).toHaveLength(2);
    expect(filtered.map(t => t.id)).toEqual(['trade-1', 'trade-3']);
  });

  it('should filter trades by P&L range', () => {
    const trades = [
      createMockTrade({ id: 'trade-1', pnl: -1.0 }),
      createMockTrade({ id: 'trade-2', pnl: 0.5 }),
      createMockTrade({ id: 'trade-3', pnl: 2.0 }),
    ];

    const filters: TradeFilters = {
      pnlRange: {
        min: 0,
        max: 1.5,
      },
    };

    const filtered = filterTrades(trades, filters);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('trade-2');
  });

  it('should filter trades by search query', () => {
    const trades = [
      createMockTrade({ id: 'trade-1', txSignature: 'abc123' }),
      createMockTrade({ id: 'trade-2', txSignature: 'def456' }),
      createMockTrade({ id: 'trade-3', fromToken: 'RAY' }),
    ];

    const filters: TradeFilters = {
      searchQuery: 'abc',
    };

    const filtered = filterTrades(trades, filters);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('trade-1');
  });

  it('should filter trades by wallet address', () => {
    const trades = [
      createMockTrade({ id: 'trade-1', walletAddress: 'wallet1' }),
      createMockTrade({ id: 'trade-2', walletAddress: 'wallet2' }),
      createMockTrade({ id: 'trade-3', walletAddress: 'wallet1' }),
    ];

    const filters: TradeFilters = {
      walletAddress: 'wallet1',
    };

    const filtered = filterTrades(trades, filters);
    expect(filtered).toHaveLength(2);
    expect(filtered.map(t => t.id)).toEqual(['trade-1', 'trade-3']);
  });

  it('should filter trades by paper trade status', () => {
    const trades = [
      createMockTrade({ id: 'trade-1', isPaperTrade: true }),
      createMockTrade({ id: 'trade-2', isPaperTrade: false }),
      createMockTrade({ id: 'trade-3', isPaperTrade: true }),
    ];

    const filters: TradeFilters = {
      isPaperTrade: true,
    };

    const filtered = filterTrades(trades, filters);
    expect(filtered).toHaveLength(2);
    expect(filtered.map(t => t.id)).toEqual(['trade-1', 'trade-3']);
  });
});

describe('sortTrades', () => {
  it('should sort trades by timestamp ascending', () => {
    const trades = [
      createMockTrade({ id: 'trade-1', timestamp: 3000 }),
      createMockTrade({ id: 'trade-2', timestamp: 1000 }),
      createMockTrade({ id: 'trade-3', timestamp: 2000 }),
    ];

    const sorted = sortTrades(trades, 'timestamp', 'asc');
    expect(sorted.map(t => t.id)).toEqual(['trade-2', 'trade-3', 'trade-1']);
  });

  it('should sort trades by timestamp descending', () => {
    const trades = [
      createMockTrade({ id: 'trade-1', timestamp: 1000 }),
      createMockTrade({ id: 'trade-2', timestamp: 3000 }),
      createMockTrade({ id: 'trade-3', timestamp: 2000 }),
    ];

    const sorted = sortTrades(trades, 'timestamp', 'desc');
    expect(sorted.map(t => t.id)).toEqual(['trade-2', 'trade-3', 'trade-1']);
  });

  it('should sort trades by P&L', () => {
    const trades = [
      createMockTrade({ id: 'trade-1', pnl: 0.5 }),
      createMockTrade({ id: 'trade-2', pnl: -1.0 }),
      createMockTrade({ id: 'trade-3', pnl: 2.0 }),
    ];

    const sorted = sortTrades(trades, 'pnl', 'desc');
    expect(sorted.map(t => t.id)).toEqual(['trade-3', 'trade-1', 'trade-2']);
  });
});

describe('paginateTrades', () => {
  it('should paginate trades correctly', () => {
    const trades = [
      createMockTrade({ id: 'trade-1' }),
      createMockTrade({ id: 'trade-2' }),
      createMockTrade({ id: 'trade-3' }),
      createMockTrade({ id: 'trade-4' }),
      createMockTrade({ id: 'trade-5' }),
    ];

    const page1 = paginateTrades(trades, 1, 2);
    expect(page1.trades).toHaveLength(2);
    expect(page1.trades.map(t => t.id)).toEqual(['trade-1', 'trade-2']);
    expect(page1.totalPages).toBe(3);
    expect(page1.totalCount).toBe(5);

    const page2 = paginateTrades(trades, 2, 2);
    expect(page2.trades).toHaveLength(2);
    expect(page2.trades.map(t => t.id)).toEqual(['trade-3', 'trade-4']);

    const page3 = paginateTrades(trades, 3, 2);
    expect(page3.trades).toHaveLength(1);
    expect(page3.trades.map(t => t.id)).toEqual(['trade-5']);
  });
});

describe('calculateExecutionQuality', () => {
  it('should return Excellent for high quality trades', () => {
    const trade = createMockTrade({
      slippage: 0.3,
      priceImpact: 0.5,
      mevProtected: true,
    });
    expect(calculateExecutionQuality(trade)).toBe('Excellent');
  });

  it('should return Good for decent trades', () => {
    const trade = createMockTrade({
      slippage: 0.7,
      priceImpact: 2.0,
      mevProtected: true,
    });
    expect(calculateExecutionQuality(trade)).toBe('Good');
  });

  it('should return Fair for average trades', () => {
    const trade = createMockTrade({
      slippage: 1.2,
      priceImpact: 3.5,
      mevProtected: false,
    });
    expect(calculateExecutionQuality(trade)).toBe('Fair');
  });

  it('should return Poor for low quality trades', () => {
    const trade = createMockTrade({
      slippage: 2.5,
      priceImpact: 7.0,
      mevProtected: false,
    });
    expect(calculateExecutionQuality(trade)).toBe('Poor');
  });
});

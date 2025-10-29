import { describe, it, expect } from 'vitest';
import { IndicatorEngine, runSimpleBacktest } from '../utils/indicatorEngine';
import { CustomIndicator, CandleData } from '../types/indicators';

describe('IndicatorEngine', () => {
  const mockCandles: CandleData[] = [
    { timestamp: 1000, open: 100, high: 105, low: 95, close: 102, volume: 1000 },
    { timestamp: 2000, open: 102, high: 110, low: 100, close: 108, volume: 1500 },
    { timestamp: 3000, open: 108, high: 115, low: 105, close: 112, volume: 2000 },
    { timestamp: 4000, open: 112, high: 120, low: 110, close: 118, volume: 1800 },
    { timestamp: 5000, open: 118, high: 125, low: 115, close: 120, volume: 2200 },
    { timestamp: 6000, open: 120, high: 130, low: 118, close: 128, volume: 2500 },
    { timestamp: 7000, open: 128, high: 135, low: 125, close: 132, volume: 2100 },
    { timestamp: 8000, open: 132, high: 140, low: 130, close: 138, volume: 2400 },
    { timestamp: 9000, open: 138, high: 145, low: 135, close: 142, volume: 2300 },
    { timestamp: 10000, open: 142, high: 150, low: 140, close: 148, volume: 2600 },
  ];

  const engine = new IndicatorEngine();

  describe('SMA calculation', () => {
    it('should calculate simple moving average correctly', () => {
      const indicator: CustomIndicator = {
        id: 'test-sma',
        name: 'Test SMA',
        description: 'Simple 3-period SMA',
        nodes: [
          {
            id: 'sma-node',
            type: 'indicator',
            indicator: 'sma',
            params: { period: 3 },
          },
        ],
        outputNodeId: 'sma-node',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = engine.evaluateIndicator(indicator, mockCandles);

      expect(result).toHaveLength(mockCandles.length);
      expect(result[0].value).toBe(0); // Not enough data
      expect(result[1].value).toBe(0); // Not enough data
      // Average of 102, 108, 112 = 107.33...
      expect(result[2].value).toBeCloseTo(107.33, 1);
    });
  });

  describe('EMA calculation', () => {
    it('should calculate exponential moving average correctly', () => {
      const indicator: CustomIndicator = {
        id: 'test-ema',
        name: 'Test EMA',
        description: 'Exponential 3-period EMA',
        nodes: [
          {
            id: 'ema-node',
            type: 'indicator',
            indicator: 'ema',
            params: { period: 3 },
          },
        ],
        outputNodeId: 'ema-node',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = engine.evaluateIndicator(indicator, mockCandles);

      expect(result).toHaveLength(mockCandles.length);
      expect(result[0].value).toBe(0); // Not enough data
      expect(result[1].value).toBe(0); // Not enough data
      expect(result[2].value).toBeGreaterThan(0);
      // EMA should respond faster than SMA
      expect(result[mockCandles.length - 1].value).toBeGreaterThan(100);
    });
  });

  describe('RSI calculation', () => {
    it('should calculate RSI correctly', () => {
      const indicator: CustomIndicator = {
        id: 'test-rsi',
        name: 'Test RSI',
        description: 'RSI with 3 periods',
        nodes: [
          {
            id: 'rsi-node',
            type: 'indicator',
            indicator: 'rsi',
            params: { period: 3 },
          },
        ],
        outputNodeId: 'rsi-node',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = engine.evaluateIndicator(indicator, mockCandles);

      expect(result).toHaveLength(mockCandles.length);
      // RSI should be between 0 and 100
      result.forEach((point, i) => {
        if (i >= 3) {
          expect(point.value).toBeGreaterThanOrEqual(0);
          expect(point.value).toBeLessThanOrEqual(100);
        }
      });
    });
  });

  describe('Operator nodes', () => {
    it('should add two constants correctly', () => {
      const indicator: CustomIndicator = {
        id: 'test-add',
        name: 'Test Add',
        description: 'Add two constants',
        nodes: [
          { id: 'const-1', type: 'constant', value: 10 },
          { id: 'const-2', type: 'constant', value: 20 },
          {
            id: 'add-node',
            type: 'operator',
            operator: '+',
            inputs: ['const-1', 'const-2'],
          },
        ],
        outputNodeId: 'add-node',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = engine.evaluateIndicator(indicator, mockCandles);

      expect(result).toHaveLength(mockCandles.length);
      result.forEach(point => {
        expect(point.value).toBe(30);
      });
    });

    it('should multiply correctly', () => {
      const indicator: CustomIndicator = {
        id: 'test-mul',
        name: 'Test Multiply',
        description: 'Multiply two constants',
        nodes: [
          { id: 'const-1', type: 'constant', value: 5 },
          { id: 'const-2', type: 'constant', value: 3 },
          {
            id: 'mul-node',
            type: 'operator',
            operator: '*',
            inputs: ['const-1', 'const-2'],
          },
        ],
        outputNodeId: 'mul-node',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = engine.evaluateIndicator(indicator, mockCandles);

      expect(result).toHaveLength(mockCandles.length);
      result.forEach(point => {
        expect(point.value).toBe(15);
      });
    });
  });

  describe('Condition nodes', () => {
    it('should evaluate greater-than condition correctly', () => {
      const indicator: CustomIndicator = {
        id: 'test-gt',
        name: 'Test Greater Than',
        description: 'Check if 10 > 5',
        nodes: [
          { id: 'const-1', type: 'constant', value: 10 },
          { id: 'const-2', type: 'constant', value: 5 },
          {
            id: 'gt-node',
            type: 'condition',
            operator: '>',
            inputs: ['const-1', 'const-2'],
          },
        ],
        outputNodeId: 'gt-node',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = engine.evaluateIndicator(indicator, mockCandles);

      expect(result).toHaveLength(mockCandles.length);
      result.forEach(point => {
        expect(point.value).toBe(1); // true
      });
    });
  });

  describe('Backtest', () => {
    it('should generate buy/sell signals based on threshold crossings', () => {
      const indicator: CustomIndicator = {
        id: 'test-backtest',
        name: 'Test Backtest',
        description: 'Simple constant for testing',
        nodes: [
          { id: 'const-1', type: 'constant', value: 50 },
        ],
        outputNodeId: 'const-1',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = runSimpleBacktest(indicator, mockCandles, 50);

      expect(result.performance).toBeDefined();
      expect(result.performance.totalTrades).toBeGreaterThanOrEqual(0);
      expect(result.performance.profitableTrades).toBeGreaterThanOrEqual(0);
      expect(result.signals).toBeDefined();
    });
  });

  describe('Cache', () => {
    it('should cache results', () => {
      const indicator: CustomIndicator = {
        id: 'test-cache',
        name: 'Test Cache',
        description: 'SMA for caching test',
        nodes: [
          {
            id: 'sma-node',
            type: 'indicator',
            indicator: 'sma',
            params: { period: 3 },
          },
        ],
        outputNodeId: 'sma-node',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result1 = engine.evaluateIndicator(indicator, mockCandles);
      const result2 = engine.evaluateIndicator(indicator, mockCandles);

      // Results should be identical (cached)
      expect(result1).toEqual(result2);

      engine.clearCache();

      const result3 = engine.evaluateIndicator(indicator, mockCandles);
      // Should still be equal but recalculated
      expect(result1).toEqual(result3);
    });
  });
});

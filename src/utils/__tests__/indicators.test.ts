import { describe, it, expect } from 'vitest';
import {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateStochastic,
  generateSignals,
  type PriceData,
} from '../indicators';

describe('Indicator Calculations', () => {
  describe('SMA (Simple Moving Average)', () => {
    it('should calculate SMA correctly', () => {
      const data = [10, 12, 14, 16, 18, 20];
      const result = calculateSMA(data, 3);

      expect(result[0]).toBeNull();
      expect(result[1]).toBeNull();
      expect(result[2]).toBe(12); // (10+12+14)/3
      expect(result[3]).toBe(14); // (12+14+16)/3
      expect(result[4]).toBe(16); // (14+16+18)/3
      expect(result[5]).toBe(18); // (16+18+20)/3
    });

    it('should return nulls when insufficient data', () => {
      const data = [10, 12];
      const result = calculateSMA(data, 5);

      expect(result.every(val => val === null)).toBe(true);
    });
  });

  describe('EMA (Exponential Moving Average)', () => {
    it('should calculate EMA correctly', () => {
      const data = [10, 12, 14, 16, 18, 20, 22, 24, 26, 28];
      const result = calculateEMA(data, 5);

      expect(result.slice(0, 4).every(val => val === null)).toBe(true);
      expect(result[4]).not.toBeNull();
      expect(result[result.length - 1]).toBeGreaterThan(result[4]!);
    });
  });

  describe('RSI (Relative Strength Index)', () => {
    it('should calculate RSI correctly', () => {
      const data = [
        44, 44.34, 44.09, 43.61, 44.33, 44.83, 45.1, 45.42, 45.84, 46.08, 45.89, 46.03, 45.61,
        46.28, 46.28, 46, 46.03, 46.41, 46.22, 45.64,
      ];
      const result = calculateRSI(data, 14);

      expect(result[0]).toBeNull();
      expect(result[result.length - 1]).not.toBeNull();
      expect(result[result.length - 1]!).toBeGreaterThan(0);
      expect(result[result.length - 1]!).toBeLessThan(100);
    });

    it('should return values between 0 and 100', () => {
      const data = Array.from({ length: 30 }, (_, i) => 100 + i * 0.5);
      const result = calculateRSI(data, 14);

      result.forEach(val => {
        if (val !== null) {
          expect(val).toBeGreaterThanOrEqual(0);
          expect(val).toBeLessThanOrEqual(100);
        }
      });
    });
  });

  describe('MACD', () => {
    it('should calculate MACD, signal, and histogram', () => {
      const data = Array.from({ length: 50 }, (_, i) => 100 + Math.sin(i / 5) * 10);
      const result = calculateMACD(data, 12, 26, 9);

      expect(result.macd.length).toBe(data.length);
      expect(result.signal.length).toBe(data.length);
      expect(result.histogram.length).toBe(data.length);

      const lastIdx = data.length - 1;
      if (result.macd[lastIdx] !== null && result.signal[lastIdx] !== null) {
        expect(result.histogram[lastIdx]).toBe(result.macd[lastIdx]! - result.signal[lastIdx]!);
      }
    });
  });

  describe('Bollinger Bands', () => {
    it('should calculate upper, middle, and lower bands', () => {
      const data = Array.from({ length: 30 }, (_, i) => 100 + i * 0.5);
      const result = calculateBollingerBands(data, 20, 2);

      expect(result.upper.length).toBe(data.length);
      expect(result.middle.length).toBe(data.length);
      expect(result.lower.length).toBe(data.length);

      const lastIdx = data.length - 1;
      if (
        result.upper[lastIdx] !== null &&
        result.middle[lastIdx] !== null &&
        result.lower[lastIdx] !== null
      ) {
        expect(result.upper[lastIdx]!).toBeGreaterThan(result.middle[lastIdx]!);
        expect(result.middle[lastIdx]!).toBeGreaterThan(result.lower[lastIdx]!);
      }
    });
  });

  describe('Stochastic Oscillator', () => {
    it('should calculate %K and %D lines', () => {
      const data: PriceData[] = Array.from({ length: 30 }, (_, i) => ({
        timestamp: Date.now() + i * 1000,
        open: 100 + i * 0.3,
        high: 105 + i * 0.3,
        low: 95 + i * 0.3,
        close: 100 + i * 0.5,
        volume: 1000000,
      }));

      const result = calculateStochastic(data, 14, 3);

      expect(result.k.length).toBe(data.length);
      expect(result.d.length).toBe(data.length);

      result.k.forEach(val => {
        if (val !== null) {
          expect(val).toBeGreaterThanOrEqual(0);
          expect(val).toBeLessThanOrEqual(100);
        }
      });
    });
  });

  describe('Signal Generation', () => {
    it('should generate buy signal for oversold RSI', () => {
      const values = [25, 28, 30, 32];
      const signals = generateSignals('RSI', values, { oversold: 30, overbought: 70 });

      expect(signals[0]).toBe('buy');
      expect(signals[1]).toBe('buy');
    });

    it('should generate sell signal for overbought RSI', () => {
      const values = [68, 72, 75, 78];
      const signals = generateSignals('RSI', values, { oversold: 30, overbought: 70 });

      expect(signals[1]).toBe('sell');
      expect(signals[2]).toBe('sell');
    });

    it('should generate neutral signal for mid-range RSI', () => {
      const values = [45, 50, 55, 60];
      const signals = generateSignals('RSI', values, { oversold: 30, overbought: 70 });

      expect(signals.every(s => s === 'neutral')).toBe(true);
    });

    it('should generate MACD crossover signals', () => {
      const values = [-1, -0.5, 0.5, 1];
      const signals = generateSignals('MACD', values);

      expect(signals[2]).toBe('buy'); // Crossed above 0
    });
  });
});

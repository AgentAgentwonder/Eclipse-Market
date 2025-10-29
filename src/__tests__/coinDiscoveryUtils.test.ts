import { describe, it, expect } from 'vitest';
import {
  formatCurrencyAbbrev,
  formatTimeAgo,
  deriveSparklineTrend,
  normalizeSparkline,
} from '../pages/Coins/utils';

describe('Coin Discovery Utils', () => {
  describe('formatCurrencyAbbrev', () => {
    it('formats billions correctly', () => {
      expect(formatCurrencyAbbrev(1_500_000_000)).toBe('1.50B');
      expect(formatCurrencyAbbrev(45_000_000_000)).toBe('45.00B');
    });

    it('formats millions correctly', () => {
      expect(formatCurrencyAbbrev(1_500_000)).toBe('1.50M');
      expect(formatCurrencyAbbrev(150_000_000)).toBe('150.00M');
    });

    it('formats thousands correctly', () => {
      expect(formatCurrencyAbbrev(1_500)).toBe('1.50K');
      expect(formatCurrencyAbbrev(50_000)).toBe('50.00K');
    });

    it('formats small numbers correctly', () => {
      expect(formatCurrencyAbbrev(100)).toBe('100.00');
      expect(formatCurrencyAbbrev(0.5)).toBe('0.50');
    });

    it('respects precision parameter', () => {
      expect(formatCurrencyAbbrev(1_234_567, 1)).toBe('1.2M');
      expect(formatCurrencyAbbrev(1_234_567, 3)).toBe('1.235M');
    });

    it('handles negative values', () => {
      expect(formatCurrencyAbbrev(-1_500_000)).toBe('-1.50M');
      expect(formatCurrencyAbbrev(-5_000)).toBe('-5.00K');
    });
  });

  describe('formatTimeAgo', () => {
    const now = 1700000000;

    it('shows "Just now" for recent timestamps', () => {
      expect(formatTimeAgo(now - 30, now)).toBe('Just now');
      expect(formatTimeAgo(now - 59, now)).toBe('Just now');
    });

    it('shows minutes ago for timestamps within an hour', () => {
      expect(formatTimeAgo(now - 120, now)).toBe('2m ago');
      expect(formatTimeAgo(now - 3540, now)).toBe('59m ago');
    });

    it('shows hours ago for timestamps within a day', () => {
      expect(formatTimeAgo(now - 7200, now)).toBe('2h ago');
      expect(formatTimeAgo(now - 86340, now)).toBe('23h ago');
    });

    it('shows days ago for older timestamps', () => {
      expect(formatTimeAgo(now - 86400, now)).toBe('1d ago');
      expect(formatTimeAgo(now - 259200, now)).toBe('3d ago');
    });

    it('handles edge cases gracefully', () => {
      expect(formatTimeAgo(now + 100, now)).toBe('Just now');
    });
  });

  describe('deriveSparklineTrend', () => {
    it('identifies upward trend', () => {
      const upData = [100, 102, 105, 108, 110];
      expect(deriveSparklineTrend(upData)).toBe('up');
    });

    it('identifies downward trend', () => {
      const downData = [110, 108, 105, 102, 100];
      expect(deriveSparklineTrend(downData)).toBe('down');
    });

    it('identifies flat trend', () => {
      const flatData = [100, 100.1, 99.9, 100.2, 100];
      expect(deriveSparklineTrend(flatData)).toBe('flat');
    });

    it('handles empty array', () => {
      expect(deriveSparklineTrend([])).toBe('flat');
    });

    it('handles single value', () => {
      expect(deriveSparklineTrend([100])).toBe('flat');
    });

    it('considers threshold for small movements', () => {
      const smallUp = [100, 100.3];
      expect(deriveSparklineTrend(smallUp)).toBe('flat');

      const significantUp = [100, 105];
      expect(deriveSparklineTrend(significantUp)).toBe('up');
    });
  });

  describe('normalizeSparkline', () => {
    it('returns same data if lengths match', () => {
      const data = [1, 2, 3, 4, 5];
      expect(normalizeSparkline(data, 5)).toEqual(data);
    });

    it('upsamples data when target is larger', () => {
      const data = [1, 5];
      const result = normalizeSparkline(data, 5);
      expect(result).toHaveLength(5);
      expect(result[0]).toBe(1);
      expect(result[4]).toBe(5);
      expect(result[2]).toBeCloseTo(3, 1);
    });

    it('downsamples data when target is smaller', () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      const result = normalizeSparkline(data, 3);
      expect(result).toHaveLength(3);
      expect(result[0]).toBe(1);
      expect(result[2]).toBe(9);
      expect(result[1]).toBeCloseTo(5, 1);
    });

    it('handles empty input', () => {
      const result = normalizeSparkline([], 5);
      expect(result).toHaveLength(5);
      expect(result.every(v => v === 0)).toBe(true);
    });

    it('maintains precision', () => {
      const data = [1.123456, 2.234567];
      const result = normalizeSparkline(data, 3);
      result.forEach(v => {
        const decimals = v.toString().split('.')[1]?.length || 0;
        expect(decimals).toBeLessThanOrEqual(6);
      });
    });

    it('performs linear interpolation correctly', () => {
      const data = [0, 100];
      const result = normalizeSparkline(data, 5);
      expect(result[0]).toBe(0);
      expect(result[1]).toBeCloseTo(25, 1);
      expect(result[2]).toBeCloseTo(50, 1);
      expect(result[3]).toBeCloseTo(75, 1);
      expect(result[4]).toBe(100);
    });
  });
});

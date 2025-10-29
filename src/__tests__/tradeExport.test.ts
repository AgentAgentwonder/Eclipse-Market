import { describe, it, expect } from 'vitest';
import {
  getColumnsForPreset,
  formatTradeValue,
  exportToCSV,
  exportToXLSX,
  generateExportFilename,
} from '../utils/tradeExport';
import { EnhancedTradeMetrics, ExportConfig } from '../types/tradeReporting';

const createMockTrade = (overrides?: Partial<EnhancedTradeMetrics>): EnhancedTradeMetrics => ({
  id: 'trade-1',
  timestamp: Date.UTC(2024, 0, 1, 12, 0, 0),
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

describe('getColumnsForPreset', () => {
  it('should return tax report columns', () => {
    const columns = getColumnsForPreset('tax_report');
    expect(columns).toHaveLength(9);
    expect(columns.some(c => c.key === 'walletAddress')).toBe(true);
    expect(columns.some(c => c.key === 'pnl')).toBe(true);
  });

  it('should return performance columns', () => {
    const columns = getColumnsForPreset('performance');
    expect(columns).toHaveLength(11);
    expect(columns.some(c => c.key === 'pnl')).toBe(true);
    expect(columns.some(c => c.key === 'pnlPercent')).toBe(true);
    expect(columns.some(c => c.key === 'executionQuality')).toBe(true);
  });

  it('should return trade journal columns', () => {
    const columns = getColumnsForPreset('trade_journal');
    expect(columns).toHaveLength(15);
    expect(columns.some(c => c.key === 'mevProtected')).toBe(true);
  });

  it('should return default columns for custom preset', () => {
    const columns = getColumnsForPreset('custom');
    expect(columns.length).toBeGreaterThan(15);
  });

  it('should clone columns to prevent mutations', () => {
    const columns1 = getColumnsForPreset('tax_report');
    const columns2 = getColumnsForPreset('tax_report');

    columns1[0].enabled = false;
    expect(columns2[0].enabled).toBe(true);
  });
});

describe('formatTradeValue', () => {
  it('should format timestamp correctly', () => {
    const trade = createMockTrade({ timestamp: Date.UTC(2024, 0, 1, 12, 0, 0) });
    const formatted = formatTradeValue(trade, 'timestamp', 'UTC');
    expect(formatted).toContain('2024');
    expect(formatted).toContain('01');
  });

  it('should format slippage with 2 decimals', () => {
    const trade = createMockTrade({ slippage: 0.12345 });
    const formatted = formatTradeValue(trade, 'slippage');
    expect(formatted).toBe('0.12');
  });

  it('should format gas cost with 6 decimals', () => {
    const trade = createMockTrade({ gasCost: 0.00012345 });
    const formatted = formatTradeValue(trade, 'gasCost');
    expect(formatted).toBe('0.000123');
  });

  it('should format boolean values', () => {
    const trade1 = createMockTrade({ mevProtected: true });
    expect(formatTradeValue(trade1, 'mevProtected')).toBe('Yes');

    const trade2 = createMockTrade({ mevProtected: false });
    expect(formatTradeValue(trade2, 'mevProtected')).toBe('No');
  });

  it('should calculate execution quality', () => {
    const trade = createMockTrade({
      slippage: 0.3,
      priceImpact: 0.5,
      mevProtected: true,
    });
    const quality = formatTradeValue(trade, 'executionQuality');
    expect(quality).toBe('Excellent');
  });

  it('should return empty string for null/undefined values', () => {
    const trade = createMockTrade({ txSignature: undefined });
    expect(formatTradeValue(trade, 'txSignature')).toBe('');
  });
});

describe('exportToCSV', () => {
  it('should generate CSV with headers', () => {
    const trades = [createMockTrade()];
    const config: ExportConfig = {
      format: 'csv',
      preset: 'custom',
      columns: [
        { key: 'timestamp', label: 'Date', enabled: true },
        { key: 'fromToken', label: 'From', enabled: true },
        { key: 'toToken', label: 'To', enabled: true },
      ],
      includeHeaders: true,
    };

    const csv = exportToCSV(trades, config);
    const lines = csv.trim().split('\n');

    expect(lines.length).toBe(2);
    expect(lines[0]).toBe('Date,From,To');
    expect(lines[1]).toContain('SOL');
    expect(lines[1]).toContain('USDC');
  });

  it('should generate CSV without headers', () => {
    const trades = [createMockTrade()];
    const config: ExportConfig = {
      format: 'csv',
      preset: 'custom',
      columns: [
        { key: 'fromToken', label: 'From', enabled: true },
        { key: 'toToken', label: 'To', enabled: true },
      ],
      includeHeaders: false,
    };

    const csv = exportToCSV(trades, config);
    const lines = csv.trim().split('\n');

    expect(lines.length).toBe(1);
    expect(lines[0]).not.toBe('From,To');
  });

  it('should escape commas in values', () => {
    const trades = [createMockTrade({ fromToken: 'SOL,TEST' })];
    const config: ExportConfig = {
      format: 'csv',
      preset: 'custom',
      columns: [{ key: 'fromToken', label: 'From', enabled: true }],
      includeHeaders: false,
    };

    const csv = exportToCSV(trades, config);
    expect(csv).toContain('"SOL,TEST"');
  });

  it('should only include enabled columns', () => {
    const trades = [createMockTrade()];
    const config: ExportConfig = {
      format: 'csv',
      preset: 'custom',
      columns: [
        { key: 'fromToken', label: 'From', enabled: true },
        { key: 'toToken', label: 'To', enabled: false },
        { key: 'amount', label: 'Amount', enabled: true },
      ],
      includeHeaders: true,
    };

    const csv = exportToCSV(trades, config);
    const lines = csv.trim().split('\n');

    expect(lines[0]).toBe('From,Amount');
    expect(lines[0]).not.toContain('To');
  });
});

describe('exportToXLSX', () => {
  it('should generate XLSX data', () => {
    const trades = [createMockTrade()];
    const config: ExportConfig = {
      format: 'xlsx',
      preset: 'custom',
      columns: [
        { key: 'fromToken', label: 'From', enabled: true },
        { key: 'toToken', label: 'To', enabled: true },
      ],
      includeHeaders: true,
    };

    const xlsx = exportToXLSX(trades, config);
    expect(xlsx).toBeInstanceOf(ArrayBuffer);
    expect(xlsx.byteLength).toBeGreaterThan(0);
  });
});

describe('generateExportFilename', () => {
  it('should generate filename with preset name', () => {
    const config: ExportConfig = {
      format: 'csv',
      preset: 'tax_report',
      columns: [],
      includeHeaders: true,
    };

    const filename = generateExportFilename(config);
    expect(filename).toMatch(/tax_report_\d{4}-\d{2}-\d{2}_\d{6}\.csv/);
  });

  it('should generate filename with custom preset', () => {
    const config: ExportConfig = {
      format: 'xlsx',
      preset: 'custom',
      columns: [],
      includeHeaders: true,
    };

    const filename = generateExportFilename(config);
    expect(filename).toMatch(/trades_\d{4}-\d{2}-\d{2}_\d{6}\.xlsx/);
  });
});

import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import {
  EnhancedTradeMetrics,
  ExportConfig,
  ExportColumn,
  DEFAULT_EXPORT_COLUMNS,
  TAX_REPORT_COLUMNS,
  PERFORMANCE_COLUMNS,
  TRADE_JOURNAL_COLUMNS,
} from '../types/tradeReporting';
import { calculateExecutionQuality } from './tradeFilters';

export function getColumnsForPreset(preset: string): ExportColumn[] {
  const cloneColumns = (columns: ExportColumn[]) => columns.map(col => ({ ...col }));

  switch (preset) {
    case 'tax_report':
      return cloneColumns(TAX_REPORT_COLUMNS);
    case 'performance':
      return cloneColumns(PERFORMANCE_COLUMNS);
    case 'trade_journal':
      return cloneColumns(TRADE_JOURNAL_COLUMNS);
    case 'custom':
    default:
      return cloneColumns(DEFAULT_EXPORT_COLUMNS);
  }
}

export function formatTradeValue(
  trade: EnhancedTradeMetrics,
  key: keyof EnhancedTradeMetrics | 'executionQuality',
  timezone?: string
): string | number | boolean {
  if (key === 'executionQuality') {
    return calculateExecutionQuality(trade);
  }

  const value = trade[key as keyof EnhancedTradeMetrics];

  if (value === undefined || value === null) {
    return '';
  }

  if (key === 'timestamp') {
    const date = new Date(value as number);
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone || 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    return formatter.format(date);
  }

  if (key === 'slippage' || key === 'priceImpact' || key === 'pnlPercent') {
    return typeof value === 'number' ? value.toFixed(2) : value;
  }

  if (
    key === 'gasCost' ||
    key === 'mevSavings' ||
    key === 'executionPrice' ||
    key === 'expectedPrice' ||
    key === 'pnl'
  ) {
    return typeof value === 'number' ? value.toFixed(6) : value;
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  return value;
}

export function exportToCSV(trades: EnhancedTradeMetrics[], config: ExportConfig): string {
  const enabledColumns = config.columns.filter(col => col.enabled);

  let csv = '';

  if (config.includeHeaders) {
    csv += enabledColumns.map(col => col.label).join(',') + '\n';
  }

  trades.forEach(trade => {
    const row = enabledColumns
      .map(col => {
        const value = formatTradeValue(trade, col.key, config.timezone);
        const stringValue = String(value);

        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
      .join(',');
    csv += row + '\n';
  });

  return csv;
}

export function exportToXLSX(trades: EnhancedTradeMetrics[], config: ExportConfig): ArrayBuffer {
  const enabledColumns = config.columns.filter(col => col.enabled);

  const data: any[] = [];

  if (config.includeHeaders) {
    data.push(enabledColumns.map(col => col.label));
  }

  trades.forEach(trade => {
    const row = enabledColumns.map(col => formatTradeValue(trade, col.key, config.timezone));
    data.push(row);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(data);

  const columnWidths = enabledColumns.map(col => ({
    wch: Math.max(col.label.length, 20),
  }));
  worksheet['!cols'] = columnWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Trade History');

  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
}

export function downloadFile(content: string | ArrayBuffer, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateExportFilename(config: ExportConfig): string {
  const timestamp = format(new Date(), 'yyyy-MM-dd_HHmmss');
  const preset = config.preset === 'custom' ? 'trades' : config.preset;
  const extension = config.format === 'csv' ? 'csv' : 'xlsx';
  return `${preset}_${timestamp}.${extension}`;
}

export function exportTrades(trades: EnhancedTradeMetrics[], config: ExportConfig): void {
  const filename = generateExportFilename(config);

  if (config.format === 'csv') {
    const csv = exportToCSV(trades, config);
    downloadFile(csv, filename, 'text/csv');
  } else {
    const xlsx = exportToXLSX(trades, config);
    downloadFile(
      xlsx,
      filename,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
  }
}

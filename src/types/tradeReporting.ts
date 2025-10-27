import { OrderSide, OrderStatus } from './trading';

export interface EnhancedTradeMetrics {
  id: string;
  slippage: number;
  mevProtected: boolean;
  mevSavings?: number;
  gasCost: number;
  priorityFeeMicroLamports: number;
  priceImpact: number;
  timestamp: number;
  txSignature?: string;
  fromToken: string;
  toToken: string;
  amount: string;
  side: OrderSide;
  status: OrderStatus;
  pnl?: number;
  pnlPercent?: number;
  executionPrice?: number;
  expectedPrice?: number;
  walletAddress?: string;
  isPaperTrade?: boolean;
}

export interface TradeFilters {
  dateRange?: {
    start: Date | null;
    end: Date | null;
  };
  tokens?: string[];
  side?: OrderSide | 'all';
  status?: OrderStatus | 'all';
  pnlRange?: {
    min: number | null;
    max: number | null;
  };
  searchQuery?: string;
  walletAddress?: string;
  isPaperTrade?: boolean | 'all';
}

export type ExportFormat = 'csv' | 'xlsx';

export type ExportPreset = 'tax_report' | 'performance' | 'trade_journal' | 'custom';

export interface ExportColumn {
  key: keyof EnhancedTradeMetrics | 'executionQuality';
  label: string;
  enabled: boolean;
}

export interface ExportConfig {
  format: ExportFormat;
  preset: ExportPreset;
  columns: ExportColumn[];
  dateRange?: {
    start: Date | null;
    end: Date | null;
  };
  timezone?: string;
  includeHeaders: boolean;
  filters?: TradeFilters;
}

export type ScheduleCadence = 'daily' | 'weekly' | 'monthly' | 'custom';

export type DeliveryMethod = 'email' | 'webhook';

export interface DeliveryConfig {
  method: DeliveryMethod;
  email?: string;
  webhookUrl?: string;
}

export interface ExportSchedule {
  id: string;
  name: string;
  enabled: boolean;
  cadence: ScheduleCadence;
  customIntervalMinutes?: number;
  exportConfig: ExportConfig;
  deliveryConfig: DeliveryConfig;
  lastRun?: string;
  nextRun?: string;
  createdAt: string;
}

export const DEFAULT_EXPORT_COLUMNS: ExportColumn[] = [
  { key: 'timestamp', label: 'Date/Time', enabled: true },
  { key: 'txSignature', label: 'Transaction Signature', enabled: true },
  { key: 'fromToken', label: 'From Token', enabled: true },
  { key: 'toToken', label: 'To Token', enabled: true },
  { key: 'side', label: 'Side', enabled: true },
  { key: 'amount', label: 'Amount', enabled: true },
  { key: 'executionPrice', label: 'Execution Price', enabled: true },
  { key: 'expectedPrice', label: 'Expected Price', enabled: true },
  { key: 'slippage', label: 'Slippage %', enabled: true },
  { key: 'priceImpact', label: 'Price Impact %', enabled: true },
  { key: 'gasCost', label: 'Gas Cost (SOL)', enabled: true },
  { key: 'priorityFeeMicroLamports', label: 'Priority Fee', enabled: true },
  { key: 'pnl', label: 'P&L', enabled: true },
  { key: 'pnlPercent', label: 'P&L %', enabled: true },
  { key: 'status', label: 'Status', enabled: true },
  { key: 'mevProtected', label: 'MEV Protected', enabled: true },
  { key: 'mevSavings', label: 'MEV Savings', enabled: false },
  { key: 'executionQuality', label: 'Execution Quality', enabled: true },
  { key: 'walletAddress', label: 'Wallet Address', enabled: false },
  { key: 'isPaperTrade', label: 'Paper Trade', enabled: false },
];

export const TAX_REPORT_COLUMNS: ExportColumn[] = [
  { key: 'timestamp', label: 'Date/Time', enabled: true },
  { key: 'txSignature', label: 'Transaction Signature', enabled: true },
  { key: 'fromToken', label: 'From Token', enabled: true },
  { key: 'toToken', label: 'To Token', enabled: true },
  { key: 'amount', label: 'Amount', enabled: true },
  { key: 'executionPrice', label: 'Price', enabled: true },
  { key: 'gasCost', label: 'Gas Cost (SOL)', enabled: true },
  { key: 'pnl', label: 'P&L', enabled: true },
  { key: 'walletAddress', label: 'Wallet Address', enabled: true },
];

export const PERFORMANCE_COLUMNS: ExportColumn[] = [
  { key: 'timestamp', label: 'Date/Time', enabled: true },
  { key: 'fromToken', label: 'From Token', enabled: true },
  { key: 'toToken', label: 'To Token', enabled: true },
  { key: 'side', label: 'Side', enabled: true },
  { key: 'amount', label: 'Amount', enabled: true },
  { key: 'pnl', label: 'P&L', enabled: true },
  { key: 'pnlPercent', label: 'P&L %', enabled: true },
  { key: 'slippage', label: 'Slippage %', enabled: true },
  { key: 'priceImpact', label: 'Price Impact %', enabled: true },
  { key: 'executionQuality', label: 'Execution Quality', enabled: true },
  { key: 'status', label: 'Status', enabled: true },
];

export const TRADE_JOURNAL_COLUMNS: ExportColumn[] = [
  { key: 'timestamp', label: 'Date/Time', enabled: true },
  { key: 'txSignature', label: 'Transaction Signature', enabled: true },
  { key: 'fromToken', label: 'From Token', enabled: true },
  { key: 'toToken', label: 'To Token', enabled: true },
  { key: 'side', label: 'Side', enabled: true },
  { key: 'amount', label: 'Amount', enabled: true },
  { key: 'executionPrice', label: 'Execution Price', enabled: true },
  { key: 'slippage', label: 'Slippage %', enabled: true },
  { key: 'priceImpact', label: 'Price Impact %', enabled: true },
  { key: 'gasCost', label: 'Gas Cost', enabled: true },
  { key: 'pnl', label: 'P&L', enabled: true },
  { key: 'pnlPercent', label: 'P&L %', enabled: true },
  { key: 'executionQuality', label: 'Execution Quality', enabled: true },
  { key: 'mevProtected', label: 'MEV Protected', enabled: true },
  { key: 'status', label: 'Status', enabled: true },
];

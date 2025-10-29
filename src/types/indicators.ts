export interface VolumeProfileLevel {
  price: number;
  volume: number;
  buyVolume: number;
  sellVolume: number;
  delta: number;
}

export interface VolumeProfileData {
  levels: VolumeProfileLevel[];
  poc: number; // Point of Control
  valueAreaHigh: number;
  valueAreaLow: number;
  vwap: number;
  vwapBandUpper: number;
  vwapBandLower: number;
}

export interface OrderBookDepthData {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number;
  spreadPercent: number;
  midPrice: number;
  imbalance: number; // bid volume / ask volume ratio
  totalBidVolume: number;
  totalAskVolume: number;
}

export interface OrderBookLevel {
  price: number;
  amount: number;
  total: number; // cumulative
  percentage: number; // percentage of total volume
}

export interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  buyVolume?: number;
  sellVolume?: number;
}

export type IndicatorType = 
  | 'sma' 
  | 'ema' 
  | 'rsi' 
  | 'macd' 
  | 'bollinger' 
  | 'volume' 
  | 'custom';

export interface IndicatorNode {
  id: string;
  type: 'indicator' | 'operator' | 'constant' | 'condition';
  value?: string | number;
  indicator?: IndicatorType;
  params?: Record<string, number>;
  operator?: '+' | '-' | '*' | '/' | '>' | '<' | '==' | '&&' | '||';
  inputs?: string[]; // references to other node IDs
}

export interface CustomIndicator {
  id: string;
  name: string;
  description: string;
  nodes: IndicatorNode[];
  outputNodeId: string;
  createdAt: number;
  updatedAt: number;
  author?: string;
  tags?: string[];
}

export interface IndicatorValue {
  timestamp: number;
  value: number;
}

export interface BacktestResult {
  indicator: CustomIndicator;
  signals: Array<{
    timestamp: number;
    type: 'buy' | 'sell';
    price: number;
    value: number;
  }>;
  performance: {
    totalTrades: number;
    profitableTrades: number;
    totalReturn: number;
    maxDrawdown: number;
    sharpeRatio: number;
  };
}

export interface ChartLayout {
  id: string;
  name: string;
  grid: {
    rows: number;
    cols: number;
  };
  panels: ChartPanelConfig[];
  syncCrosshair: boolean;
  syncTimeframe: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ChartPanelConfig {
  id: string;
  symbol: string;
  timeframe: string;
  indicators: string[]; // IDs of active indicators
  showVolumeProfile: boolean;
  showOrderBook: boolean;
  position: {
    row: number;
    col: number;
    width: number;
    height: number;
  };
}

export interface MultiChartState {
  activeLayout: string | null;
  layouts: ChartLayout[];
  crosshairPosition: { x: number; y: number; timestamp: number } | null;
  globalTimeframe: string;
}

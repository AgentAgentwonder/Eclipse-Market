export type IndicatorType =
  | 'SMA'
  | 'EMA'
  | 'RSI'
  | 'MACD'
  | 'BollingerBands'
  | 'Stochastic'
  | 'ATR'
  | 'OBV'
  | 'CCI'
  | 'Williams'
  | 'MFI'
  | 'ParabolicSAR'
  | 'Ichimoku'
  | 'VWAP'
  | 'ADX'
  | 'Aroon'
  | 'KeltnerChannels'
  | 'DonchianChannels'
  | 'SMA_Cross'
  | 'EMA_Cross';

export type IndicatorPanel = 'overlay' | 'separate';

export interface IndicatorConfig {
  id: string;
  type: IndicatorType;
  enabled: boolean;
  panel: IndicatorPanel;
  params: Record<string, number | string | boolean>;
  color?: string;
  lineWidth?: number;
  style?: 'solid' | 'dashed' | 'dotted';
  visible?: boolean;
}

export interface IndicatorPreset {
  id: string;
  name: string;
  description?: string;
  indicators: IndicatorConfig[];
  createdAt: string;
  updatedAt: string;
}

export interface IndicatorAlert {
  id: string;
  indicatorId: string;
  condition: 'above' | 'below' | 'crosses_above' | 'crosses_below';
  threshold: number;
  enabled: boolean;
  notificationChannels: ('app' | 'email' | 'webhook' | 'telegram' | 'discord')[];
}

export interface IndicatorValue {
  timestamp: number;
  value: number | null;
  signal?: 'buy' | 'sell' | 'neutral';
  metadata?: Record<string, number | null>;
}

export const DEFAULT_INDICATOR_PARAMS: Record<IndicatorType, Record<string, number | string>> = {
  SMA: { period: 20 },
  EMA: { period: 20 },
  RSI: { period: 14 },
  MACD: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
  BollingerBands: { period: 20, stdDev: 2 },
  Stochastic: { kPeriod: 14, dPeriod: 3 },
  ATR: { period: 14 },
  OBV: {},
  CCI: { period: 20 },
  Williams: { period: 14 },
  MFI: { period: 14 },
  ParabolicSAR: { acceleration: 0.02, maximum: 0.2 },
  Ichimoku: { conversion: 9, base: 26, span: 52, displacement: 26 },
  VWAP: {},
  ADX: { period: 14 },
  Aroon: { period: 25 },
  KeltnerChannels: { period: 20, atrPeriod: 10, multiplier: 2 },
  DonchianChannels: { period: 20 },
  SMA_Cross: { fastPeriod: 10, slowPeriod: 30 },
  EMA_Cross: { fastPeriod: 12, slowPeriod: 26 },
};

export const INDICATOR_DESCRIPTIONS: Record<IndicatorType, string> = {
  SMA: 'Simple Moving Average - Average price over a period',
  EMA: 'Exponential Moving Average - Weighted average giving more importance to recent prices',
  RSI: 'Relative Strength Index - Momentum oscillator measuring speed and magnitude of price changes',
  MACD: 'Moving Average Convergence Divergence - Trend-following momentum indicator',
  BollingerBands: 'Bollinger Bands - Volatility bands placed above and below a moving average',
  Stochastic: 'Stochastic Oscillator - Momentum indicator comparing closing price to price range',
  ATR: 'Average True Range - Volatility indicator',
  OBV: 'On-Balance Volume - Volume-based indicator',
  CCI: 'Commodity Channel Index - Momentum-based oscillator',
  Williams: 'Williams %R - Momentum indicator showing overbought/oversold levels',
  MFI: 'Money Flow Index - Volume-weighted RSI',
  ParabolicSAR: 'Parabolic SAR - Trend-following indicator providing entry and exit points',
  Ichimoku: 'Ichimoku Cloud - Comprehensive indicator showing support, resistance, and momentum',
  VWAP: 'Volume Weighted Average Price - Average price weighted by volume',
  ADX: 'Average Directional Index - Trend strength indicator',
  Aroon: 'Aroon Indicator - Identifies trend changes and strength',
  KeltnerChannels: 'Keltner Channels - Volatility-based envelopes',
  DonchianChannels: 'Donchian Channels - Highest high and lowest low over a period',
  SMA_Cross: 'SMA Crossover - Buy/sell signals when fast SMA crosses slow SMA',
  EMA_Cross: 'EMA Crossover - Buy/sell signals when fast EMA crosses slow EMA',
};

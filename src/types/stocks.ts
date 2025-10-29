export interface TrendingStock {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  percentChange24h: number;
  volume: number;
  volumeChange24h: number;
  unusualVolume: boolean;
  marketCap?: number;
  avgVolume: number;
  reason?: string;
}

export interface TopMover {
  symbol: string;
  name: string;
  price: number;
  change: number;
  percentChange: number;
  volume: number;
  marketCap?: number;
  direction: 'gainer' | 'loser';
  session: 'regular' | 'premarket' | 'afterhours';
  technicalIndicators: TechnicalIndicators;
  reason: string;
}

export interface TechnicalIndicators {
  rsi?: number;
  macd?: string;
  volumeRatio: number;
  momentum?: string;
}

export interface NewIPO {
  symbol: string;
  name: string;
  ipoDate: string;
  offerPrice: number;
  currentPrice?: number;
  percentChange?: number;
  sharesOffered?: number;
  marketCap?: number;
  exchange: string;
  status: 'upcoming' | 'today' | 'recent' | 'filed';
}

export interface EarningsEvent {
  symbol: string;
  name: string;
  date: string;
  time: 'beforemarket' | 'aftermarket' | 'duringmarket';
  fiscalQuarter: string;
  estimateEps?: number;
  actualEps?: number;
  surprisePercent?: number;
  historicalReaction?: HistoricalReaction;
  hasAlert: boolean;
}

export interface HistoricalReaction {
  avgMovePercent: number;
  lastReactionPercent: number;
  beatMissRatio: string;
}

export interface StockNews {
  id: string;
  symbol: string;
  title: string;
  summary: string;
  aiSummary?: string;
  url: string;
  source: string;
  publishedAt: string;
  sentiment: 'bullish' | 'neutral' | 'bearish';
  impactLevel: 'high' | 'medium' | 'low';
  topics: string[];
}

export interface InstitutionalHolding {
  symbol: string;
  institutionName: string;
  shares: number;
  value: number;
  percentOfPortfolio: number;
  changeShares: number;
  changePercent: number;
  quarter: string;
  isWhale: boolean;
}

export interface InsiderActivity {
  symbol: string;
  insiderName: string;
  insiderTitle: string;
  transactionType: 'buy' | 'sell' | 'option' | 'gift';
  shares: number;
  price: number;
  value: number;
  transactionDate: string;
  filingDate: string;
  isSignificant: boolean;
}

export interface StockAlert {
  id: string;
  symbol: string;
  alertType: 'earningsUpcoming' | 'unusualVolume' | 'significantMove' | 'whaleActivity' | 'insiderActivity' | 'newIPO';
  message: string;
  triggeredAt: string;
  data: any;
}

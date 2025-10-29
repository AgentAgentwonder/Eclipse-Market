export interface Trade {
  id: string;
  walletAddress: string;
  tokenMint: string;
  tokenSymbol: string;
  side: 'buy' | 'sell';
  amount: number;
  price: number;
  totalValue: number;
  fee: number;
  txSignature: string;
  timestamp: string;
  pnl?: number;
  holdDurationSeconds?: number;
}

export interface PerformanceScore {
  id: number;
  walletAddress: string;
  score: number;
  winRate: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalProfit: number;
  totalLoss: number;
  netPnl: number;
  avgProfitPerTrade: number;
  avgLossPerTrade: number;
  profitFactor: number;
  sharpeRatio: number;
  consistencyScore: number;
  avgHoldDurationSeconds: number;
  bestTradePnl: number;
  worstTradePnl: number;
  calculatedAt: string;
}

export interface TokenPerformance {
  tokenMint: string;
  tokenSymbol: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  netPnl: number;
  totalVolume: number;
  avgHoldDurationSeconds: number;
  bestTradePnl: number;
  worstTradePnl: number;
}

export interface TimingAnalysis {
  hourOfDay: number;
  dayOfWeek: number;
  tradesCount: number;
  avgPnl: number;
  winRate: number;
}

export interface BestWorstTrades {
  bestTrades: Trade[];
  worstTrades: Trade[];
}

export interface BenchmarkComparison {
  walletScore: number;
  marketAvgScore: number;
  percentile: number;
  rank: number;
  totalWallets: number;
}

export interface ScoreAlert {
  id: number;
  walletAddress: string;
  oldScore: number;
  newScore: number;
  changePercent: number;
  reason: string;
  createdAt: string;
}

export interface WalletPerformanceData {
  score: PerformanceScore;
  scoreHistory: PerformanceScore[];
  tokenPerformance: TokenPerformance[];
  timingAnalysis: TimingAnalysis[];
  bestWorst: BestWorstTrades;
  benchmark?: BenchmarkComparison;
}

export interface RecordTradeRequest {
  walletAddress: string;
  tokenMint: string;
  tokenSymbol: string;
  side: 'buy' | 'sell';
  amount: number;
  price: number;
  fee: number;
  txSignature: string;
}

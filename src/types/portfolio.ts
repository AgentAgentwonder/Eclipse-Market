export interface Position {
  symbol: string;
  mint: string;
  amount: number;
  currentPrice: number;
  avgEntryPrice: number;
  totalValue: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  allocation: number;
}

export interface PortfolioMetrics {
  totalValue: number;
  dailyPnl: number;
  dailyPnlPercent: number;
  weeklyPnl: number;
  weeklyPnlPercent: number;
  monthlyPnl: number;
  monthlyPnlPercent: number;
  allTimePnl: number;
  allTimePnlPercent: number;
  realizedPnl: number;
  unrealizedPnl: number;
  lastUpdated: string;
}

export interface AllocationTarget {
  symbol: string;
  targetPercent: number;
}

export interface RebalanceProfile {
  id: string;
  name: string;
  targets: AllocationTarget[];
  deviationTriggerPercent: number;
  timeIntervalHours?: number;
  enabled: boolean;
}

export interface RebalanceAction {
  symbol: string;
  mint: string;
  currentPercent: number;
  targetPercent: number;
  deviation: number;
  action: 'buy' | 'sell';
  amount: number;
  estimatedValue: number;
}

export interface RebalanceHistory {
  id: string;
  profileId: string;
  actions: RebalanceAction[];
  triggerType: 'deviation' | 'time';
  executed: boolean;
  executedAt?: string;
  createdAt: string;
}

export interface TaxLot {
  id: string;
  symbol: string;
  mint: string;
  amount: number;
  costBasis: number;
  pricePerUnit: number;
  acquiredAt: string;
  disposedAmount?: number;
  disposedAt?: string;
  realizedGain?: number;
}

export type LotStrategy = 'FIFO' | 'LIFO' | 'HIFO' | 'SPECIFIC';

export interface TaxReport {
  taxYear: number;
  lots: TaxLot[];
  totalRealizedGains: number;
  totalRealizedLosses: number;
  netGainLoss: number;
  shortTermGains: number;
  longTermGains: number;
  strategy: LotStrategy;
  generatedAt: string;
}

export interface TaxLossHarvestingSuggestion {
  symbol: string;
  mint: string;
  lot: TaxLot;
  currentPrice: number;
  unrealizedLoss: number;
  potentialTaxSavings: number;
  daysHeld: number;
}

export interface PositionSizeInput {
  accountSize: number;
  riskPercent: number;
  entryPrice: number;
  stopLossPrice: number;
  leverage?: number;
}

export interface PositionSizeResult {
  positionSize: number;
  positionValue: number;
  riskAmount: number;
  units: number;
  kellyFraction?: number;
}

export interface RiskRewardInput {
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  positionSize: number;
  winRate?: number;
}

export interface RiskRewardResult {
  riskAmount: number;
  rewardAmount: number;
  riskRewardRatio: number;
  expectedValue?: number;
  breakEvenWinRate: number;
}

export type RiskProfile = 'conservative' | 'moderate' | 'aggressive' | 'custom';

export interface RiskProfilePreset {
  name: string;
  riskPercent: number;
  maxPositionSize: number;
  minRiskRewardRatio: number;
}

export interface UserRiskProfile {
  profile: RiskProfile;
  investmentHorizon: 'short' | 'medium' | 'long';
  goals: string[];
  constraints: string[];
  riskTolerance: number;
  customSettings?: {
    maxDrawdown: number;
    targetReturn: number;
    maxPositionSize: number;
  };
}

export interface AllocationRecommendation {
  symbol: string;
  mint: string;
  targetPercent: number;
  currentPercent: number;
  action: 'buy' | 'sell' | 'hold';
  amount: number;
  estimatedValue: number;
  reasoning: string;
}

export interface PortfolioRecommendation {
  id: string;
  timestamp: string;
  riskProfile: RiskProfile;
  allocations: AllocationRecommendation[];
  expectedReturn: number;
  expectedRisk: number;
  sharpeRatio: number;
  diversificationScore: number;
  factors: RecommendationFactor[];
  status: 'pending' | 'applied' | 'rejected';
  appliedAt?: string;
}

export interface RecommendationFactor {
  name: string;
  impact: number;
  description: string;
}

export interface PerformanceComparison {
  recommendationId: string;
  baselineReturn: number;
  actualReturn: number;
  baselineRisk: number;
  actualRisk: number;
  outperformance: number;
  periodDays: number;
  timestamp: string;
}

export interface WeeklyUpdate {
  id: string;
  timestamp: string;
  portfolioValue: number;
  weeklyReturn: number;
  recommendations: PortfolioRecommendation[];
  marketCommentary: string;
  riskMetrics: {
    sharpeRatio: number;
    volatility: number;
    maxDrawdown: number;
    beta: number;
  };
}

// Portfolio Analytics Types

export interface CorrelationMatrix {
  symbols: string[];
  matrix: number[][];
  calculatedAt: string;
}

export interface DiversificationMetrics {
  score: number;
  effectiveN: number;
  avgCorrelation: number;
  concentrationRisk: number;
}

export interface RiskConcentration {
  symbol: string;
  allocation: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
}

export interface SharpeMetrics {
  sharpeRatio: number;
  annualizedReturn: number;
  annualizedVolatility: number;
  riskFreeRate: number;
}

export interface FactorExposure {
  name: string;
  beta: number;
  exposure: number;
}

export interface FactorAnalysis {
  factors: FactorExposure[];
  marketBeta: number;
  systematicRisk: number;
  specificRisk: number;
}

export interface PortfolioAnalytics {
  correlation: CorrelationMatrix;
  diversification: DiversificationMetrics;
  concentration: RiskConcentration[];
  sharpe: SharpeMetrics;
  factors: FactorAnalysis;
  calculatedAt: string;
}

export interface SectorAllocation {
  sector: string;
  allocation: number;
  value: number;
  symbols: string[];
}

export interface ConcentrationAlert {
  id: string;
  symbol: string;
  allocation: number;
  severity: 'warning' | 'critical';
  message: string;
  threshold: number;
  createdAt: string;
}

export interface PricePoint {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SignalSource {
  type: 'indicator' | 'ai_prediction' | 'alert' | 'custom';
  id: string;
  weight: number; // 0-1
  enabled: boolean;
  config?: Record<string, any>;
}

export interface RiskControls {
  maxPositionSize: number; // percentage of capital
  maxDailyLoss: number; // percentage
  maxDrawdown: number; // percentage
  maxOpenPositions: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  trailingStopPercent?: number;
}

export interface PositionSizingConfig {
  method: 'fixed' | 'kelly' | 'risk_parity' | 'volatility_based';
  fixedPercent?: number; // for fixed method
  kellyFraction?: number; // for kelly criterion (0-1)
  targetVolatility?: number; // for volatility-based
}

export interface TradingStrategy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  signalSources: SignalSource[];
  combinationLogic: 'all' | 'any' | 'majority' | 'weighted';
  weightThreshold?: number; // for weighted logic
  positionSizing: PositionSizingConfig;
  riskControls: RiskControls;
  allowedSymbols: string[]; // empty = all
  createdAt: number;
  updatedAt: number;
}

export interface StrategyExecution {
  id: string;
  strategyId: string;
  strategyName: string;
  status: 'running' | 'paused' | 'stopped' | 'error';
  startedAt: number;
  stoppedAt?: number;
  tradesExecuted: number;
  totalPnL: number;
  totalPnLPercent: number;
  winRate: number;
  currentDrawdown: number;
  dailyPnL: number;
  lastError?: string;
}

export interface BacktestConfig {
  strategyId: string;
  symbol: string;
  startDate: number; // timestamp
  endDate: number; // timestamp
  initialCapital: number;
  commissionRate: number; // percentage
  slippageRate: number; // percentage
  dataInterval: '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
}

export interface Trade {
  timestamp: number;
  side: 'buy' | 'sell';
  symbol: string;
  price: number;
  quantity: number;
  value: number;
  commission: number;
  slippage: number;
  signal?: string;
}

export interface BacktestMetrics {
  totalReturn: number;
  totalReturnPercent: number;
  annualizedReturn: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  averageTradeDuration: number; // in milliseconds
  exposureTime: number; // percentage of time with open positions
}

export interface EquityPoint {
  timestamp: number;
  equity: number;
  drawdown: number;
  drawdownPercent: number;
}

export interface BacktestResult {
  id: string;
  config: BacktestConfig;
  metrics: BacktestMetrics;
  trades: Trade[];
  equityCurve: EquityPoint[];
  startedAt: number;
  completedAt: number;
  duration: number; // milliseconds
}

export interface OptimizationParameter {
  name: string;
  min: number;
  max: number;
  step: number;
  currentValue: number;
}

export interface OptimizationConfig {
  strategyId: string;
  backtestConfig: Omit<BacktestConfig, 'strategyId'>;
  parameters: OptimizationParameter[];
  method: 'genetic' | 'grid' | 'random' | 'monte_carlo';
  
  // For genetic algorithm
  populationSize?: number;
  generations?: number;
  mutationRate?: number;
  crossoverRate?: number;
  
  // For Monte Carlo / random search
  iterations?: number;
  
  optimizationTarget: 'sharpe_ratio' | 'total_return' | 'win_rate' | 'profit_factor' | 'sortino_ratio';
  maxDrawdownConstraint?: number; // max acceptable drawdown percentage
}

export interface OptimizationResult {
  parameterSet: Record<string, number>;
  metrics: BacktestMetrics;
  score: number; // based on optimization target
  rank: number;
}

export interface OptimizationRun {
  id: string;
  config: OptimizationConfig;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  results: OptimizationResult[];
  bestResult?: OptimizationResult;
  startedAt: number;
  completedAt?: number;
  error?: string;
}

export interface SensitivityAnalysis {
  parameterName: string;
  values: number[];
  metrics: BacktestMetrics[];
}

export interface AutoTradingState {
  strategies: TradingStrategy[];
  executions: Map<string, StrategyExecution>;
  backtestResults: BacktestResult[];
  optimizationRuns: OptimizationRun[];
  isKillSwitchActive: boolean;
}

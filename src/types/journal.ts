export type EntryType = 'pre_trade' | 'in_trade' | 'post_trade' | 'reflection' | 'goal' | 'mistake';

export type Emotion =
  | 'confident'
  | 'anxious'
  | 'excited'
  | 'fearful'
  | 'greedy'
  | 'patient'
  | 'impatient'
  | 'calm'
  | 'stressed'
  | 'euphoric'
  | 'regretful'
  | 'neutral';

export type MarketTrend = 'strong_bullish' | 'bullish' | 'neutral' | 'bearish' | 'strong_bearish';

export type Volatility = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';

export type VolumeLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';

export type BiasType =
  | 'confirmation_bias'
  | 'anchoring_bias'
  | 'recency_bias'
  | 'overconfidence_bias'
  | 'loss_aversion'
  | 'gamblers_fallacy'
  | 'herd_mentality'
  | 'sunk_cost_fallacy';

export interface EmotionTracking {
  primary_emotion: Emotion;
  intensity: number;
  secondary_emotions: Emotion[];
  stress_level: number;
  clarity_level: number;
  fomo_level: number;
  revenge_trading: boolean;
  discipline_score: number;
}

export interface MarketConditions {
  trend: MarketTrend;
  volatility: Volatility;
  volume: VolumeLevel;
  news_sentiment: number;
  notes: string;
}

export interface TradeOutcome {
  pnl: number;
  pnl_percent: number;
  success: boolean;
  followed_plan: boolean;
  risk_reward_ratio: number;
}

export interface JournalEntry {
  id: string;
  timestamp: number;
  trade_id?: string;
  entry_type: EntryType;
  strategy_tags: string[];
  emotions: EmotionTracking;
  notes: string;
  market_conditions: MarketConditions;
  confidence_level: number;
  position_size?: number;
  entry_price?: number;
  exit_price?: number;
  outcome?: TradeOutcome;
  lessons_learned?: string;
  attachments: string[];
  created_at: number;
  updated_at: number;
}

export interface JournalFilters {
  date_range?: {
    start: number;
    end: number;
  };
  entry_types?: EntryType[];
  strategy_tags?: string[];
  emotions?: Emotion[];
  min_confidence?: number;
  max_confidence?: number;
  outcome_success?: boolean;
  search_query?: string;
}

export interface EmotionBreakdown {
  emotion_counts: Record<string, number>;
  average_stress: number;
  average_clarity: number;
  average_fomo: number;
  revenge_trading_instances: number;
}

export interface DisciplineMetrics {
  average_discipline_score: number;
  plan_adherence_rate: number;
  impulsive_trades: number;
  patient_trades: number;
  stop_loss_adherence: number;
}

export interface PatternInsight {
  pattern_type: string;
  description: string;
  frequency: number;
  impact_on_performance: number;
  recommendation: string;
}

export interface StrategyPerformance {
  strategy_tag: string;
  trades_count: number;
  win_rate: number;
  average_pnl: number;
  average_confidence: number;
  common_emotions: string[];
}

export interface PsychologicalInsights {
  dominant_emotions: string[];
  stress_correlation_with_loss: number;
  confidence_correlation_with_win: number;
  fomo_impact: number;
  best_mental_state: string;
  worst_mental_state: string;
  cognitive_biases_detected: string[];
}

export interface WeeklyReport {
  id: string;
  week_start: number;
  week_end: number;
  total_entries: number;
  trades_taken: number;
  trades_won: number;
  trades_lost: number;
  win_rate: number;
  total_pnl: number;
  average_confidence: number;
  emotion_breakdown: EmotionBreakdown;
  discipline_metrics: DisciplineMetrics;
  pattern_insights: PatternInsight[];
  strategy_performance: StrategyPerformance[];
  psychological_insights: PsychologicalInsights;
  recommendations: string[];
  created_at: number;
}

export interface DisciplineTrendPoint {
  timestamp: number;
  score: number;
}

export interface CognitiveBias {
  bias_type: BiasType;
  severity: number;
  instances: number;
  description: string;
  mitigation_strategy: string;
}

export interface GrowthIndicators {
  improvement_rate: number;
  consistency_improvement: number;
  emotional_control_improvement: number;
  strategy_refinement_score: number;
}

export interface BehavioralAnalytics {
  total_entries: number;
  consistency_score: number;
  emotional_volatility: number;
  discipline_trend: DisciplineTrendPoint[];
  win_rate_by_emotion: Record<string, number>;
  best_trading_hours: number[];
  cognitive_biases: CognitiveBias[];
  growth_indicators: GrowthIndicators;
}

export interface StrategyUsage {
  tag: string;
  count: number;
  win_rate: number;
}

export interface EmotionUsage {
  emotion: string;
  count: number;
  percentage: number;
}

export interface JournalStats {
  total_entries: number;
  entries_this_week: number;
  entries_this_month: number;
  total_trades_logged: number;
  average_entries_per_week: number;
  most_used_strategies: StrategyUsage[];
  most_common_emotions: EmotionUsage[];
  overall_discipline_score: number;
}

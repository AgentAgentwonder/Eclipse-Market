export interface SmartMoneyWallet {
  id: string;
  wallet_address: string;
  label?: string;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  total_pnl: number;
  avg_hold_time_hours: number;
  smart_money_score: number;
  is_smart_money: boolean;
  first_seen: string;
  last_updated: string;
}

export interface SmartMoneyMetrics {
  total_trades: number;
  win_rate: number;
  avg_profit_per_trade: number;
  sharpe_ratio?: number;
  max_drawdown?: number;
}

export interface SmartMoneyClassification {
  wallet_address: string;
  is_smart_money: boolean;
  score: number;
  reason: string;
  metrics: SmartMoneyMetrics;
}

export interface SmartMoneyConsensus {
  token_mint: string;
  token_symbol?: string;
  action: string;
  smart_wallets_count: number;
  total_volume_usd: number;
  avg_price: number;
  consensus_strength: number;
  first_seen: string;
  last_updated: string;
}

export interface WhaleAlert {
  id: string;
  wallet_address: string;
  wallet_label?: string;
  activity_id: string;
  tx_signature: string;
  action_type: string;
  token_symbol?: string;
  amount_usd: number;
  threshold: number;
  alert_sent: boolean;
  timestamp: string;
}

export interface SentimentComparison {
  token_mint: string;
  token_symbol?: string;
  smart_money_sentiment: number;
  retail_sentiment: number;
  divergence: number;
  smart_money_volume: number;
  retail_volume: number;
  timestamp: string;
}

export type AlertType = 'whale_transaction' | 'smart_money_buy' | 'smart_money_sell' | 'smart_money_consensus';

export interface AlertConfig {
  id: string;
  alert_type: AlertType;
  enabled: boolean;
  threshold?: number;
  push_enabled: boolean;
  email_enabled: boolean;
  telegram_enabled: boolean;
  telegram_config_id?: string;
}

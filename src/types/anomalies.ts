export interface PriceData {
  timestamp: number;
  price: number;
  volume: number;
}

export interface TransactionData {
  timestamp: number;
  from: string;
  to: string;
  amount: number;
  price: number;
}

export interface Anomaly {
  id: string;
  token_address: string;
  anomaly_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical' | string;
  timestamp: number;
  value: number;
  threshold: number;
  explanation: string;
  details: Record<string, string>;
  is_active: boolean;
}

export interface AnomalyDetectionConfig {
  enabled: boolean;
  zscore_threshold: number;
  iqr_multiplier: number;
  wash_trading_threshold: number;
  min_data_points: number;
  notification_channels: string[];
}

export interface AnomalyStatistics {
  token_address: string;
  total_anomalies: number;
  active_anomalies: number;
  by_type: Record<string, number>;
  by_severity: Record<string, number>;
}

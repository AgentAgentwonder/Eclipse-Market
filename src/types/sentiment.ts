export interface SentimentResult {
  score: number;
  label: 'positive' | 'negative' | 'neutral';
  confidence: number;
}

export interface SocialPost {
  id: string;
  text: string;
  source: 'twitter' | 'reddit' | string;
  author: string;
  timestamp: number;
  sentiment: SentimentResult;
  engagement: number;
}

export interface SentimentDataPoint {
  timestamp: number;
  score: number;
  mentions: number;
}

export interface TokenSentiment {
  token: string;
  token_address: string;
  current_score: number;
  label: 'positive' | 'negative' | 'neutral';
  confidence: number;
  trend: SentimentDataPoint[];
  sample_posts: SocialPost[];
  total_mentions: number;
  positive_count: number;
  negative_count: number;
  neutral_count: number;
  last_updated: number;
}

export interface SentimentAlert {
  id: string;
  token: string;
  token_address: string;
  alert_type: string;
  message: string;
  score: number;
  threshold: number;
  timestamp: number;
  is_active: boolean;
}

export interface SentimentAlertConfig {
  enabled: boolean;
  positive_threshold: number;
  negative_threshold: number;
  spike_threshold: number;
  notification_channels: string[];
}

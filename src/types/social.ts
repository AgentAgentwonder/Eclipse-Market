export type SocialPlatform = 'twitter' | 'reddit' | 'telegram' | 'discord';

export interface Influencer {
  id: string;
  name: string;
  platform: SocialPlatform;
  handle: string;
  followerCount: number;
  verified: boolean;
  influenceScore: number;
  active: boolean;
  tags: string[];
  addedAt: number;
}

export interface EngagementMetrics {
  likes: number;
  retweets: number;
  replies: number;
  views: number;
}

export interface SocialMention {
  id: string;
  platform: SocialPlatform;
  author: string;
  authorId: string;
  content: string;
  tokenAddress?: string;
  tokenSymbol?: string;
  timestamp: number;
  engagement: EngagementMetrics;
  sentimentScore: number;
  sentimentLabel: string;
  influencerId?: string;
  url: string;
}

export interface SentimentDataPoint {
  timestamp: number;
  score: number;
  mentions: number;
}

export interface VolumeDataPoint {
  timestamp: number;
  volume: number;
}

export interface TrendData {
  tokenAddress: string;
  tokenSymbol: string;
  mentionCount: number;
  velocity: number;
  acceleration: number;
  sentimentTrend: SentimentDataPoint[];
  volumeTrend: VolumeDataPoint[];
  peakTime?: number;
  currentRank: number;
  rankChange: number;
  detectedAt: number;
}

export type BehaviorPattern =
  | 'accumulator'
  | 'distributor'
  | 'trader'
  | 'hodler'
  | 'manipulator';

export type WhaleRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface TokenHolding {
  tokenAddress: string;
  tokenSymbol: string;
  amount: number;
  valueUsd: number;
  percentage: number;
}

export interface WhaleWallet {
  address: string;
  label?: string;
  balance: number;
  tokenHoldings: TokenHolding[];
  behaviorPattern: BehaviorPattern;
  lastActivity: number;
  clusterId?: string;
  riskLevel: WhaleRiskLevel;
  following: boolean;
}

export type MovementType =
  | 'buy'
  | 'sell'
  | 'transfer'
  | 'stake_unstake'
  | 'liquidity_add'
  | 'liquidity_remove';

export interface WhaleMovement {
  id: string;
  walletAddress: string;
  transactionHash: string;
  tokenAddress: string;
  tokenSymbol: string;
  amount: number;
  valueUsd: number;
  movementType: MovementType;
  fromAddress?: string;
  toAddress?: string;
  timestamp: number;
  impactScore: number;
  sentimentShift?: number;
}

export type SocialAlertType =
  | 'influencer_mention'
  | 'trending_token'
  | 'sentiment_spike'
  | 'whale_movement'
  | 'fomo_alert'
  | 'fud_alert'
  | 'volume_spike'
  | 'coordinated_activity';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface SocialAlert {
  id: string;
  alertType: SocialAlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  tokenAddress?: string;
  tokenSymbol?: string;
  influencerId?: string;
  whaleAddress?: string;
  metadata: Record<string, unknown>;
  timestamp: number;
  acknowledged: boolean;
}

export interface GaugeFactor {
  factorType: string;
  impact: number;
  description: string;
}

export interface FomoFudGauge {
  tokenAddress: string;
  tokenSymbol: string;
  fomoScore: number;
  fudScore: number;
  netSentiment: number;
  confidence: number;
  contributingFactors: GaugeFactor[];
  lastUpdated: number;
}

export interface WhaleBehaviorInsight {
  walletAddress: string;
  insightType:
    | 'pattern_change'
    | 'new_position'
    | 'exited_position'
    | 'accumulation_phase'
    | 'distribution_phase'
    | 'risk_increase'
    | 'opportunity_detected';
  title: string;
  description: string;
  confidence: number;
  supportingData: string[];
  timestamp: number;
}

export interface SocialMomentum {
  tokenAddress: string;
  tokenSymbol: string;
  momentumScore: number;
  sentimentScore: number;
  volumeScore: number;
  influencerScore: number;
  whaleScore: number;
  trendingRank?: number;
  timestamp: number;
}

export interface WalletFollowEvent {
  walletAddress: string;
  title: string;
  description: string;
  impact: number;
  timestamp: number;
  tokens: string[];
  action: MovementType;
}

export interface ApiRateLimitStatus {
  source: string;
  limit?: number;
  remaining?: number;
  resetAt?: number;
  lastError?: string;
}

export interface SocialDashboardSnapshot {
  generatedAt: number;
  mentions: SocialMention[];
  topInfluencers: Influencer[];
  sentimentGauges: FomoFudGauge[];
  momentum: SocialMomentum[];
  trendData: TrendData[];
  whaleMovements: WhaleMovement[];
  whaleInsights: WhaleBehaviorInsight[];
  walletsYouFollow: WalletFollowEvent[];
  alerts: SocialAlert[];
  rateLimitStatus: ApiRateLimitStatus[];
}

export interface SocialConfig {
  enabledPlatforms: SocialPlatform[];
  twitterBearerToken?: string;
  redditClientId?: string;
  redditClientSecret?: string;
  updateIntervalSeconds: number;
  alertThresholds: {
    sentimentSpike: number;
    volumeSpike: number;
    whaleMovementUsd: number;
    fomoThreshold: number;
    fudThreshold: number;
  };
  rateLimits: {
    twitterRequestsPerMinute: number;
    redditRequestsPerMinute: number;
    maxMentionsPerToken: number;
  };
}

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Influencer {
    pub id: String,
    pub name: String,
    pub platform: SocialPlatform,
    pub handle: String,
    pub follower_count: i64,
    pub verified: bool,
    pub influence_score: f64,
    pub active: bool,
    pub tags: Vec<String>,
    pub added_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum SocialPlatform {
    Twitter,
    Reddit,
    Telegram,
    Discord,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SocialMention {
    pub id: String,
    pub platform: SocialPlatform,
    pub author: String,
    pub author_id: String,
    pub content: String,
    pub token_address: Option<String>,
    pub token_symbol: Option<String>,
    pub timestamp: i64,
    pub engagement: EngagementMetrics,
    pub sentiment_score: f64,
    pub sentiment_label: String,
    pub influencer_id: Option<String>,
    pub url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct EngagementMetrics {
    pub likes: i64,
    pub retweets: i64,
    pub replies: i64,
    pub views: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct TrendData {
    pub token_address: String,
    pub token_symbol: String,
    pub mention_count: i64,
    pub velocity: f64,
    pub acceleration: f64,
    pub sentiment_trend: Vec<SentimentDataPoint>,
    pub volume_trend: Vec<VolumeDataPoint>,
    pub peak_time: Option<i64>,
    pub current_rank: usize,
    pub rank_change: i32,
    pub detected_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SentimentDataPoint {
    pub timestamp: i64,
    pub score: f64,
    pub mentions: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct VolumeDataPoint {
    pub timestamp: i64,
    pub volume: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct WhaleWallet {
    pub address: String,
    pub label: Option<String>,
    pub balance: f64,
    pub token_holdings: Vec<TokenHolding>,
    pub behavior_pattern: BehaviorPattern,
    pub last_activity: i64,
    pub cluster_id: Option<String>,
    pub risk_level: WhaleRiskLevel,
    pub following: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct TokenHolding {
    pub token_address: String,
    pub token_symbol: String,
    pub amount: f64,
    pub value_usd: f64,
    pub percentage: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum BehaviorPattern {
    Accumulator,
    Distributor,
    Trader,
    Hodler,
    Manipulator,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum WhaleRiskLevel {
    Low,
    Medium,
    High,
    Critical,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct WhaleMovement {
    pub id: String,
    pub wallet_address: String,
    pub transaction_hash: String,
    pub token_address: String,
    pub token_symbol: String,
    pub amount: f64,
    pub value_usd: f64,
    pub movement_type: MovementType,
    pub from_address: Option<String>,
    pub to_address: Option<String>,
    pub timestamp: i64,
    pub impact_score: f64,
    pub sentiment_shift: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum MovementType {
    Buy,
    Sell,
    Transfer,
    StakeUnstake,
    LiquidityAdd,
    LiquidityRemove,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SocialAlert {
    pub id: String,
    pub alert_type: SocialAlertType,
    pub severity: AlertSeverity,
    pub title: String,
    pub message: String,
    pub token_address: Option<String>,
    pub token_symbol: Option<String>,
    pub influencer_id: Option<String>,
    pub whale_address: Option<String>,
    pub metadata: HashMap<String, serde_json::Value>,
    pub timestamp: i64,
    pub acknowledged: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum SocialAlertType {
    InfluencerMention,
    TrendingToken,
    SentimentSpike,
    WhaleMovement,
    FomoAlert,
    FudAlert,
    VolumeSpike,
    CoordinatedActivity,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum AlertSeverity {
    Low,
    Medium,
    High,
    Critical,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct FomoFudGauge {
    pub token_address: String,
    pub token_symbol: String,
    pub fomo_score: f64,
    pub fud_score: f64,
    pub net_sentiment: f64,
    pub confidence: f64,
    pub contributing_factors: Vec<GaugeFactor>,
    pub last_updated: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct GaugeFactor {
    pub factor_type: String,
    pub impact: f64,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SocialConfig {
    pub enabled_platforms: Vec<SocialPlatform>,
    pub twitter_bearer_token: Option<String>,
    pub reddit_client_id: Option<String>,
    pub reddit_client_secret: Option<String>,
    pub update_interval_seconds: u64,
    pub alert_thresholds: AlertThresholds,
    pub rate_limits: RateLimits,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AlertThresholds {
    pub sentiment_spike: f64,
    pub volume_spike: f64,
    pub whale_movement_usd: f64,
    pub fomo_threshold: f64,
    pub fud_threshold: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct RateLimits {
    pub twitter_requests_per_minute: u32,
    pub reddit_requests_per_minute: u32,
    pub max_mentions_per_token: usize,
}

impl Default for SocialConfig {
    fn default() -> Self {
        Self {
            enabled_platforms: vec![SocialPlatform::Twitter, SocialPlatform::Reddit],
            twitter_bearer_token: None,
            reddit_client_id: None,
            reddit_client_secret: None,
            update_interval_seconds: 300,
            alert_thresholds: AlertThresholds {
                sentiment_spike: 0.5,
                volume_spike: 2.0,
                whale_movement_usd: 100000.0,
                fomo_threshold: 0.7,
                fud_threshold: -0.7,
            },
            rate_limits: RateLimits {
                twitter_requests_per_minute: 15,
                reddit_requests_per_minute: 60,
                max_mentions_per_token: 100,
            },
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct WhaleBehaviorInsight {
    pub wallet_address: String,
    pub insight_type: InsightType,
    pub title: String,
    pub description: String,
    pub confidence: f64,
    pub supporting_data: Vec<String>,
    pub timestamp: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum InsightType {
    PatternChange,
    NewPosition,
    ExitedPosition,
    AccumulationPhase,
    DistributionPhase,
    RiskIncrease,
    OpportunityDetected,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SocialMomentum {
    pub token_address: String,
    pub token_symbol: String,
    pub momentum_score: f64,
    pub sentiment_score: f64,
    pub volume_score: f64,
    pub influencer_score: f64,
    pub whale_score: f64,
    pub trending_rank: Option<usize>,
    pub timestamp: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct WalletFollowEvent {
    pub wallet_address: String,
    pub title: String,
    pub description: String,
    pub impact: f64,
    pub timestamp: i64,
    pub tokens: Vec<String>,
    pub action: MovementType,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SocialDashboardSnapshot {
    pub generated_at: i64,
    pub mentions: Vec<SocialMention>,
    pub top_influencers: Vec<Influencer>,
    pub sentiment_gauges: Vec<FomoFudGauge>,
    pub momentum: Vec<SocialMomentum>,
    pub trend_data: Vec<TrendData>,
    pub whale_movements: Vec<WhaleMovement>,
    pub whale_insights: Vec<WhaleBehaviorInsight>,
    pub wallets_you_follow: Vec<WalletFollowEvent>,
    pub alerts: Vec<SocialAlert>,
    pub rate_limit_status: Vec<ApiRateLimitStatus>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ApiRateLimitStatus {
    pub source: String,
    pub limit: Option<u32>,
    pub remaining: Option<u32>,
    pub reset_at: Option<i64>,
    pub last_error: Option<String>,
}

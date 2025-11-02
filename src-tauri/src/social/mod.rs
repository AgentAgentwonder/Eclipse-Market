pub mod analysis;
pub mod cache;
pub mod commands;
pub mod models;
pub mod reddit;
pub mod service;
pub mod twitter;
pub mod whales;

use cache::CacheError;
use reddit::RedditError;
use twitter::TwitterError;
use whales::WhaleError;

pub use analysis::{
    AnalysisError, AnalysisSummary, GaugeReading, InfluencerScore, 
    SentimentSnapshot as AnalysisSentimentSnapshot, SharedSocialAnalysisService, 
    SocialAnalysisService, TrendRecord,
};
pub use cache::{MentionAggregate, SocialCache, TrendSnapshot};
pub use commands::*;
pub use models::{FetchMetadata, RateLimitInfo, SentimentResult, SocialFetchResult, SocialPost};
pub use reddit::RedditClient;
pub use service::{SharedSocialDataService, SocialDataService};
pub use twitter::TwitterClient;
pub use whales::{
    FollowedWallet, WhaleCluster, WhaleCorrelation, WhaleFeedEntry, WhaleInsight,
    WhaleSocialMention, WhaleService,
};

pub type SharedWhaleService = std::sync::Arc<tokio::sync::RwLock<WhaleService>>;

#[derive(Debug, thiserror::Error)]
pub enum SocialError {
    #[error("reddit error: {0}")]
    Reddit(#[from] RedditError),
    #[error("twitter error: {0}")]
    Twitter(#[from] TwitterError),
    #[error("cache error: {0}")]
    Cache(#[from] CacheError),
    #[error("analysis error: {0}")]
    Analysis(#[from] AnalysisError),
    #[error("whale error: {0}")]
    Whale(#[from] WhaleError),
    #[error("internal error: {0}")]
    Internal(String),
}

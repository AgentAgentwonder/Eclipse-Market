pub mod cache;
pub mod commands;
pub mod models;
pub mod reddit;
pub mod service;
pub mod twitter;

use cache::CacheError;
use reddit::RedditError;
use twitter::TwitterError;

pub use cache::{MentionAggregate, SocialCache, TrendSnapshot};
pub use commands::*;
pub use models::{FetchMetadata, RateLimitInfo, SentimentResult, SocialFetchResult, SocialPost};
pub use reddit::RedditClient;
pub use service::{SharedSocialDataService, SocialDataService};
pub use twitter::TwitterClient;

#[derive(Debug, thiserror::Error)]
pub enum SocialError {
    #[error("reddit error: {0}")]
    Reddit(#[from] RedditError),
    #[error("twitter error: {0}")]
    Twitter(#[from] TwitterError),
    #[error("cache error: {0}")]
    Cache(#[from] CacheError),
    #[error("internal error: {0}")]
    Internal(String),
}

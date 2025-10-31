pub mod aggregator;
pub mod commands;
pub mod community;
pub mod influencer_tracker;
pub mod momentum;
pub mod sentiment;
pub mod storage;
pub mod trends;
pub mod whale_tracker;

use std::sync::Arc;
use tokio::sync::RwLock;

pub use aggregator::SocialIntelEngine;
pub use commands::*;

pub type SharedSocialIntelEngine = Arc<RwLock<SocialIntelEngine>>;

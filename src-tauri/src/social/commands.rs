use super::api_clients::*;
use super::influencers::*;
use super::scoring::*;
use super::sentiment::*;
use super::trends::*;
use super::types::*;
use super::whales::*;
use crate::token_flow::types::TokenFlowEdge;
use chrono::Utc;
use std::collections::HashSet;
use std::sync::Arc;
use tokio::sync::RwLock;

pub type SharedSocialManager = Arc<RwLock<SocialIntelligenceManager>>;

pub struct SocialIntelligenceManager {
    influencer_manager: InfluencerManager,
    whale_tracker: WhaleTracker,
    trend_detector: TrendDetector,
    sentiment_analyzer: EnhancedSentimentAnalyzer,
    scoring_engine: SocialScoringEngine,
    config: SocialConfig,
    twitter_client: Arc<TwitterClient>,
    reddit_client: Arc<RedditClient>,
    cached_mentions: Vec<SocialMention>,
    cached_momentum: Vec<SocialMomentum>,
    rate_limits: Vec<ApiRateLimitStatus>,
}

impl SocialIntelligenceManager {
    pub fn new(mut config: SocialConfig) -> Self {
        if config.twitter_bearer_token.is_none() {
            config.twitter_bearer_token = std::env::var("TWITTER_BEARER_TOKEN").ok();
        }
        if config.reddit_client_id.is_none() {
            config.reddit_client_id = std::env::var("REDDIT_CLIENT_ID").ok();
        }
        if config.reddit_client_secret.is_none() {
            config.reddit_client_secret = std::env::var("REDDIT_CLIENT_SECRET").ok();
        }

        let twitter_client = Arc::new(TwitterClient::new(
            config.twitter_bearer_token.clone(),
            config.rate_limits.twitter_requests_per_minute,
        ));
        let reddit_client = Arc::new(RedditClient::new(
            config.reddit_client_id.clone(),
            config.reddit_client_secret.clone(),
            config.rate_limits.reddit_requests_per_minute,
        ));

        let mut influencer_manager = InfluencerManager::new();
        influencer_manager.add_default_influencers();

        let mut whale_tracker = WhaleTracker::new();
        whale_tracker.generate_mock_whales();

        Self {
            influencer_manager,
            whale_tracker,
            trend_detector: TrendDetector::new(),
            sentiment_analyzer: EnhancedSentimentAnalyzer::new(),
            scoring_engine: SocialScoringEngine::new(),
            config,
            twitter_client,
            reddit_client,
            cached_mentions: Vec::new(),
            cached_momentum: Vec::new(),
            rate_limits: Vec::new(),
        }
    }

    pub async fn refresh_social_data(&mut self) -> Result<(), String> {
        let active_influencers = self.influencer_manager.get_active_influencers();
        let mut all_mentions = Vec::new();
        let mut rate_limits = Vec::new();

        if self
            .config
            .enabled_platforms
            .contains(&SocialPlatform::Twitter)
        {
            match self
                .twitter_client
                .fetch_mentions(&active_influencers)
                .await
            {
                Ok(result) => {
                    all_mentions.extend(result.mentions);
                    rate_limits.push(result.rate_limit);
                }
                Err(e) => {
                    tracing::warn!("Twitter fetch failed: {}", e);
                }
            }
        }

        if self
            .config
            .enabled_platforms
            .contains(&SocialPlatform::Reddit)
        {
            match self.reddit_client.fetch_mentions(&active_influencers).await {
                Ok(result) => {
                    all_mentions.extend(result.mentions);
                    rate_limits.push(result.rate_limit);
                }
                Err(e) => {
                    tracing::warn!("Reddit fetch failed: {}", e);
                }
            }
        }

        self.rate_limits = rate_limits;
        self.cached_mentions = all_mentions;
        Ok(())
    }

    pub fn get_dashboard_snapshot(&mut self) -> SocialDashboardSnapshot {
        let now = Utc::now().timestamp();
        let mentions = self.cached_mentions.clone();
        let influencer_mentions: Vec<SocialMention> = mentions
            .iter()
            .filter(|m| m.influencer_id.is_some())
            .cloned()
            .collect();

        let mut gauges = Vec::new();
        let mut token_addresses: Vec<String> = mentions
            .iter()
            .filter_map(|m| m.token_address.clone())
            .collect::<HashSet<_>>()
            .into_iter()
            .collect();
        token_addresses.sort();
        for token_address in token_addresses.iter().take(10) {
            let token_symbol = mentions
                .iter()
                .find(|m| m.token_address.as_deref() == Some(token_address))
                .and_then(|m| m.token_symbol.clone())
                .unwrap_or_else(|| "UNKNOWN".to_string());
            let gauge = self.sentiment_analyzer.calculate_fomo_fud_gauge(
                token_address,
                &token_symbol,
                &mentions,
            );
            gauges.push(gauge);
        }

        let trend_data = self
            .trend_detector
            .update_trends(&mentions, Some(&self.cached_momentum));
        let whale_movements = self.whale_tracker.get_recent_movements(50);

        let mut momentum_data = Vec::new();
        for token_address in token_addresses.iter().take(10) {
            let token_symbol = mentions
                .iter()
                .find(|m| m.token_address.as_deref() == Some(token_address))
                .and_then(|m| m.token_symbol.clone())
                .unwrap_or_else(|| "UNKNOWN".to_string());
            let relevant_mentions: Vec<SocialMention> = mentions
                .iter()
                .filter(|m| m.token_address.as_deref() == Some(token_address.as_str()))
                .cloned()
                .collect();
            let momentum = self.scoring_engine.compute_momentum(
                token_address,
                &token_symbol,
                &relevant_mentions,
                &whale_movements,
                &influencer_mentions,
            );
            momentum_data.push(momentum);
        }
        self.cached_momentum = momentum_data.clone();

        let alerts = self.scoring_engine.build_alerts(&momentum_data, &gauges);
        let whale_insights = self.whale_tracker.get_insights(20);
        let wallets_you_follow = self.whale_tracker.get_wallet_follow_events(30);

        SocialDashboardSnapshot {
            generated_at: now,
            mentions,
            top_influencers: self.influencer_manager.get_active_influencers(),
            sentiment_gauges: gauges,
            momentum: momentum_data,
            trend_data,
            whale_movements,
            whale_insights,
            wallets_you_follow,
            alerts,
            rate_limit_status: self.rate_limits.clone(),
        }
    }

    pub fn add_influencer(&mut self, influencer: Influencer) -> Result<(), String> {
        self.influencer_manager.add_influencer(influencer)
    }

    pub fn remove_influencer(&mut self, id: &str) -> Result<(), String> {
        self.influencer_manager.remove_influencer(id)
    }

    pub fn update_influencer(&mut self, influencer: Influencer) -> Result<(), String> {
        self.influencer_manager.update_influencer(influencer)
    }

    pub fn get_influencers(&self) -> Vec<Influencer> {
        self.influencer_manager.get_all_influencers()
    }

    pub fn follow_whale(&mut self, address: String) -> Result<(), String> {
        self.whale_tracker.follow_wallet(address)
    }

    pub fn unfollow_whale(&mut self, address: &str) -> Result<(), String> {
        self.whale_tracker.unfollow_wallet(address)
    }

    pub fn get_followed_whales(&self) -> Vec<WhaleWallet> {
        self.whale_tracker.get_followed_wallets()
    }

    pub fn get_all_whales(&self) -> Vec<WhaleWallet> {
        self.whale_tracker.get_all_whales()
    }

    pub fn cluster_whales(&mut self, edges: Vec<TokenFlowEdge>) -> Vec<String> {
        self.whale_tracker.cluster_whales(&edges)
    }

    pub fn analyze_whale_behavior(&mut self, address: &str) -> Result<BehaviorPattern, String> {
        self.whale_tracker.analyze_behavior(address)
    }

    pub fn update_config(&mut self, config: SocialConfig) {
        self.config = config;
    }

    pub fn get_config(&self) -> SocialConfig {
        self.config.clone()
    }
}

// Tauri Commands
#[tauri::command]
pub async fn social_get_dashboard_snapshot(
    manager: tauri::State<'_, SharedSocialManager>,
) -> Result<SocialDashboardSnapshot, String> {
    let mut mgr = manager.write().await;
    Ok(mgr.get_dashboard_snapshot())
}

#[tauri::command]
pub async fn social_refresh_data(
    manager: tauri::State<'_, SharedSocialManager>,
) -> Result<(), String> {
    let mut mgr = manager.write().await;
    mgr.refresh_social_data().await
}

#[tauri::command]
pub async fn social_add_influencer(
    influencer: Influencer,
    manager: tauri::State<'_, SharedSocialManager>,
) -> Result<(), String> {
    let mut mgr = manager.write().await;
    mgr.add_influencer(influencer)
}

#[tauri::command]
pub async fn social_remove_influencer(
    id: String,
    manager: tauri::State<'_, SharedSocialManager>,
) -> Result<(), String> {
    let mut mgr = manager.write().await;
    mgr.remove_influencer(&id)
}

#[tauri::command]
pub async fn social_update_influencer(
    influencer: Influencer,
    manager: tauri::State<'_, SharedSocialManager>,
) -> Result<(), String> {
    let mut mgr = manager.write().await;
    mgr.update_influencer(influencer)
}

#[tauri::command]
pub async fn social_get_influencers(
    manager: tauri::State<'_, SharedSocialManager>,
) -> Result<Vec<Influencer>, String> {
    let mgr = manager.read().await;
    Ok(mgr.get_influencers())
}

#[tauri::command]
pub async fn social_follow_whale(
    address: String,
    manager: tauri::State<'_, SharedSocialManager>,
) -> Result<(), String> {
    let mut mgr = manager.write().await;
    mgr.follow_whale(address)
}

#[tauri::command]
pub async fn social_unfollow_whale(
    address: String,
    manager: tauri::State<'_, SharedSocialManager>,
) -> Result<(), String> {
    let mut mgr = manager.write().await;
    mgr.unfollow_whale(&address)
}

#[tauri::command]
pub async fn social_get_followed_whales(
    manager: tauri::State<'_, SharedSocialManager>,
) -> Result<Vec<WhaleWallet>, String> {
    let mgr = manager.read().await;
    Ok(mgr.get_followed_whales())
}

#[tauri::command]
pub async fn social_get_all_whales(
    manager: tauri::State<'_, SharedSocialManager>,
) -> Result<Vec<WhaleWallet>, String> {
    let mgr = manager.read().await;
    Ok(mgr.get_all_whales())
}

#[tauri::command]
pub async fn social_cluster_whales(
    edges: Vec<TokenFlowEdge>,
    manager: tauri::State<'_, SharedSocialManager>,
) -> Result<Vec<String>, String> {
    let mut mgr = manager.write().await;
    Ok(mgr.cluster_whales(edges))
}

#[tauri::command]
pub async fn social_analyze_whale_behavior(
    address: String,
    manager: tauri::State<'_, SharedSocialManager>,
) -> Result<BehaviorPattern, String> {
    let mut mgr = manager.write().await;
    mgr.analyze_whale_behavior(&address)
}

#[tauri::command]
pub async fn social_update_config(
    config: SocialConfig,
    manager: tauri::State<'_, SharedSocialManager>,
) -> Result<(), String> {
    let mut mgr = manager.write().await;
    mgr.update_config(config);
    Ok(())
}

#[tauri::command]
pub async fn social_get_config(
    manager: tauri::State<'_, SharedSocialManager>,
) -> Result<SocialConfig, String> {
    let mgr = manager.read().await;
    Ok(mgr.get_config())
}

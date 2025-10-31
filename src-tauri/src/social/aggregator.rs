use super::community::{CommunityAnalyzer, CommunityHealthMetrics, HolderAnalysis};
use super::influencer_tracker::{InfluencerTracker, InfluencerLeaderboard};
use super::momentum::{MomentumCalculator, SocialMomentumScore};
use super::sentiment::{FomoFudScores, SentimentEngine, SentimentSummary};
use super::storage::{
    Influencer, InfluencerMention, SentimentHistory, SocialMention, SocialStorage, TrendData,
    WhaleTransaction, WhaleWallet,
};
use super::trends::{TrendDetector, TrendingToken};
use super::whale_tracker::{WhaleActivity, WhaleInsight, WhaleProfile, WhaleTracker};
use chrono::{Duration, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AlertRule {
    pub id: String,
    pub name: String,
    pub trigger: String,
    pub token_address: Option<String>,
    pub threshold: Option<f32>,
    pub enabled: bool,
    pub channels: Vec<String>,
    pub frequency: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AlertConfiguration {
    pub rules: Vec<AlertRule>,
    pub last_updated: i64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SocialSearchResult {
    pub mentions: Vec<SocialMention>,
    pub influencers: Vec<InfluencerMention>,
    pub whales: Vec<WhaleTransaction>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SocialSentimentResponse {
    pub sentiment: SentimentSummary,
    pub momentum: SocialMomentumScore,
    pub whale_activity: Option<WhaleActivity>,
    pub whale_insights: Vec<WhaleInsight>,
    pub community: CommunityHealthMetrics,
}

pub struct SocialIntelEngine {
    storage: SocialStorage,
    sentiment_engine: SentimentEngine,
    whale_tracker: WhaleTracker,
    influencer_tracker: InfluencerTracker,
    trend_detector: TrendDetector,
    momentum_calculator: MomentumCalculator,
    community_analyzer: CommunityAnalyzer,
    tracked_influencers: Vec<String>,
    tracked_whales: Vec<String>,
    alert_rules: Vec<AlertRule>,
}

impl Default for SocialIntelEngine {
    fn default() -> Self {
        Self::new_with_mock_data()
    }
}

impl SocialIntelEngine {
    pub fn new_with_mock_data() -> Self {
        let mut storage = SocialStorage::new();
        let sentiment_engine = SentimentEngine::new();
        let whale_tracker = WhaleTracker::new();
        let influencer_tracker = InfluencerTracker::new();
        let trend_detector = TrendDetector::new();
        let momentum_calculator = MomentumCalculator::new();
        let community_analyzer = CommunityAnalyzer::new();

        let mut engine = Self {
            storage,
            sentiment_engine,
            whale_tracker,
            influencer_tracker,
            trend_detector,
            momentum_calculator,
            community_analyzer,
            tracked_influencers: Vec::new(),
            tracked_whales: Vec::new(),
            alert_rules: Vec::new(),
        };

        engine.seed_mock_data();
        engine
    }

    fn seed_mock_data(&mut self) {
        let now = Utc::now();
        let tokens = vec![
            (
                "Solana",
                "So11111111111111111111111111111111111111112",
                vec!["#Solana", "#SOL", "Solana", "SOL"],
            ),
            (
                "Bonk",
                "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
                vec!["$BONK", "Bonk", "#Bonk"],
            ),
            (
                "Jupiter",
                "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
                vec!["$JUP", "Jupiter", "JUP"],
            ),
        ];

        let sample_messages = vec![
            (
                "twitter",
                "CryptoTrader42",
                true,
                250_000,
                "Solana is showing strong developer momentum. Just saw multiple new projects launching!",
                4200,
            ),
            (
                "twitter",
                "AlphaWhale",
                true,
                180_000,
                "Whales accumulating SOL again. On-chain flows look 🔥",
                5600,
            ),
            (
                "reddit",
                "sol_dev_guy",
                false,
                1200,
                "Been building on Solana for 6 months, ecosystem feels alive!",
                800,
            ),
            (
                "reddit",
                "crypto_realist",
                false,
                3500,
                "Seeing some warning signs for BONK, community hype fading?",
                320,
            ),
            (
                "twitter",
                "DeFiQueen",
                true,
                420_000,
                "Jupiter's UI improvements are next level. Swaps feel instant.",
                2900,
            ),
            (
                "twitter",
                "MemeCoinAlert",
                false,
                95_000,
                "BONK season incoming again? I'm seeing strong chatter and FOMO vibes! 🚀",
                6100,
            ),
            (
                "reddit",
                "solana_whale_watch",
                false,
                9000,
                "Tracking multiple new whale wallets buying SOL since yesterday.",
                2100,
            ),
            (
                "twitter",
                "RiskManager",
                true,
                150_000,
                "Heads up: Some large wallets just moved SOL to exchanges. Could be prepping to take profits.",
                4700,
            ),
        ];

        for (token, token_address, keywords) in &tokens {
            for (idx, (platform, author, verified, followers, content, engagement)) in
                sample_messages.iter().enumerate()
            {
                if keywords.iter().any(|kw| content.contains(kw)) {
                    let sentiment = crate::sentiment::analyze_sentiment(content);
                    let mention = SocialMention {
                        id: format!("{}_{}", token_address, idx),
                        platform: platform.to_string(),
                        author: author.to_string(),
                        author_verified: *verified,
                        author_followers: *followers,
                        content: content.to_string(),
                        token: Some(token.to_string()),
                        token_address: Some((*token_address).to_string()),
                        sentiment_score: sentiment.score,
                        sentiment_label: sentiment.label.clone(),
                        engagement: *engagement,
                        timestamp: (now - Duration::minutes((idx * 45) as i64)).timestamp(),
                        url: None,
                    };
                    self.storage.add_mention(mention);
                }
            }

            // Seed whale data
            let whale_wallets = vec![
                WhaleWallet {
                    id: Uuid::new_v4().to_string(),
                    address: "7BgBvyjrZX1YKz4oh9mjb8ZScatkkwb8DzFx7LoiVkM3".to_string(),
                    label: Some("Smart Money Trader #1".to_string()),
                    total_value: 2_700_000.0,
                    category: "fund".to_string(),
                    smart_money_score: 0.88,
                    win_rate: 72.0,
                    total_trades: 215,
                    profitable_trades: 155,
                    is_tracked: true,
                    first_seen: (now - Duration::days(210)).timestamp(),
                },
                WhaleWallet {
                    id: Uuid::new_v4().to_string(),
                    address: "GUfCR9mK6azb9vcpsxgXyj7XRPAKJd4KMHTTVvtncGgp".to_string(),
                    label: Some("Whale Investor".to_string()),
                    total_value: 5_200_000.0,
                    category: "individual".to_string(),
                    smart_money_score: 0.76,
                    win_rate: 65.0,
                    total_trades: 180,
                    profitable_trades: 117,
                    is_tracked: false,
                    first_seen: (now - Duration::days(340)).timestamp(),
                },
            ];

            for wallet in whale_wallets {
                self.storage.add_whale_wallet(wallet.clone());
                self.tracked_whales.push(wallet.address.clone());

                let tx = WhaleTransaction {
                    id: Uuid::new_v4().to_string(),
                    wallet_id: wallet.id.clone(),
                    wallet_address: wallet.address.clone(),
                    wallet_label: wallet.label.clone(),
                    token: token.to_string(),
                    token_address: token_address.to_string(),
                    action: if idx % 2 == 0 { "BUY" } else { "SELL" }.to_string(),
                    amount: 42_000.0,
                    usd_value: 1_250_000.0,
                    timestamp: (now - Duration::minutes((idx * 20 + 10) as i64)).timestamp(),
                    signature: format!("sig_{}", idx),
                    profit: Some(if idx % 2 == 0 { 120_000.0 } else { -45_000.0 }),
                };
                self.storage.add_whale_transaction(tx);
            }

            // Seed sentiment history
            for hour in 0..48 {
                let timestamp = (now - Duration::hours(hour)).timestamp();
                let sentiment_score = ((hour as f32).sin() * 0.2) + 0.3;
                let fomo_score = ((hour as f32 / 8.0).cos() * 10.0 + 60.0).max(0.0);
                let fud_score = ((hour as f32 / 6.0).sin() * 8.0 + 35.0).max(0.0);

                let history = SentimentHistory {
                    id: Uuid::new_v4().to_string(),
                    token: token.to_string(),
                    token_address: token_address.to_string(),
                    sentiment_score,
                    fomo_score,
                    fud_score,
                    mention_count: ((hour % 10) + 5) as i32,
                    positive_count: ((hour % 5) + 3) as i32,
                    negative_count: ((hour % 4) + 1) as i32,
                    neutral_count: ((hour % 3) + 2) as i32,
                    timestamp,
                };
                self.storage.add_sentiment_history(history);
            }

            // Seed trend data
            for hour in 0..72 {
                let timestamp = (now - Duration::hours(hour)).timestamp();
                let trend = TrendData {
                    id: Uuid::new_v4().to_string(),
                    token: token.to_string(),
                    token_address: token_address.to_string(),
                    platform: if hour % 2 == 0 { "twitter" } else { "reddit" }.to_string(),
                    mention_count: ((hour % 12) + 5) as i32,
                    momentum_score: (70.0 - hour as f32 * 0.4).max(10.0),
                    velocity: (hour as f32 / 10.0).sin(),
                    sentiment_score: ((hour as f32 / 5.0).cos() * 0.3).max(-1.0),
                    timestamp,
                };
                self.storage.add_trend_data(trend);
            }
        }

        // Seed influencers
        for influencer in self.influencer_tracker.get_influencers() {
            self.storage.add_influencer(influencer);
        }

        // Seed influencer mentions
        let influencer_samples = vec![
            (
                "crypto_whale_1",
                "Solana",
                "So11111111111111111111111111111111111111112",
                "Just loaded more SOL. Roadmap is looking insane for Q4.",
                "bullish".
                to_string(),
                9200,
            ),
            (
                "defi_alpha_1",
                "Jupiter",
                "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
                "JUP is about to roll out a massive liquidity incentive program.",
                "bullish".to_string(),
                4800,
            ),
            (
                "solana_degen_1",
                "Bonk",
                "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
                "BONK hype is back but watch the whales dumping on retail.",
                "bearish".to_string(),
                3100,
            ),
        ];

        for (idx, (influencer_id, token, token_address, content, sentiment, engagement)) in
            influencer_samples.into_iter().enumerate()
        {
            let mention = InfluencerMention {
                id: Uuid::new_v4().to_string(),
                influencer_id: influencer_id.to_string(),
                influencer_handle: self
                    .influencer_tracker
                    .get_influencer(influencer_id)
                    .map(|i| i.handle)
                    .unwrap_or_else(|| "Unknown".to_string()),
                token: token.to_string(),
                token_address: token_address.to_string(),
                content: content.to_string(),
                sentiment,
                engagement,
                timestamp: (now - Duration::minutes((idx * 30) as i64)).timestamp(),
                price_at_mention: Some(24.50 + idx as f64),
                price_24h_later: Some(25.20 + idx as f64),
                impact_score: Some(6.5 + idx as f32),
            };
            self.storage.add_influencer_mention(mention);
        }

        // default alerts
        self.alert_rules = vec![
            AlertRule {
                id: Uuid::new_v4().to_string(),
                name: "Solana Sentiment Spike".to_string(),
                trigger: "sentiment_score > 0.7".to_string(),
                token_address: Some("So11111111111111111111111111111111111111112".to_string()),
                threshold: Some(0.7),
                enabled: true,
                channels: vec!["in-app".to_string()],
                frequency: "instant".to_string(),
            },
            AlertRule {
                id: Uuid::new_v4().to_string(),
                name: "Whale Sell Alert".to_string(),
                trigger: "whale_sell > 100000".to_string(),
                token_address: None,
                threshold: Some(100_000.0),
                enabled: true,
                channels: vec!["in-app".to_string(), "email".to_string()],
                frequency: "instant".to_string(),
            },
        ];
    }

    pub fn get_social_sentiment(
        &self,
        token_address: &str,
    ) -> Option<SocialSentimentResponse> {
        let mentions = self.storage.get_mentions(token_address, Some(50));
        if mentions.is_empty() {
            return None;
        }

        let token = mentions[0].token.clone().unwrap_or_else(|| "Unknown".to_string());
        let history = self.storage.get_sentiment_history(token_address, Some(200));

        let sentiment = self
            .sentiment_engine
            .analyze_mentions(&token, token_address, &mentions, &history);

        let trend_history = self.storage.get_trend_data(token_address);
        let momentum = self.momentum_calculator.calculate_momentum(
            &token,
            token_address,
            &trend_history,
            &history,
        );

        let whale_transactions = self.storage.get_whale_transactions(token_address, Some(40));
        let whale_wallets = self.storage.get_all_whale_wallets();
        let whale_activity = if whale_transactions.is_empty() {
            None
        } else {
            Some(
                self.whale_tracker.analyze_whale_activity(
                    &token,
                    token_address,
                    &whale_transactions,
                    &whale_wallets,
                ),
            )
        };

        let whale_insights = whale_activity
            .as_ref()
            .map(|activity| {
                self.whale_tracker
                    .generate_whale_insights(&token, token_address, activity)
            })
            .unwrap_or_default();

        let community = self
            .community_analyzer
            .analyze_community_health(&token, token_address, &mentions);

        Some(SocialSentimentResponse {
            sentiment,
            momentum,
            whale_activity,
            whale_insights,
            community,
        })
    }

    pub fn get_fomo_fud_scores(&self, token_address: &str) -> Option<FomoFudScores> {
        let mentions = self.storage.get_mentions(token_address, Some(50));
        if mentions.is_empty() {
            return None;
        }
        let token = mentions[0].token.clone().unwrap_or_else(|| "Unknown".to_string());
        let history = self.storage.get_sentiment_history(token_address, Some(200));
        Some(
            self
                .sentiment_engine
                .calculate_fomo_fud(&token, token_address, &mentions, &history),
        )
    }

    pub fn get_trending_tokens(&self) -> Vec<TrendingToken> {
        let trends_map = self.build_trends_map();
        let mut tokens = self.trend_detector.detect_trends(&trends_map);

        // enrich with influencer count
        for token in tokens.iter_mut() {
            let mentions = self
                .storage
                .get_influencer_mentions(&token.token_address, Some(50));
            token.influencers_contributing = mentions.len();
            token.whale_support = self
                .storage
                .get_whale_transactions(&token.token_address, Some(50))
                .iter()
                .any(|tx| tx.action == "BUY" && tx.usd_value > 100_000.0);
        }
        tokens
    }

    fn build_trends_map(&self) -> HashMap<String, Vec<TrendData>> {
        let mut map: HashMap<String, Vec<TrendData>> = HashMap::new();
        for (token_address, trend_data) in self.collect_trends() {
            map.insert(token_address, trend_data);
        }
        map
    }

    fn collect_trends(&self) -> Vec<(String, Vec<TrendData>)> {
        let mut trends = Vec::new();
        for token in [
            "So11111111111111111111111111111111111111112",
            "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
            "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
        ] {
            trends.push((token.to_string(), self.storage.get_trend_data(token)));
        }
        trends
    }

    pub fn get_influencer_mentions(
        &self,
        token_address: &str,
    ) -> Vec<InfluencerMention> {
        self.storage
            .get_influencer_mentions(token_address, Some(50))
    }

    pub fn get_influencer_profiles(&self) -> Vec<Influencer> {
        self.storage.get_all_influencers()
    }

    pub fn get_influencer_leaderboard(&self) -> InfluencerLeaderboard {
        self
            .influencer_tracker
            .generate_leaderboard(&self.storage.get_all_influencers())
    }

    pub fn track_influencer(&mut self, handle: &str) -> Option<Influencer> {
        let mut found_id = None;
        for influencer in self.storage.get_all_influencers() {
            if influencer.handle.eq_ignore_ascii_case(handle)
                || influencer.id.eq_ignore_ascii_case(handle)
            {
                found_id = Some(influencer.id.clone());
                break;
            }
        }

        if let Some(id) = found_id {
            self.storage.update_influencer(&id, true);
            if !self.tracked_influencers.contains(&id) {
                self.tracked_influencers.push(id.clone());
            }
            self.storage.get_influencer(&id)
        } else {
            None
        }
    }

    pub fn get_whale_activity(&self, token_address: &str) -> Option<WhaleActivity> {
        let mentions = self.storage.get_mentions(token_address, Some(1));
        if mentions.is_empty() {
            return None;
        }
        let token = mentions[0].token.clone().unwrap_or_else(|| "Unknown".to_string());

        let transactions = self.storage.get_whale_transactions(token_address, Some(50));
        if transactions.is_empty() {
            return None;
        }

        let wallets = self.storage.get_all_whale_wallets();
        Some(self.whale_tracker.analyze_whale_activity(
            &token,
            token_address,
            &transactions,
            &wallets,
        ))
    }

    pub fn track_whale_wallet(&mut self, address: &str) -> Option<WhaleWallet> {
        if let Some(mut wallet) = self.storage.get_whale_wallet(address) {
            wallet.is_tracked = true;
            self.storage.update_whale_wallet(address, true);
            if !self.tracked_whales.contains(&address.to_string()) {
                self.tracked_whales.push(address.to_string());
            }
            Some(wallet)
        } else {
            // create detection stub
            if let Some(wallet) = self.whale_tracker.detect_whale(address, 150_000.0) {
                self.storage.add_whale_wallet(wallet.clone());
                self.tracked_whales.push(address.to_string());
                Some(wallet)
            } else {
                None
            }
        }
    }

    pub fn get_whale_profile(&self, address: &str) -> Option<WhaleProfile> {
        let wallet = self.storage.get_whale_wallet(address)?;
        let transactions = self
            .storage
            .get_whale_transactions(&wallet.address, Some(100));
        Some(self.whale_tracker.build_whale_profile(wallet, transactions))
    }

    pub fn get_fomo_fud(&self, token_address: &str) -> Option<FomoFudScores> {
        self.get_fomo_fud_scores(token_address)
    }

    pub fn get_sentiment_history(
        &self,
        token_address: &str,
        period: &str,
    ) -> Vec<SentimentHistory> {
        let history = self.storage.get_sentiment_history(token_address, Some(500));
        if history.is_empty() {
            return history;
        }

        let now = Utc::now().timestamp();
        let cutoff = match period {
            "1H" => now - 60 * 60,
            "24H" => now - 24 * 60 * 60,
            "7D" => now - 7 * 24 * 60 * 60,
            "30D" => now - 30 * 24 * 60 * 60,
            _ => now - 7 * 24 * 60 * 60,
        };

        history
            .into_iter()
            .filter(|h| h.timestamp >= cutoff)
            .collect()
    }

    pub fn search_social(&self, query: &str) -> SocialSearchResult {
        let q = query.to_lowercase();

        let mentions = [
            "So11111111111111111111111111111111111111112",
            "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
            "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
        ]
        .iter()
        .flat_map(|token| self.storage.get_mentions(token, Some(200)))
        .filter(|mention| mention.content.to_lowercase().contains(&q))
        .collect();

        let influencers = [
            "So11111111111111111111111111111111111111112",
            "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
            "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
        ]
        .iter()
        .flat_map(|token| self.storage.get_influencer_mentions(token, Some(200)))
        .filter(|mention| mention.content.to_lowercase().contains(&q))
        .collect();

        let whales = [
            "So11111111111111111111111111111111111111112",
            "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
            "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
        ]
        .iter()
        .flat_map(|token| self.storage.get_whale_transactions(token, Some(200)))
        .filter(|tx| {
            tx.wallet_address
                .to_lowercase()
                .contains(&q)
                || tx.token.to_lowercase().contains(&q)
        })
        .collect();

        SocialSearchResult {
            mentions,
            influencers,
            whales,
        }
    }

    pub fn get_community_stats(&self, token_address: &str) -> Option<CommunityHealthMetrics> {
        let mentions = self.storage.get_mentions(token_address, Some(100));
        if mentions.is_empty() {
            return None;
        }
        let token = mentions[0].token.clone().unwrap_or_else(|| "Unknown".to_string());
        Some(
            self
                .community_analyzer
                .analyze_community_health(&token, token_address, &mentions),
        )
    }

    pub fn get_holder_analysis(&self, token_address: &str) -> Option<HolderAnalysis> {
        let mentions = self.storage.get_mentions(token_address, Some(1));
        if mentions.is_empty() {
            return None;
        }
        let token = mentions[0].token.clone().unwrap_or_else(|| "Unknown".to_string());
        Some(self.community_analyzer.analyze_holder_behavior(
            &token,
            token_address,
            125_000,
            280,
        ))
    }

    pub fn configure_alerts(&mut self, rules: Vec<AlertRule>) -> AlertConfiguration {
        self.alert_rules = rules;
        AlertConfiguration {
            rules: self.alert_rules.clone(),
            last_updated: Utc::now().timestamp(),
        }
    }

    pub fn get_alert_configuration(&self) -> AlertConfiguration {
        AlertConfiguration {
            rules: self.alert_rules.clone(),
            last_updated: Utc::now().timestamp(),
        }
    }
}

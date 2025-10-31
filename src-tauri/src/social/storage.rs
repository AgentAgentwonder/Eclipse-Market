use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SocialMention {
    pub id: String,
    pub platform: String,
    pub author: String,
    pub author_verified: bool,
    pub author_followers: i32,
    pub content: String,
    pub token: Option<String>,
    pub token_address: Option<String>,
    pub sentiment_score: f32,
    pub sentiment_label: String,
    pub engagement: i32,
    pub timestamp: i64,
    pub url: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Influencer {
    pub id: String,
    pub handle: String,
    pub platform: String,
    pub follower_count: i32,
    pub verified: bool,
    pub category: String,
    pub credibility_score: f32,
    pub accuracy_rate: f32,
    pub avg_impact: f32,
    pub total_calls: i32,
    pub successful_calls: i32,
    pub is_tracked: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct InfluencerMention {
    pub id: String,
    pub influencer_id: String,
    pub influencer_handle: String,
    pub token: String,
    pub token_address: String,
    pub content: String,
    pub sentiment: String,
    pub engagement: i32,
    pub timestamp: i64,
    pub price_at_mention: Option<f64>,
    pub price_24h_later: Option<f64>,
    pub impact_score: Option<f32>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct WhaleWallet {
    pub id: String,
    pub address: String,
    pub label: Option<String>,
    pub total_value: f64,
    pub category: String,
    pub smart_money_score: f32,
    pub win_rate: f32,
    pub total_trades: i32,
    pub profitable_trades: i32,
    pub is_tracked: bool,
    pub first_seen: i64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct WhaleTransaction {
    pub id: String,
    pub wallet_id: String,
    pub wallet_address: String,
    pub wallet_label: Option<String>,
    pub token: String,
    pub token_address: String,
    pub action: String,
    pub amount: f64,
    pub usd_value: f64,
    pub timestamp: i64,
    pub signature: String,
    pub profit: Option<f64>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct TrendData {
    pub id: String,
    pub token: String,
    pub token_address: String,
    pub platform: String,
    pub mention_count: i32,
    pub momentum_score: f32,
    pub velocity: f32,
    pub sentiment_score: f32,
    pub timestamp: i64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SentimentHistory {
    pub id: String,
    pub token: String,
    pub token_address: String,
    pub sentiment_score: f32,
    pub fomo_score: f32,
    pub fud_score: f32,
    pub mention_count: i32,
    pub positive_count: i32,
    pub negative_count: i32,
    pub neutral_count: i32,
    pub timestamp: i64,
}

pub struct SocialStorage {
    mentions: HashMap<String, Vec<SocialMention>>,
    influencers: HashMap<String, Influencer>,
    influencer_mentions: HashMap<String, Vec<InfluencerMention>>,
    whale_wallets: HashMap<String, WhaleWallet>,
    whale_transactions: HashMap<String, Vec<WhaleTransaction>>,
    trends: HashMap<String, Vec<TrendData>>,
    sentiment_history: HashMap<String, Vec<SentimentHistory>>,
}

impl SocialStorage {
    pub fn new() -> Self {
        Self {
            mentions: HashMap::new(),
            influencers: HashMap::new(),
            influencer_mentions: HashMap::new(),
            whale_wallets: HashMap::new(),
            whale_transactions: HashMap::new(),
            trends: HashMap::new(),
            sentiment_history: HashMap::new(),
        }
    }

    pub fn add_mention(&mut self, mention: SocialMention) {
        let key = mention.token_address.clone().unwrap_or_default();
        self.mentions.entry(key).or_insert_with(Vec::new).push(mention);
    }

    pub fn get_mentions(&self, token_address: &str, limit: Option<usize>) -> Vec<SocialMention> {
        if let Some(mentions) = self.mentions.get(token_address) {
            let mut sorted = mentions.clone();
            sorted.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
            if let Some(lim) = limit {
                sorted.into_iter().take(lim).collect()
            } else {
                sorted
            }
        } else {
            Vec::new()
        }
    }

    pub fn add_influencer(&mut self, influencer: Influencer) {
        self.influencers.insert(influencer.id.clone(), influencer);
    }

    pub fn get_influencer(&self, id: &str) -> Option<Influencer> {
        self.influencers.get(id).cloned()
    }

    pub fn get_all_influencers(&self) -> Vec<Influencer> {
        self.influencers.values().cloned().collect()
    }

    pub fn get_tracked_influencers(&self) -> Vec<Influencer> {
        self.influencers
            .values()
            .filter(|i| i.is_tracked)
            .cloned()
            .collect()
    }

    pub fn update_influencer(&mut self, id: &str, is_tracked: bool) {
        if let Some(influencer) = self.influencers.get_mut(id) {
            influencer.is_tracked = is_tracked;
        }
    }

    pub fn add_influencer_mention(&mut self, mention: InfluencerMention) {
        let key = mention.token_address.clone();
        self.influencer_mentions
            .entry(key)
            .or_insert_with(Vec::new)
            .push(mention);
    }

    pub fn get_influencer_mentions(
        &self,
        token_address: &str,
        limit: Option<usize>,
    ) -> Vec<InfluencerMention> {
        if let Some(mentions) = self.influencer_mentions.get(token_address) {
            let mut sorted = mentions.clone();
            sorted.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
            if let Some(lim) = limit {
                sorted.into_iter().take(lim).collect()
            } else {
                sorted
            }
        } else {
            Vec::new()
        }
    }

    pub fn add_whale_wallet(&mut self, wallet: WhaleWallet) {
        self.whale_wallets.insert(wallet.address.clone(), wallet);
    }

    pub fn get_whale_wallet(&self, address: &str) -> Option<WhaleWallet> {
        self.whale_wallets.get(address).cloned()
    }

    pub fn get_all_whale_wallets(&self) -> Vec<WhaleWallet> {
        self.whale_wallets.values().cloned().collect()
    }

    pub fn get_tracked_whale_wallets(&self) -> Vec<WhaleWallet> {
        self.whale_wallets
            .values()
            .filter(|w| w.is_tracked)
            .cloned()
            .collect()
    }

    pub fn update_whale_wallet(&mut self, address: &str, is_tracked: bool) {
        if let Some(wallet) = self.whale_wallets.get_mut(address) {
            wallet.is_tracked = is_tracked;
        }
    }

    pub fn add_whale_transaction(&mut self, transaction: WhaleTransaction) {
        let key = transaction.token_address.clone();
        self.whale_transactions
            .entry(key)
            .or_insert_with(Vec::new)
            .push(transaction);
    }

    pub fn get_whale_transactions(
        &self,
        token_address: &str,
        limit: Option<usize>,
    ) -> Vec<WhaleTransaction> {
        if let Some(transactions) = self.whale_transactions.get(token_address) {
            let mut sorted = transactions.clone();
            sorted.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
            if let Some(lim) = limit {
                sorted.into_iter().take(lim).collect()
            } else {
                sorted
            }
        } else {
            Vec::new()
        }
    }

    pub fn add_trend_data(&mut self, trend: TrendData) {
        let key = trend.token_address.clone();
        self.trends.entry(key).or_insert_with(Vec::new).push(trend);
    }

    pub fn get_trend_data(&self, token_address: &str) -> Vec<TrendData> {
        self.trends.get(token_address).cloned().unwrap_or_default()
    }

    pub fn add_sentiment_history(&mut self, sentiment: SentimentHistory) {
        let key = sentiment.token_address.clone();
        self.sentiment_history
            .entry(key)
            .or_insert_with(Vec::new)
            .push(sentiment);
        
        // Keep only last 1000 entries per token
        if let Some(history) = self.sentiment_history.get_mut(&key) {
            if history.len() > 1000 {
                history.drain(0..history.len() - 1000);
            }
        }
    }

    pub fn get_sentiment_history(
        &self,
        token_address: &str,
        limit: Option<usize>,
    ) -> Vec<SentimentHistory> {
        if let Some(history) = self.sentiment_history.get(token_address) {
            let mut sorted = history.clone();
            sorted.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
            if let Some(lim) = limit {
                sorted.into_iter().take(lim).collect()
            } else {
                sorted
            }
        } else {
            Vec::new()
        }
    }

    pub fn cleanup_old_data(&mut self, days_to_keep: i64) {
        let cutoff = chrono::Utc::now().timestamp() - (days_to_keep * 24 * 60 * 60);
        
        // Clean mentions
        for mentions in self.mentions.values_mut() {
            mentions.retain(|m| m.timestamp > cutoff);
        }
        
        // Clean influencer mentions
        for mentions in self.influencer_mentions.values_mut() {
            mentions.retain(|m| m.timestamp > cutoff);
        }
        
        // Clean whale transactions (keep more history)
        for transactions in self.whale_transactions.values_mut() {
            transactions.retain(|t| t.timestamp > cutoff);
        }
        
        // Clean trends
        for trends in self.trends.values_mut() {
            trends.retain(|t| t.timestamp > cutoff);
        }
    }
}

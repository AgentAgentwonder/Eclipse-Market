use super::storage::SocialMention;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct CommunityHealthMetrics {
    pub token: String,
    pub token_address: String,
    pub active_users_24h: i32,
    pub engagement_rate: f32,
    pub sentiment_distribution: SentimentDistribution,
    pub community_growth_30d: f32,
    pub platform_activity: HashMap<String, PlatformActivity>,
    pub health_score: f32,
    pub timestamp: i64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SentimentDistribution {
    pub bulls_percentage: f32,
    pub bears_percentage: f32,
    pub neutral_percentage: f32,
    pub conviction_score: f32,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PlatformActivity {
    pub platform: String,
    pub post_count: i32,
    pub avg_engagement: f32,
    pub sentiment_avg: f32,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct HolderAnalysis {
    pub token: String,
    pub token_address: String,
    pub total_holders: i32,
    pub change_24h: i32,
    pub diamond_hands_ratio: f32,
    pub paper_hands_ratio: f32,
    pub top_holder_concentration: f32,
    pub holder_sentiment: f32,
}

pub struct CommunityAnalyzer;

impl CommunityAnalyzer {
    pub fn new() -> Self {
        Self
    }

    pub fn analyze_community_health(
        &self,
        token: &str,
        token_address: &str,
        mentions: &[SocialMention],
    ) -> CommunityHealthMetrics {
        let now = Utc::now().timestamp();
        let day_ago = now - 24 * 60 * 60;

        let recent_mentions: Vec<&SocialMention> = mentions
            .iter()
            .filter(|m| m.timestamp >= day_ago)
            .collect();

        let active_users = self.count_unique_users(&recent_mentions);
        let engagement_rate = self.calculate_engagement_rate(&recent_mentions);
        let sentiment_distribution = self.analyze_sentiment_distribution(&recent_mentions);
        let community_growth = self.estimate_community_growth(mentions);
        let platform_activity = self.analyze_platform_activity(&recent_mentions);

        let health_score = self.calculate_health_score(
            active_users,
            engagement_rate,
            &sentiment_distribution,
            community_growth,
        );

        CommunityHealthMetrics {
            token: token.to_string(),
            token_address: token_address.to_string(),
            active_users_24h: active_users,
            engagement_rate,
            sentiment_distribution,
            community_growth_30d: community_growth,
            platform_activity,
            health_score,
            timestamp: now,
        }
    }

    fn count_unique_users(&self, mentions: &[&SocialMention]) -> i32 {
        let unique_users: HashSet<_> = mentions.iter().map(|m| &m.author).collect();
        unique_users.len() as i32
    }

    fn calculate_engagement_rate(&self, mentions: &[&SocialMention]) -> f32 {
        if mentions.is_empty() {
            return 0.0;
        }

        let total_engagement: i32 = mentions.iter().map(|m| m.engagement).sum();
        (total_engagement as f32 / mentions.len() as f32).min(100.0)
    }

    fn analyze_sentiment_distribution(
        &self,
        mentions: &[&SocialMention],
    ) -> SentimentDistribution {
        if mentions.is_empty() {
            return SentimentDistribution {
                bulls_percentage: 0.0,
                bears_percentage: 0.0,
                neutral_percentage: 0.0,
                conviction_score: 0.0,
            };
        }

        let mut bulls = 0;
        let mut bears = 0;
        let mut neutral = 0;

        for mention in mentions {
            match mention.sentiment_label.as_str() {
                "positive" => bulls += 1,
                "negative" => bears += 1,
                _ => neutral += 1,
            }
        }

        let total = mentions.len() as f32;
        let bulls_pct = (bulls as f32 / total) * 100.0;
        let bears_pct = (bears as f32 / total) * 100.0;
        let neutral_pct = (neutral as f32 / total) * 100.0;

        let conviction_score = (bulls_pct - bears_pct).abs();

        SentimentDistribution {
            bulls_percentage: bulls_pct,
            bears_percentage: bears_pct,
            neutral_percentage: neutral_pct,
            conviction_score,
        }
    }

    fn estimate_community_growth(&self, mentions: &[SocialMention]) -> f32 {
        let now = Utc::now().timestamp();
        let thirty_days_ago = now - 30 * 24 * 60 * 60;
        let fifteen_days_ago = now - 15 * 24 * 60 * 60;

        let older_mentions = mentions
            .iter()
            .filter(|m| m.timestamp >= thirty_days_ago && m.timestamp < fifteen_days_ago)
            .count();

        let recent_mentions = mentions
            .iter()
            .filter(|m| m.timestamp >= fifteen_days_ago)
            .count();

        if older_mentions == 0 {
            return recent_mentions as f32;
        }

        ((recent_mentions as f32 - older_mentions as f32) / older_mentions as f32) * 100.0
    }

    fn analyze_platform_activity(
        &self,
        mentions: &[&SocialMention],
    ) -> HashMap<String, PlatformActivity> {
        let mut platform_data: HashMap<String, (i32, f32, f32)> = HashMap::new();

        for mention in mentions {
            let entry = platform_data
                .entry(mention.platform.clone())
                .or_insert((0, 0.0, 0.0));
            entry.0 += 1;
            entry.1 += mention.engagement as f32;
            entry.2 += mention.sentiment_score;
        }

        platform_data
            .into_iter()
            .map(|(platform, (count, total_engagement, total_sentiment))| {
                let activity = PlatformActivity {
                    platform: platform.clone(),
                    post_count: count,
                    avg_engagement: total_engagement / count as f32,
                    sentiment_avg: total_sentiment / count as f32,
                };
                (platform, activity)
            })
            .collect()
    }

    fn calculate_health_score(
        &self,
        active_users: i32,
        engagement_rate: f32,
        sentiment: &SentimentDistribution,
        growth: f32,
    ) -> f32 {
        let user_score = (active_users as f32 / 100.0).min(25.0);
        let engagement_score = (engagement_rate / 10.0).min(25.0);
        let sentiment_score = (sentiment.bulls_percentage / 4.0).min(25.0);
        let growth_score = ((growth + 100.0) / 8.0).min(25.0);

        (user_score + engagement_score + sentiment_score + growth_score).min(100.0)
    }

    pub fn analyze_holder_behavior(
        &self,
        token: &str,
        token_address: &str,
        total_holders: i32,
        change_24h: i32,
    ) -> HolderAnalysis {
        let diamond_hands_ratio = 0.65;
        let paper_hands_ratio = 0.35;
        let top_holder_concentration = 0.42;
        let holder_sentiment = 0.6;

        HolderAnalysis {
            token: token.to_string(),
            token_address: token_address.to_string(),
            total_holders,
            change_24h,
            diamond_hands_ratio,
            paper_hands_ratio,
            top_holder_concentration,
            holder_sentiment,
        }
    }
}

use super::storage::{SentimentHistory, TrendData};
use chrono::Utc;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SocialMomentumScore {
    pub token: String,
    pub token_address: String,
    pub score: f32,
    pub social_volume: f32,
    pub social_velocity: f32,
    pub sentiment_momentum: f32,
    pub engagement_momentum: f32,
    pub community_growth: f32,
    pub price_divergence: f32,
    pub timestamp: i64,
}

pub struct MomentumCalculator;

impl MomentumCalculator {
    pub fn new() -> Self {
        Self
    }

    pub fn calculate_momentum(
        &self,
        token: &str,
        token_address: &str,
        trend_history: &[TrendData],
        sentiment_history: &[SentimentHistory],
    ) -> SocialMomentumScore {
        let now = Utc::now().timestamp();
        let social_volume = self.compute_social_volume(trend_history);
        let social_velocity = self.compute_velocity(trend_history);
        let sentiment_momentum = self.compute_sentiment_momentum(sentiment_history);
        let engagement_momentum = self.compute_engagement_momentum(trend_history);
        let community_growth = self.compute_community_growth(trend_history);
        let price_divergence = self.compute_price_divergence(sentiment_history);

        let mut score = 0.0;
        score += social_volume * 0.25;
        score += social_velocity * 0.25;
        score += sentiment_momentum * 0.2;
        score += engagement_momentum * 0.15;
        score += community_growth * 0.1;
        score += (100.0 - price_divergence.abs()) * 0.05;

        SocialMomentumScore {
            token: token.to_string(),
            token_address: token_address.to_string(),
            score: score.min(100.0),
            social_volume,
            social_velocity,
            sentiment_momentum,
            engagement_momentum,
            community_growth,
            price_divergence,
            timestamp: now,
        }
    }

    fn compute_social_volume(&self, trend_history: &[TrendData]) -> f32 {
        let total_mentions: i32 = trend_history.iter().rev().take(24).map(|t| t.mention_count).sum();
        (total_mentions as f32 / 500.0).min(100.0)
    }

    fn compute_velocity(&self, trend_history: &[TrendData]) -> f32 {
        if trend_history.len() < 4 {
            return 0.0;
        }

        let recent: f32 = trend_history.iter().rev().take(12).map(|t| t.velocity).sum();
        let previous: f32 = trend_history.iter().rev().skip(12).take(12).map(|t| t.velocity).sum();

        if previous.abs() < 0.01 {
            (recent * 10.0).min(100.0)
        } else {
            (((recent - previous) / previous) * 100.0).abs().min(100.0)
        }
    }

    fn compute_sentiment_momentum(&self, history: &[SentimentHistory]) -> f32 {
        if history.len() < 4 {
            return 0.0;
        }

        let recent_avg: f32 = history
            .iter()
            .rev()
            .take(12)
            .map(|s| s.sentiment_score)
            .sum::<f32>()
            / 12.0;
        let previous_avg: f32 = history
            .iter()
            .rev()
            .skip(12)
            .take(12)
            .map(|s| s.sentiment_score)
            .sum::<f32>()
            / 12.0;

        ((recent_avg - previous_avg).abs() * 100.0).min(100.0)
    }

    fn compute_engagement_momentum(&self, trend_history: &[TrendData]) -> f32 {
        if trend_history.len() < 8 {
            return 0.0;
        }
        let recent: f32 = trend_history.iter().rev().take(12).map(|t| t.momentum_score).sum();
        let previous: f32 = trend_history.iter().rev().skip(12).take(12).map(|t| t.momentum_score).sum();
        if previous.abs() < 0.01 {
            (recent / 10.0).min(100.0)
        } else {
            (((recent - previous) / previous).abs() * 100.0).min(100.0)
        }
    }

    fn compute_community_growth(&self, trend_history: &[TrendData]) -> f32 {
        let total_momentum: f32 = trend_history.iter().rev().take(24).map(|t| t.momentum_score).sum();
        (total_momentum / 50.0).min(100.0)
    }

    fn compute_price_divergence(&self, sentiment_history: &[SentimentHistory]) -> f32 {
        if sentiment_history.len() < 2 {
            return 0.0;
        }

        let recent_sentiment: f32 = sentiment_history
            .iter()
            .rev()
            .take(6)
            .map(|s| s.sentiment_score)
            .sum::<f32>()
            / 6.0;
        let prior_sentiment: f32 = sentiment_history
            .iter()
            .rev()
            .skip(6)
            .take(6)
            .map(|s| s.sentiment_score)
            .sum::<f32>()
            / 6.0;

        ((recent_sentiment - prior_sentiment) * 100.0).abs().min(100.0)
    }
}

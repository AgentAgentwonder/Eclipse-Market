use super::storage::TrendData;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct TrendingToken {
    pub token: String,
    pub token_address: String,
    pub momentum_score: f32,
    pub mention_change_24h: f32,
    pub sentiment_score: f32,
    pub velocity: f32,
    pub stage: TrendStage,
    pub leading_platforms: Vec<String>,
    pub influencers_contributing: usize,
    pub whale_support: bool,
    pub timestamp: i64,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub enum TrendStage {
    Emerging,
    Trending,
    Peak,
    Cooling,
    Declining,
}

impl Default for TrendStage {
    fn default() -> Self {
        TrendStage::Emerging
    }
}

pub struct TrendDetector;

impl TrendDetector {
    pub fn new() -> Self {
        Self
    }

    pub fn detect_trends(
        &self,
        trend_data: &HashMap<String, Vec<TrendData>>,
    ) -> Vec<TrendingToken> {
        let mut tokens = Vec::new();
        let now = Utc::now().timestamp();

        for data in trend_data.values() {
            if let Some(latest) = data.last() {
                let stage = self.determine_stage(data);
                let mention_change = self.calculate_mention_change(data);
                let leading_platforms = self.identify_leading_platforms(data);

                tokens.push(TrendingToken {
                    token: latest.token.clone(),
                    token_address: latest.token_address.clone(),
                    momentum_score: latest.momentum_score,
                    mention_change_24h: mention_change,
                    sentiment_score: latest.sentiment_score,
                    velocity: latest.velocity,
                    stage,
                    leading_platforms,
                    influencers_contributing: 0,
                    whale_support: latest.momentum_score > 65.0,
                    timestamp: now,
                });
            }
        }

        tokens.sort_by(|a, b| b.momentum_score.partial_cmp(&a.momentum_score).unwrap());
        tokens.truncate(20);
        tokens
    }

    fn determine_stage(&self, data: &[TrendData]) -> TrendStage {
        if data.is_empty() {
            return TrendStage::Emerging;
        }

        let latest = data.last().unwrap();
        let length = data.len();
        let window = data.iter().rev().take(5).collect::<Vec<_>>();

        if window.len() < 3 {
            return TrendStage::Emerging;
        }

        let momentum = latest.momentum_score;
        let velocity = latest.velocity;

        if momentum > 80.0 && velocity > 0.8 {
            TrendStage::Peak
        } else if momentum > 60.0 && velocity > 0.5 {
            TrendStage::Trending
        } else if momentum > 40.0 && velocity > 0.2 {
            TrendStage::Emerging
        } else if velocity < -0.3 {
            if length > 5 {
                TrendStage::Declining
            } else {
                TrendStage::Cooling
            }
        } else {
            TrendStage::Cooling
        }
    }

    fn calculate_mention_change(&self, data: &[TrendData]) -> f32 {
        if data.len() < 2 {
            return 0.0;
        }

        let latest = data.last().unwrap();
        let mut previous_mentions = 0;
        let mut latest_mentions = 0;

        for entry in data.iter().rev().take(24) {
            latest_mentions += entry.mention_count;
        }

        for entry in data.iter().rev().skip(24).take(24) {
            previous_mentions += entry.mention_count;
        }

        if previous_mentions == 0 {
            return latest_mentions as f32;
        }

        ((latest_mentions - previous_mentions) as f32 / previous_mentions as f32) * 100.0
    }

    fn identify_leading_platforms(&self, data: &[TrendData]) -> Vec<String> {
        let mut platform_scores: HashMap<String, f32> = HashMap::new();

        for entry in data.iter().rev().take(24) {
            *platform_scores.entry(entry.platform.clone()).or_insert(0.0) += entry.momentum_score;
        }

        let mut platforms: Vec<(String, f32)> = platform_scores.into_iter().collect();
        platforms.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());
        platforms
            .into_iter()
            .map(|(platform, _)| platform)
            .take(3)
            .collect()
    }
}

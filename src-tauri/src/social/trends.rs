use super::types::*;
use chrono::Utc;
use std::collections::HashMap;

pub struct TrendDetector {
    sentiment_history: HashMap<String, Vec<SentimentDataPoint>>,
    volume_history: HashMap<String, Vec<VolumeDataPoint>>,
}

impl TrendDetector {
    pub fn new() -> Self {
        Self {
            sentiment_history: HashMap::new(),
            volume_history: HashMap::new(),
        }
    }

    pub fn update_trends(
        &mut self,
        mentions: &[SocialMention],
        existing_momentum: Option<&[SocialMomentum]>,
    ) -> Vec<TrendData> {
        let mut token_mentions: HashMap<String, Vec<&SocialMention>> = HashMap::new();
        for mention in mentions {
            if let Some(token_address) = &mention.token_address {
                token_mentions
                    .entry(token_address.clone())
                    .or_default()
                    .push(mention);
            }
        }

        let mut trends = Vec::new();
        for (token_address, token_mentions) in token_mentions.iter() {
            let mention_count = token_mentions.len() as i64;
            let sentiment_avg = token_mentions
                .iter()
                .map(|mention| mention.sentiment_score)
                .sum::<f64>()
                / mention_count.max(1) as f64;
            let now = Utc::now().timestamp();

            self.sentiment_history
                .entry(token_address.clone())
                .or_default()
                .push(SentimentDataPoint {
                    timestamp: now,
                    score: sentiment_avg,
                    mentions: mention_count,
                });
            self.volume_history
                .entry(token_address.clone())
                .or_default()
                .push(VolumeDataPoint {
                    timestamp: now,
                    volume: mention_count,
                });

            let sentiment_trend = self
                .sentiment_history
                .get(token_address)
                .cloned()
                .unwrap_or_default();
            let volume_trend = self
                .volume_history
                .get(token_address)
                .cloned()
                .unwrap_or_default();

            let velocity = self.calculate_velocity(&volume_trend);
            let acceleration = self.calculate_acceleration(&volume_trend);
            let current_rank = self.calculate_rank(mention_count as f64, velocity);
            let rank_change = self.calculate_rank_change(token_address, existing_momentum);

            trends.push(TrendData {
                token_address: token_address.clone(),
                token_symbol: token_mentions
                    .first()
                    .and_then(|mention| mention.token_symbol.clone())
                    .unwrap_or_else(|| "SOL".to_string()),
                mention_count,
                velocity,
                acceleration,
                sentiment_trend,
                volume_trend,
                peak_time: Some(now),
                current_rank,
                rank_change,
                detected_at: now,
            });
        }

        trends
    }

    fn calculate_velocity(&self, volume_trend: &[VolumeDataPoint]) -> f64 {
        if volume_trend.len() < 2 {
            return 0.0;
        }

        let recent = &volume_trend[volume_trend.len() - 1];
        let previous = &volume_trend[volume_trend.len() - 2];
        let delta_volume = (recent.volume - previous.volume) as f64;
        let delta_time = (recent.timestamp - previous.timestamp) as f64;
        if delta_time == 0.0 {
            0.0
        } else {
            delta_volume / delta_time.max(60.0)
        }
    }

    fn calculate_acceleration(&self, volume_trend: &[VolumeDataPoint]) -> f64 {
        if volume_trend.len() < 3 {
            return 0.0;
        }

        let len = volume_trend.len();
        let v1 = self.calculate_velocity(&volume_trend[len - 2..]);
        let v0 = self.calculate_velocity(&volume_trend[len - 3..len - 1]);
        v1 - v0
    }

    fn calculate_rank(&self, mention_count: f64, velocity: f64) -> usize {
        let score = mention_count * 0.7 + velocity * 1000.0 * 0.3;
        if score > 10000.0 {
            1
        } else if score > 5000.0 {
            2
        } else if score > 2500.0 {
            3
        } else if score > 1000.0 {
            4
        } else {
            5
        }
    }

    fn calculate_rank_change(
        &self,
        token_address: &str,
        existing_momentum: Option<&[SocialMomentum]>,
    ) -> i32 {
        if let Some(momentum) = existing_momentum {
            if let Some(previous) = momentum.iter().find(|m| m.token_address == token_address) {
                let previous_rank = previous.trending_rank.unwrap_or(5) as i32;
                return (previous_rank - 3) * -1; // simple heuristic
            }
        }
        0
    }
}

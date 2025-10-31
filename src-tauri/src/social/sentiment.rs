use super::types::*;
use std::collections::HashMap;
use chrono::Utc;

pub struct EnhancedSentimentAnalyzer;

impl EnhancedSentimentAnalyzer {
    pub fn new() -> Self {
        Self
    }

    pub fn analyze(&self, text: &str) -> (f64, String) {
        let result = crate::sentiment::analyze_sentiment(text);
        (result.score, result.label)
    }

    pub fn aggregate_mentions(&self, mentions: &[SocialMention]) -> f64 {
        if mentions.is_empty() {
            return 0.0;
        }

        let mut total_score = 0.0;
        let mut total_weight = 0.0;

        for mention in mentions {
            let engagement_weight = (mention.engagement.likes +
                mention.engagement.retweets * 2 +
                mention.engagement.replies) as f64 / 10.0;
            let weight = engagement_weight.max(1.0);
            total_score += mention.sentiment_score * weight;
            total_weight += weight;
        }

        if total_weight > 0.0 {
            total_score / total_weight
        } else {
            0.0
        }
    }

    pub fn calculate_fomo_fud_gauge(
        &self,
        token_address: &str,
        token_symbol: &str,
        mentions: &[SocialMention],
    ) -> FomoFudGauge {
        let mut fomo_score = 0.0;
        let mut fud_score = 0.0;
        let mut total_weight = 0.0;
        let mut factors = Vec::new();

        for mention in mentions {
            if mention.token_address.as_deref() != Some(token_address) &&
               mention.token_symbol.as_deref() != Some(token_symbol) {
                continue;
            }

            let weight = 1.0 + (mention.engagement.likes + mention.engagement.retweets) as f64 / 1000.0;
            total_weight += weight;

            if mention.sentiment_score > 0.3 {
                fomo_score += mention.sentiment_score * weight;
                if mention.sentiment_score > 0.7 {
                    factors.push(GaugeFactor {
                        factor_type: "high_sentiment_post".to_string(),
                        impact: mention.sentiment_score,
                        description: format!("High sentiment from @{}", mention.author),
                    });
                }
            } else if mention.sentiment_score < -0.3 {
                fud_score += mention.sentiment_score.abs() * weight;
                if mention.sentiment_score < -0.7 {
                    factors.push(GaugeFactor {
                        factor_type: "negative_sentiment_post".to_string(),
                        impact: mention.sentiment_score.abs(),
                        description: format!("Negative sentiment from @{}", mention.author),
                    });
                }
            }
        }

        if total_weight > 0.0 {
            fomo_score /= total_weight;
            fud_score /= total_weight;
        }

        let net_sentiment = fomo_score - fud_score;
        let confidence = (total_weight / (mentions.len() as f64 + 1.0)).min(1.0);

        FomoFudGauge {
            token_address: token_address.to_string(),
            token_symbol: token_symbol.to_string(),
            fomo_score: fomo_score.max(0.0).min(1.0),
            fud_score: fud_score.max(0.0).min(1.0),
            net_sentiment,
            confidence,
            contributing_factors: factors,
            last_updated: Utc::now().timestamp(),
        }
    }

    pub fn detect_sentiment_shifts(
        &self,
        current_mentions: &[SocialMention],
        previous_mentions: &[SocialMention],
    ) -> Vec<SocialAlert> {
        let current_sentiment = self.aggregate_mentions(current_mentions);
        let previous_sentiment = self.aggregate_mentions(previous_mentions);
        let shift = (current_sentiment - previous_sentiment).abs();

        let mut alerts = Vec::new();

        if shift > 0.4 {
            let alert_type = if current_sentiment > previous_sentiment {
                SocialAlertType::FomoAlert
            } else {
                SocialAlertType::FudAlert
            };

            let severity = if shift > 0.7 {
                AlertSeverity::Critical
            } else if shift > 0.5 {
                AlertSeverity::High
            } else {
                AlertSeverity::Medium
            };

            let mut metadata = HashMap::new();
            metadata.insert(
                "current_sentiment".to_string(),
                serde_json::json!(current_sentiment),
            );
            metadata.insert(
                "previous_sentiment".to_string(),
                serde_json::json!(previous_sentiment),
            );
            metadata.insert("shift".to_string(), serde_json::json!(shift));

            alerts.push(SocialAlert {
                id: uuid::Uuid::new_v4().to_string(),
                alert_type,
                severity,
                title: format!("Sentiment Shift Detected"),
                message: format!(
                    "Sentiment shifted by {:.1}% in recent mentions",
                    shift * 100.0
                ),
                token_address: None,
                token_symbol: None,
                influencer_id: None,
                whale_address: None,
                metadata,
                timestamp: Utc::now().timestamp(),
                acknowledged: false,
            });
        }

        alerts
    }
}

use super::types::*;
use chrono::Utc;

pub struct SocialScoringEngine;

impl SocialScoringEngine {
    pub fn new() -> Self {
        Self
    }

    pub fn compute_momentum(
        &self,
        token_address: &str,
        token_symbol: &str,
        mentions: &[SocialMention],
        whale_movements: &[WhaleMovement],
        influencer_mentions: &[SocialMention],
    ) -> SocialMomentum {
        let sentiment_score = self.sentiment_component(mentions);
        let volume_score = self.volume_component(mentions);
        let whale_score = self.whale_component(token_address, whale_movements);
        let influencer_score = self.influencer_component(token_address, influencer_mentions);

        let momentum_score = (sentiment_score * 0.35)
            + (volume_score * 0.25)
            + (whale_score * 0.25)
            + (influencer_score * 0.15);

        SocialMomentum {
            token_address: token_address.to_string(),
            token_symbol: token_symbol.to_string(),
            momentum_score,
            sentiment_score,
            volume_score,
            influencer_score,
            whale_score,
            trending_rank: None,
            timestamp: Utc::now().timestamp(),
        }
    }

    fn sentiment_component(&self, mentions: &[SocialMention]) -> f64 {
        if mentions.is_empty() {
            return 0.5;
        }
        let total = mentions.len() as f64;
        let positive = mentions
            .iter()
            .filter(|m| m.sentiment_score > 0.3)
            .count() as f64;
        let negative = mentions
            .iter()
            .filter(|m| m.sentiment_score < -0.3)
            .count() as f64;
        ((positive - negative) / total + 1.0) / 2.0
    }

    fn volume_component(&self, mentions: &[SocialMention]) -> f64 {
        let volume = mentions.len() as f64;
        (volume / 100.0).min(1.0)
    }

    fn whale_component(&self, token_address: &str, whale_movements: &[WhaleMovement]) -> f64 {
        let relevant: Vec<&WhaleMovement> = whale_movements
            .iter()
            .filter(|m| m.token_address == token_address)
            .collect();
        if relevant.is_empty() {
            return 0.1;
        }
        let mut score = 0.5;
        for movement in relevant {
            match movement.movement_type {
                MovementType::Buy | MovementType::LiquidityAdd => {
                    score += movement.impact_score * 0.2;
                }
                MovementType::Sell | MovementType::LiquidityRemove => {
                    score -= movement.impact_score * 0.2;
                }
                _ => {}
            }
        }
        score.clamp(0.0, 1.0)
    }

    fn influencer_component(
        &self,
        token_address: &str,
        influencer_mentions: &[SocialMention],
    ) -> f64 {
        let relevant: Vec<&SocialMention> = influencer_mentions
            .iter()
            .filter(|m| m.token_address.as_deref() == Some(token_address))
            .collect();
        if relevant.is_empty() {
            return 0.2;
        }
        let engagement: f64 = relevant
            .iter()
            .map(|m| (m.engagement.likes + m.engagement.retweets * 2) as f64)
            .sum();
        (engagement / 10_000.0).min(1.0)
    }

    pub fn build_alerts(
        &self,
        momentum: &[SocialMomentum],
        gauges: &[FomoFudGauge],
    ) -> Vec<SocialAlert> {
        let mut alerts = Vec::new();
        for gauge in gauges {
            if gauge.fomo_score > 0.7 {
                alerts.push(SocialAlert {
                    id: uuid::Uuid::new_v4().to_string(),
                    alert_type: SocialAlertType::FomoAlert,
                    severity: if gauge.fomo_score > 0.85 {
                        AlertSeverity::Critical
                    } else {
                        AlertSeverity::High
                    },
                    title: format!("FOMO building in {}", gauge.token_symbol),
                    message: format!(
                        "Elevated FOMO score detected ({:.1}%)",
                        gauge.fomo_score * 100.0
                    ),
                    token_address: Some(gauge.token_address.clone()),
                    token_symbol: Some(gauge.token_symbol.clone()),
                    influencer_id: None,
                    whale_address: None,
                    metadata: serde_json::json!({
                        "fomo_score": gauge.fomo_score,
                        "net_sentiment": gauge.net_sentiment,
                    })
                    .as_object()
                    .cloned()
                    .unwrap_or_default(),
                    timestamp: gauge.last_updated,
                    acknowledged: false,
                });
            } else if gauge.fud_score > 0.7 {
                alerts.push(SocialAlert {
                    id: uuid::Uuid::new_v4().to_string(),
                    alert_type: SocialAlertType::FudAlert,
                    severity: if gauge.fud_score > 0.85 {
                        AlertSeverity::Critical
                    } else {
                        AlertSeverity::High
                    },
                    title: format!("FUD escalating in {}", gauge.token_symbol),
                    message: format!(
                        "Elevated FUD score detected ({:.1}%)",
                        gauge.fud_score * 100.0
                    ),
                    token_address: Some(gauge.token_address.clone()),
                    token_symbol: Some(gauge.token_symbol.clone()),
                    influencer_id: None,
                    whale_address: None,
                    metadata: serde_json::json!({
                        "fud_score": gauge.fud_score,
                        "net_sentiment": gauge.net_sentiment,
                    })
                    .as_object()
                    .cloned()
                    .unwrap_or_default(),
                    timestamp: gauge.last_updated,
                    acknowledged: false,
                });
            }
        }

        for item in momentum {
            if item.momentum_score > 0.75 {
                alerts.push(SocialAlert {
                    id: uuid::Uuid::new_v4().to_string(),
                    alert_type: SocialAlertType::TrendingToken,
                    severity: AlertSeverity::Medium,
                    title: format!("{} trending socially", item.token_symbol),
                    message: format!(
                        "Momentum score at {:.1}%", item.momentum_score * 100.0
                    ),
                    token_address: Some(item.token_address.clone()),
                    token_symbol: Some(item.token_symbol.clone()),
                    influencer_id: None,
                    whale_address: None,
                    metadata: serde_json::json!({
                        "momentum_score": item.momentum_score,
                        "sentiment_score": item.sentiment_score,
                        "whale_score": item.whale_score,
                    })
                    .as_object()
                    .cloned()
                    .unwrap_or_default(),
                    timestamp: item.timestamp,
                    acknowledged: false,
                });
            }
        }

        alerts
    }
}

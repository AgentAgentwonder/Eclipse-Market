use super::storage::{Influencer, InfluencerMention};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct InfluencerLeaderboard {
    pub top_by_accuracy: Vec<Influencer>,
    pub top_by_impact: Vec<Influencer>,
    pub top_by_early_detection: Vec<Influencer>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct InfluencerImpact {
    pub influencer: Influencer,
    pub recent_mentions: Vec<InfluencerMention>,
    pub avg_impact: f32,
    pub best_call: Option<InfluencerMention>,
    pub worst_call: Option<InfluencerMention>,
    pub total_engagement: i32,
}

pub struct InfluencerTracker {
    top_influencers: Vec<Influencer>,
}

impl InfluencerTracker {
    pub fn new() -> Self {
        let top_influencers = Self::init_top_influencers();
        Self { top_influencers }
    }

    fn init_top_influencers() -> Vec<Influencer> {
        vec![
            Influencer {
                id: "crypto_whale_1".to_string(),
                handle: "@CryptoWhale".to_string(),
                platform: "twitter".to_string(),
                follower_count: 1_500_000,
                verified: true,
                category: "trading".to_string(),
                credibility_score: 0.85,
                accuracy_rate: 72.5,
                avg_impact: 8.3,
                total_calls: 145,
                successful_calls: 105,
                is_tracked: false,
            },
            Influencer {
                id: "defi_alpha_1".to_string(),
                handle: "@DeFiAlpha".to_string(),
                platform: "twitter".to_string(),
                follower_count: 850_000,
                verified: true,
                category: "defi".to_string(),
                credibility_score: 0.78,
                accuracy_rate: 68.2,
                avg_impact: 6.7,
                total_calls: 98,
                successful_calls: 67,
                is_tracked: false,
            },
            Influencer {
                id: "solana_degen_1".to_string(),
                handle: "@SolanaDegen".to_string(),
                platform: "twitter".to_string(),
                follower_count: 650_000,
                verified: false,
                category: "memecoins".to_string(),
                credibility_score: 0.62,
                accuracy_rate: 55.8,
                avg_impact: 12.5,
                total_calls: 203,
                successful_calls: 113,
                is_tracked: false,
            },
            Influencer {
                id: "tech_analyst_1".to_string(),
                handle: "@TechAnalyst".to_string(),
                platform: "twitter".to_string(),
                follower_count: 920_000,
                verified: true,
                category: "analysis".to_string(),
                credibility_score: 0.88,
                accuracy_rate: 75.3,
                avg_impact: 5.2,
                total_calls: 87,
                successful_calls: 65,
                is_tracked: false,
            },
            Influencer {
                id: "nft_insider_1".to_string(),
                handle: "@NFTInsider".to_string(),
                platform: "twitter".to_string(),
                follower_count: 420_000,
                verified: true,
                category: "nft".to_string(),
                credibility_score: 0.71,
                accuracy_rate: 61.4,
                avg_impact: 7.1,
                total_calls: 64,
                successful_calls: 39,
                is_tracked: false,
            },
        ]
    }

    pub fn get_influencers(&self) -> Vec<Influencer> {
        self.top_influencers.clone()
    }

    pub fn get_influencer(&self, id: &str) -> Option<Influencer> {
        self.top_influencers.iter().find(|i| i.id == id).cloned()
    }

    pub fn calculate_influencer_impact(
        &self,
        influencer_id: &str,
        mentions: Vec<InfluencerMention>,
    ) -> Option<InfluencerImpact> {
        let influencer = self.get_influencer(influencer_id)?;

        let mut total_impact = 0.0;
        let mut total_engagement = 0;
        let mut best_call: Option<InfluencerMention> = None;
        let mut worst_call: Option<InfluencerMention> = None;

        for mention in &mentions {
            total_engagement += mention.engagement;
            if let Some(impact) = mention.impact_score {
                total_impact += impact;

                if best_call
                    .as_ref()
                    .map(|b| b.impact_score.unwrap_or(0.0))
                    < Some(impact)
                {
                    best_call = Some(mention.clone());
                }

                if worst_call
                    .as_ref()
                    .map(|w| w.impact_score.unwrap_or(0.0))
                    > Some(impact)
                    || worst_call.is_none()
                {
                    worst_call = Some(mention.clone());
                }
            }
        }

        let avg_impact = if !mentions.is_empty() {
            total_impact / mentions.len() as f32
        } else {
            0.0
        };

        Some(InfluencerImpact {
            influencer,
            recent_mentions: mentions.into_iter().take(20).collect(),
            avg_impact,
            best_call,
            worst_call,
            total_engagement,
        })
    }

    pub fn generate_leaderboard(
        &self,
        all_influencers: &[Influencer],
    ) -> InfluencerLeaderboard {
        let mut by_accuracy = all_influencers.to_vec();
        let mut by_impact = all_influencers.to_vec();
        let mut by_early = all_influencers.to_vec();

        by_accuracy.sort_by(|a, b| b.accuracy_rate.partial_cmp(&a.accuracy_rate).unwrap());
        by_impact.sort_by(|a, b| b.avg_impact.partial_cmp(&a.avg_impact).unwrap());
        by_early.sort_by(|a, b| b.credibility_score.partial_cmp(&a.credibility_score).unwrap());

        InfluencerLeaderboard {
            top_by_accuracy: by_accuracy.into_iter().take(10).collect(),
            top_by_impact: by_impact.into_iter().take(10).collect(),
            top_by_early_detection: by_early.into_iter().take(10).collect(),
        }
    }

    pub fn detect_coordinated_mentions(
        &self,
        mentions: &[InfluencerMention],
        time_window_seconds: i64,
    ) -> Vec<(String, Vec<String>)> {
        let mut token_mentions: HashMap<String, Vec<(i64, String)>> = HashMap::new();

        for mention in mentions {
            token_mentions
                .entry(mention.token_address.clone())
                .or_insert_with(Vec::new)
                .push((mention.timestamp, mention.influencer_handle.clone()));
        }

        let mut coordinated = Vec::new();

        for (token_addr, timestamps) in token_mentions {
            if timestamps.len() >= 3 {
                let mut sorted = timestamps.clone();
                sorted.sort_by_key(|t| t.0);

                let first = sorted[0].0;
                let last = sorted[sorted.len() - 1].0;

                if last - first <= time_window_seconds {
                    let handles: Vec<String> = sorted.into_iter().map(|t| t.1).collect();
                    coordinated.push((token_addr, handles));
                }
            }
        }

        coordinated
    }
}

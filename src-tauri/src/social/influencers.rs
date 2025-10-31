use super::types::*;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use chrono::Utc;

pub type SharedInfluencerManager = Arc<RwLock<InfluencerManager>>;

pub struct InfluencerManager {
    influencers: HashMap<String, Influencer>,
}

impl InfluencerManager {
    pub fn new() -> Self {
        Self {
            influencers: HashMap::new(),
        }
    }

    pub fn add_influencer(&mut self, influencer: Influencer) -> Result<(), String> {
        if self.influencers.contains_key(&influencer.id) {
            return Err("Influencer already exists".to_string());
        }
        self.influencers.insert(influencer.id.clone(), influencer);
        Ok(())
    }

    pub fn remove_influencer(&mut self, id: &str) -> Result<(), String> {
        if self.influencers.remove(id).is_none() {
            return Err("Influencer not found".to_string());
        }
        Ok(())
    }

    pub fn update_influencer(&mut self, influencer: Influencer) -> Result<(), String> {
        if !self.influencers.contains_key(&influencer.id) {
            return Err("Influencer not found".to_string());
        }
        self.influencers.insert(influencer.id.clone(), influencer);
        Ok(())
    }

    pub fn get_influencer(&self, id: &str) -> Option<Influencer> {
        self.influencers.get(id).cloned()
    }

    pub fn get_all_influencers(&self) -> Vec<Influencer> {
        self.influencers.values().cloned().collect()
    }

    pub fn get_active_influencers(&self) -> Vec<Influencer> {
        self.influencers
            .values()
            .filter(|i| i.active)
            .cloned()
            .collect()
    }

    pub fn get_influencers_by_platform(&self, platform: SocialPlatform) -> Vec<Influencer> {
        self.influencers
            .values()
            .filter(|i| i.platform == platform)
            .cloned()
            .collect()
    }

    pub fn set_active(&mut self, id: &str, active: bool) -> Result<(), String> {
        if let Some(influencer) = self.influencers.get_mut(id) {
            influencer.active = active;
            Ok(())
        } else {
            Err("Influencer not found".to_string())
        }
    }

    pub fn calculate_influence_score(&mut self, id: &str) -> Result<f64, String> {
        if let Some(influencer) = self.influencers.get_mut(id) {
            let base_score = (influencer.follower_count as f64).log10() / 7.0;
            let verified_bonus = if influencer.verified { 0.2 } else { 0.0 };
            let score = (base_score + verified_bonus).min(1.0);
            influencer.influence_score = score;
            Ok(score)
        } else {
            Err("Influencer not found".to_string())
        }
    }

    pub fn add_default_influencers(&mut self) {
        let defaults = vec![
            Influencer {
                id: uuid::Uuid::new_v4().to_string(),
                name: "Crypto Analyst".to_string(),
                platform: SocialPlatform::Twitter,
                handle: "@cryptoanalyst".to_string(),
                follower_count: 100000,
                verified: true,
                influence_score: 0.8,
                active: true,
                tags: vec!["analyst".to_string(), "solana".to_string()],
                added_at: Utc::now().timestamp(),
            },
            Influencer {
                id: uuid::Uuid::new_v4().to_string(),
                name: "Whale Watcher".to_string(),
                platform: SocialPlatform::Twitter,
                handle: "@whalewatcher".to_string(),
                follower_count: 50000,
                verified: true,
                influence_score: 0.7,
                active: true,
                tags: vec!["whale".to_string(), "trader".to_string()],
                added_at: Utc::now().timestamp(),
            },
        ];

        for influencer in defaults {
            let _ = self.add_influencer(influencer);
        }
    }
}

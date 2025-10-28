use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewCoin {
    pub address: String,
    pub symbol: String,
    pub name: String,
    pub creation_time: i64,
    pub liquidity: f64,
    pub initial_supply: f64,
    pub holder_count: u32,
    pub safety_score: f64,
    pub spam_filtered: bool,
    pub deployment_tx: String,
    pub creator_address: String,
    pub metadata_uri: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct SafetyAnalysis {
    pub is_safe: bool,
    pub score: f64,
    pub reasons: Vec<String>,
    pub warnings: Vec<String>,
}

#[derive(Debug)]
pub struct NewCoinsScanner {
    detected_coins: Arc<RwLock<HashMap<String, NewCoin>>>,
    spam_filters: SpamFilters,
}

#[derive(Debug)]
struct SpamFilters {
    min_liquidity: f64,
    min_holders: u32,
    blacklisted_creators: Vec<String>,
    suspicious_patterns: Vec<String>,
}

impl Default for SpamFilters {
    fn default() -> Self {
        Self {
            min_liquidity: 1000.0,
            min_holders: 5,
            blacklisted_creators: vec![],
            suspicious_patterns: vec![
                "scam".to_string(),
                "honeypot".to_string(),
                "rug".to_string(),
                "test".to_string(),
            ],
        }
    }
}

impl NewCoinsScanner {
    pub fn new() -> Self {
        Self {
            detected_coins: Arc::new(RwLock::new(HashMap::new())),
            spam_filters: SpamFilters::default(),
        }
    }

    pub async fn scan_new_deployments(&self) -> Result<Vec<NewCoin>, String> {
        let coins = self.detected_coins.read().await;
        let mut result: Vec<NewCoin> = coins.values().cloned().collect();
        result.sort_by(|a, b| b.creation_time.cmp(&a.creation_time));
        Ok(result)
    }

    pub async fn add_detected_coin(&self, coin: NewCoin) -> Result<(), String> {
        let filtered = self.apply_spam_filters(&coin);
        if filtered.spam_filtered {
            return Ok(());
        }

        let mut coins = self.detected_coins.write().await;
        coins.insert(coin.address.clone(), filtered);
        Ok(())
    }

    pub fn apply_spam_filters(&self, coin: &NewCoin) -> NewCoin {
        let mut coin = coin.clone();
        let mut is_spam = false;

        if coin.liquidity < self.spam_filters.min_liquidity {
            is_spam = true;
        }

        if coin.holder_count < self.spam_filters.min_holders {
            is_spam = true;
        }

        if self
            .spam_filters
            .blacklisted_creators
            .contains(&coin.creator_address)
        {
            is_spam = true;
        }

        let name_lower = coin.name.to_lowercase();
        let symbol_lower = coin.symbol.to_lowercase();
        for pattern in &self.spam_filters.suspicious_patterns {
            if name_lower.contains(pattern) || symbol_lower.contains(pattern) {
                is_spam = true;
                break;
            }
        }

        coin.spam_filtered = is_spam;
        coin
    }

    pub fn calculate_safety_score(&self, coin: &NewCoin) -> SafetyAnalysis {
        let mut score = 100.0;
        let mut reasons = Vec::new();
        let mut warnings = Vec::new();

        if coin.liquidity < 5000.0 {
            score -= 30.0;
            warnings.push("Low liquidity - high slippage risk".to_string());
        } else if coin.liquidity < 10000.0 {
            score -= 15.0;
            warnings.push("Moderate liquidity".to_string());
        } else {
            reasons.push("Good liquidity".to_string());
        }

        if coin.holder_count < 10 {
            score -= 25.0;
            warnings.push("Very few holders - potential rug pull risk".to_string());
        } else if coin.holder_count < 50 {
            score -= 10.0;
            warnings.push("Limited holder base".to_string());
        } else {
            reasons.push("Decent holder distribution".to_string());
        }

        if coin.initial_supply > 1_000_000_000.0 {
            score -= 20.0;
            warnings.push("Large initial supply - potential inflation risk".to_string());
        }

        if coin.metadata_uri.is_none() {
            score -= 10.0;
            warnings.push("Missing token metadata".to_string());
        }

        let age_hours = (Utc::now().timestamp() - coin.creation_time) / 3600;
        if age_hours < 1 {
            score -= 15.0;
            warnings.push("Very new token - extra caution advised".to_string());
        } else if age_hours < 24 {
            score -= 5.0;
            warnings.push("New token - monitor closely".to_string());
        }

        let is_safe = score >= 50.0;

        SafetyAnalysis {
            is_safe,
            score: score.max(0.0),
            reasons,
            warnings,
        }
    }

    pub async fn get_coin_by_address(&self, address: &str) -> Option<NewCoin> {
        let coins = self.detected_coins.read().await;
        coins.get(address).cloned()
    }

    pub async fn cleanup_old_coins(&self, max_age_hours: i64) {
        let mut coins = self.detected_coins.write().await;
        let now = Utc::now().timestamp();
        let cutoff = now - (max_age_hours * 3600);

        coins.retain(|_, coin| coin.creation_time > cutoff);
    }
}

pub fn mock_new_coin(symbol: &str, address: &str) -> NewCoin {
    use rand::Rng;
    let mut rng = rand::thread_rng();

    let now = Utc::now().timestamp();
    let age_seconds = rng.gen_range(300..7200);

    NewCoin {
        address: address.to_string(),
        symbol: symbol.to_string(),
        name: format!("{} Token", symbol),
        creation_time: now - age_seconds,
        liquidity: rng.gen_range(500.0..50000.0),
        initial_supply: rng.gen_range(100_000.0..10_000_000.0),
        holder_count: rng.gen_range(1..100),
        safety_score: rng.gen_range(30.0..95.0),
        spam_filtered: false,
        deployment_tx: format!("tx_{}", rng.gen_range(100000..999999)),
        creator_address: format!("creator_{}", rng.gen_range(1000..9999)),
        metadata_uri: if rng.gen_bool(0.7) {
            Some(format!("https://example.com/metadata/{}", address))
        } else {
            None
        },
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_spam_filter_low_liquidity() {
        let scanner = NewCoinsScanner::new();
        let coin = NewCoin {
            address: "test1".to_string(),
            symbol: "TEST".to_string(),
            name: "Test Token".to_string(),
            creation_time: Utc::now().timestamp(),
            liquidity: 500.0,
            initial_supply: 1_000_000.0,
            holder_count: 10,
            safety_score: 0.0,
            spam_filtered: false,
            deployment_tx: "tx1".to_string(),
            creator_address: "creator1".to_string(),
            metadata_uri: None,
        };

        let filtered = scanner.apply_spam_filters(&coin);
        assert!(filtered.spam_filtered, "Should filter low liquidity tokens");
    }

    #[tokio::test]
    async fn test_spam_filter_few_holders() {
        let scanner = NewCoinsScanner::new();
        let coin = NewCoin {
            address: "test2".to_string(),
            symbol: "TEST2".to_string(),
            name: "Test Token 2".to_string(),
            creation_time: Utc::now().timestamp(),
            liquidity: 5000.0,
            initial_supply: 1_000_000.0,
            holder_count: 2,
            safety_score: 0.0,
            spam_filtered: false,
            deployment_tx: "tx2".to_string(),
            creator_address: "creator2".to_string(),
            metadata_uri: None,
        };

        let filtered = scanner.apply_spam_filters(&coin);
        assert!(
            filtered.spam_filtered,
            "Should filter tokens with few holders"
        );
    }

    #[tokio::test]
    async fn test_spam_filter_suspicious_name() {
        let scanner = NewCoinsScanner::new();
        let coin = NewCoin {
            address: "test3".to_string(),
            symbol: "SCAM".to_string(),
            name: "Scam Token".to_string(),
            creation_time: Utc::now().timestamp(),
            liquidity: 5000.0,
            initial_supply: 1_000_000.0,
            holder_count: 20,
            safety_score: 0.0,
            spam_filtered: false,
            deployment_tx: "tx3".to_string(),
            creator_address: "creator3".to_string(),
            metadata_uri: None,
        };

        let filtered = scanner.apply_spam_filters(&coin);
        assert!(
            filtered.spam_filtered,
            "Should filter tokens with suspicious names"
        );
    }

    #[tokio::test]
    async fn test_legitimate_coin_not_filtered() {
        let scanner = NewCoinsScanner::new();
        let coin = NewCoin {
            address: "test4".to_string(),
            symbol: "LEGIT".to_string(),
            name: "Legitimate Token".to_string(),
            creation_time: Utc::now().timestamp(),
            liquidity: 50000.0,
            initial_supply: 1_000_000.0,
            holder_count: 100,
            safety_score: 0.0,
            spam_filtered: false,
            deployment_tx: "tx4".to_string(),
            creator_address: "creator4".to_string(),
            metadata_uri: Some("https://example.com/metadata".to_string()),
        };

        let filtered = scanner.apply_spam_filters(&coin);
        assert!(
            !filtered.spam_filtered,
            "Should not filter legitimate tokens"
        );
    }

    #[test]
    fn test_safety_score_calculation() {
        let scanner = NewCoinsScanner::new();

        let good_coin = NewCoin {
            address: "good".to_string(),
            symbol: "GOOD".to_string(),
            name: "Good Token".to_string(),
            creation_time: Utc::now().timestamp() - 86400,
            liquidity: 50000.0,
            initial_supply: 1_000_000.0,
            holder_count: 100,
            safety_score: 0.0,
            spam_filtered: false,
            deployment_tx: "tx_good".to_string(),
            creator_address: "creator_good".to_string(),
            metadata_uri: Some("https://example.com/metadata".to_string()),
        };

        let analysis = scanner.calculate_safety_score(&good_coin);
        assert!(analysis.is_safe, "Good token should be marked as safe");
        assert!(
            analysis.score > 80.0,
            "Good token should have high safety score"
        );

        let risky_coin = NewCoin {
            address: "risky".to_string(),
            symbol: "RISKY".to_string(),
            name: "Risky Token".to_string(),
            creation_time: Utc::now().timestamp() - 300,
            liquidity: 2000.0,
            initial_supply: 10_000_000_000.0,
            holder_count: 5,
            safety_score: 0.0,
            spam_filtered: false,
            deployment_tx: "tx_risky".to_string(),
            creator_address: "creator_risky".to_string(),
            metadata_uri: None,
        };

        let risky_analysis = scanner.calculate_safety_score(&risky_coin);
        assert!(
            !risky_analysis.is_safe,
            "Risky token should be marked as unsafe"
        );
        assert!(
            risky_analysis.score < 50.0,
            "Risky token should have low safety score"
        );
    }
}

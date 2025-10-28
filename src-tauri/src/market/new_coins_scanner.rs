use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Debug, Clone, Serialize, Deserialize)]
use serde::{Deserialize, Serialize};
use chrono::{Duration as ChronoDuration, Utc};
use sqlx::{Pool, Row, Sqlite, SqlitePool};
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::RwLock;
use tauri::AppHandle;

const NEW_COINS_DB_FILE: &str = "new_coins.db";
const SCAN_INTERVAL_SECS: u64 = 300; // 5 minutes

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
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
    pub logo_uri: Option<String>,
    pub created_at: String,
    pub liquidity: f64,
    pub mint_authority_revoked: bool,
    pub freeze_authority_revoked: bool,
    pub holder_count: i64,
    pub top_holder_percent: f64,
    pub creator_wallet: String,
    pub creator_reputation_score: f64,
    pub safety_score: i64,
    pub is_spam: bool,
    pub detected_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SafetyReport {
    pub address: String,
    pub symbol: String,
    pub name: String,
    pub safety_score: i64,
    pub checks: SafetyChecks,
    pub liquidity_info: LiquidityInfo,
    pub holder_info: HolderInfo,
    pub creator_info: CreatorInfo,
    pub recommendation: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SafetyChecks {
    pub mint_authority_revoked: bool,
    pub freeze_authority_revoked: bool,
    pub has_minimum_liquidity: bool,
    pub holder_distribution_healthy: bool,
    pub creator_reputation_good: bool,
    pub not_flagged_as_spam: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LiquidityInfo {
    pub total_liquidity: f64,
    pub pool_address: Option<String>,
    pub liquidity_locked: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HolderInfo {
    pub holder_count: i64,
    pub top_holder_percent: f64,
    pub top_10_holders_percent: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatorInfo {
    pub wallet_address: String,
    pub reputation_score: f64,
    pub previous_tokens_created: i64,
    pub suspicious_activity: bool,
}

#[derive(Debug, thiserror::Error)]
pub enum NewCoinsScannerError {
    #[error("database error: {0}")]
    Database(#[from] sqlx::Error),
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
    #[error("serialization error: {0}")]
    Serialization(#[from] serde_json::Error),
    #[error("internal error: {0}")]
    Internal(String),
}

pub struct NewCoinsScanner {
    pool: Pool<Sqlite>,
    app_handle: Option<AppHandle>,
}

impl NewCoinsScanner {
    pub async fn new(app: &AppHandle) -> Result<Self, NewCoinsScannerError> {
        let db_path = get_new_coins_db_path(app)?;
        let db_url = format!("sqlite:{}?mode=rwc", db_path.display());
        let pool = SqlitePool::connect(&db_url).await?;

        let scanner = Self {
            pool,
            app_handle: Some(app.clone()),
        };

        scanner.initialize().await?;
        Ok(scanner)
    }

    async fn initialize(&self) -> Result<(), NewCoinsScannerError> {
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS new_coins (
                address TEXT PRIMARY KEY,
                symbol TEXT NOT NULL,
                name TEXT NOT NULL,
                logo_uri TEXT,
                created_at TEXT NOT NULL,
                liquidity REAL NOT NULL,
                mint_authority_revoked INTEGER NOT NULL,
                freeze_authority_revoked INTEGER NOT NULL,
                holder_count INTEGER NOT NULL,
                top_holder_percent REAL NOT NULL,
                creator_wallet TEXT NOT NULL,
                creator_reputation_score REAL NOT NULL,
                safety_score INTEGER NOT NULL,
                is_spam INTEGER NOT NULL,
                detected_at TEXT NOT NULL
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        sqlx::query(
            r#"
            CREATE INDEX IF NOT EXISTS idx_new_coins_created ON new_coins(created_at);
            CREATE INDEX IF NOT EXISTS idx_new_coins_detected ON new_coins(detected_at);
            CREATE INDEX IF NOT EXISTS idx_new_coins_safety ON new_coins(safety_score);
            CREATE INDEX IF NOT EXISTS idx_new_coins_spam ON new_coins(is_spam);
            "#,
        )
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn scan_for_new_tokens(&self) -> Result<Vec<NewCoin>, NewCoinsScannerError> {
        // Mock implementation - In production, this would:
        // 1. Query Solana blockchain for new token mint accounts
        // 2. Filter by age (<24 hours)
        // 3. Fetch token metadata
        // 4. Check liquidity pools
        // 5. Analyze holder distribution
        // 6. Check mint/freeze authorities
        
        let mock_coins = self.generate_mock_new_coins().await?;
        
        // Store new coins in database
        for coin in &mock_coins {
            self.store_coin(coin).await?;
        }

        // Emit event for high-safety coins
        if let Some(app) = &self.app_handle {
            for coin in &mock_coins {
                if coin.safety_score >= 70 && !coin.is_spam {
                    let _ = app.emit_all("new-coin-detected", coin);
                }
            }
        }

        Ok(mock_coins)
    }

    async fn generate_mock_new_coins(&self) -> Result<Vec<NewCoin>, NewCoinsScannerError> {
        use rand::Rng;
        let mut rng = rand::thread_rng();
        let now = Utc::now();

        let mock_data = vec![
            ("MOON", "Moon Rocket", 85, false),
            ("DOGE2", "Doge 2.0", 45, true),
            ("SAFE", "Safe Token", 92, false),
            ("SCAM", "Scammy Coin", 15, true),
            ("GEM", "Hidden Gem", 78, false),
        ];

        let mut coins = Vec::new();
        
        for (idx, (symbol, name, base_safety, is_spam)) in mock_data.iter().enumerate() {
            let age_hours = rng.gen_range(0..24);
            let created_at = (now - ChronoDuration::hours(age_hours)).to_rfc3339();
            
            let mint_revoked = base_safety >= &50;
            let freeze_revoked = base_safety >= &60;
            let liquidity = if is_spam { 
                rng.gen_range(500.0..1500.0) 
            } else { 
                rng.gen_range(5000.0..50000.0) 
            };
            let holder_count = if is_spam { 
                rng.gen_range(5..50) 
            } else { 
                rng.gen_range(100..1000) 
            };
            let top_holder_percent = if is_spam { 
                rng.gen_range(60.0..95.0) 
            } else { 
                rng.gen_range(5.0..25.0) 
            };
            let creator_reputation = if is_spam { 
                rng.gen_range(0.0..0.3) 
            } else { 
                rng.gen_range(0.6..0.95) 
            };

            let coin = NewCoin {
                address: format!("{}mock{}", symbol, idx),
                symbol: symbol.to_string(),
                name: name.to_string(),
                logo_uri: None,
                created_at,
                liquidity,
                mint_authority_revoked: mint_revoked,
                freeze_authority_revoked: freeze_revoked,
                holder_count,
                top_holder_percent,
                creator_wallet: format!("Creator{}MockWallet", idx),
                creator_reputation_score: creator_reputation,
                safety_score: *base_safety,
                is_spam: *is_spam,
                detected_at: now.to_rfc3339(),
            };

            coins.push(coin);
        }

        Ok(coins)
    }

    async fn store_coin(&self, coin: &NewCoin) -> Result<(), NewCoinsScannerError> {
        sqlx::query(
            r#"
            INSERT OR REPLACE INTO new_coins (
                address, symbol, name, logo_uri, created_at, liquidity,
                mint_authority_revoked, freeze_authority_revoked,
                holder_count, top_holder_percent, creator_wallet,
                creator_reputation_score, safety_score, is_spam, detected_at
            ) VALUES (
                ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15
            )
            "#,
        )
        .bind(&coin.address)
        .bind(&coin.symbol)
        .bind(&coin.name)
        .bind(&coin.logo_uri)
        .bind(&coin.created_at)
        .bind(coin.liquidity)
        .bind(coin.mint_authority_revoked as i32)
        .bind(coin.freeze_authority_revoked as i32)
        .bind(coin.holder_count)
        .bind(coin.top_holder_percent)
        .bind(&coin.creator_wallet)
        .bind(coin.creator_reputation_score)
        .bind(coin.safety_score)
        .bind(coin.is_spam as i32)
        .bind(&coin.detected_at)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn get_new_coins(
        &self,
        hours: Option<i64>,
        min_safety_score: Option<i64>,
    ) -> Result<Vec<NewCoin>, NewCoinsScannerError> {
        let hours = hours.unwrap_or(24);
        let min_safety = min_safety_score.unwrap_or(0);
        let cutoff_time = (Utc::now() - ChronoDuration::hours(hours)).to_rfc3339();

        let rows = sqlx::query(
            r#"
            SELECT * FROM new_coins 
            WHERE created_at >= ?1 
            AND safety_score >= ?2 
            AND is_spam = 0
            ORDER BY created_at DESC
            "#,
        )
        .bind(cutoff_time)
        .bind(min_safety)
        .fetch_all(&self.pool)
        .await?;

        let coins = rows
            .into_iter()
            .map(|row| NewCoin {
                address: row.get("address"),
                symbol: row.get("symbol"),
                name: row.get("name"),
                logo_uri: row.get("logo_uri"),
                created_at: row.get("created_at"),
                liquidity: row.get("liquidity"),
                mint_authority_revoked: row.get::<i32, _>("mint_authority_revoked") != 0,
                freeze_authority_revoked: row.get::<i32, _>("freeze_authority_revoked") != 0,
                holder_count: row.get("holder_count"),
                top_holder_percent: row.get("top_holder_percent"),
                creator_wallet: row.get("creator_wallet"),
                creator_reputation_score: row.get("creator_reputation_score"),
                safety_score: row.get("safety_score"),
                is_spam: row.get::<i32, _>("is_spam") != 0,
                detected_at: row.get("detected_at"),
            })
            .collect();

        Ok(coins)
    }

    pub async fn get_safety_report(&self, token_address: &str) -> Result<SafetyReport, NewCoinsScannerError> {
        let row = sqlx::query(
            "SELECT * FROM new_coins WHERE address = ?1"
        )
        .bind(token_address)
        .fetch_optional(&self.pool)
        .await?;

        let coin = row.ok_or_else(|| {
            NewCoinsScannerError::Internal(format!("Token {} not found", token_address))
        })?;

        let mint_revoked = coin.get::<i32, _>("mint_authority_revoked") != 0;
        let freeze_revoked = coin.get::<i32, _>("freeze_authority_revoked") != 0;
        let liquidity: f64 = coin.get("liquidity");
        let holder_count: i64 = coin.get("holder_count");
        let top_holder_percent: f64 = coin.get("top_holder_percent");
        let creator_reputation: f64 = coin.get("creator_reputation_score");
        let safety_score: i64 = coin.get("safety_score");
        let is_spam = coin.get::<i32, _>("is_spam") != 0;

        let checks = SafetyChecks {
            mint_authority_revoked: mint_revoked,
            freeze_authority_revoked: freeze_revoked,
            has_minimum_liquidity: liquidity >= 1000.0,
            holder_distribution_healthy: top_holder_percent < 50.0,
            creator_reputation_good: creator_reputation >= 0.5,
            not_flagged_as_spam: !is_spam,
        };

        let liquidity_info = LiquidityInfo {
            total_liquidity: liquidity,
            pool_address: None,
            liquidity_locked: false, // Mock data
        };

        let holder_info = HolderInfo {
            holder_count,
            top_holder_percent,
            top_10_holders_percent: top_holder_percent * 2.5, // Mock calculation
        };

        let creator_info = CreatorInfo {
            wallet_address: coin.get("creator_wallet"),
            reputation_score: creator_reputation,
            previous_tokens_created: 0, // Mock data
            suspicious_activity: creator_reputation < 0.3,
        };

        let recommendation = if safety_score >= 80 {
            "Safe - Low risk for investment".to_string()
        } else if safety_score >= 50 {
            "Moderate - Exercise caution, do your own research".to_string()
        } else {
            "High Risk - Not recommended, likely scam".to_string()
        };

        Ok(SafetyReport {
            address: coin.get("address"),
            symbol: coin.get("symbol"),
            name: coin.get("name"),
            safety_score,
            checks,
            liquidity_info,
            holder_info,
            creator_info,
            recommendation,
        })
    }

    pub async fn cleanup_old_coins(&self, days: i64) -> Result<(), NewCoinsScannerError> {
        let cutoff_time = (Utc::now() - ChronoDuration::days(days)).to_rfc3339();
        
        sqlx::query(
            "DELETE FROM new_coins WHERE detected_at < ?1"
        )
        .bind(cutoff_time)
        .execute(&self.pool)
        .await?;

        Ok(())
    }
}

pub type SharedNewCoinsScanner = Arc<RwLock<NewCoinsScanner>>;

pub fn start_new_coins_scanner(scanner: SharedNewCoinsScanner) {
    tauri::async_runtime::spawn(async move {
        loop {
            {
                let scanner_guard = scanner.read().await;
                if let Err(e) = scanner_guard.scan_for_new_tokens().await {
                    eprintln!("Failed to scan for new tokens: {}", e);
                }
            }

            tokio::time::sleep(tokio::time::Duration::from_secs(SCAN_INTERVAL_SECS)).await;
        }
    });
}

fn get_new_coins_db_path(app: &AppHandle) -> Result<PathBuf, NewCoinsScannerError> {
    let mut path = app
        .path_resolver()
        .app_data_dir()
        .ok_or_else(|| NewCoinsScannerError::Internal("Unable to resolve app data directory".to_string()))?;

    std::fs::create_dir_all(&path)?;
    path.push(NEW_COINS_DB_FILE);
    Ok(path)
}

// Tauri Commands
#[tauri::command]
pub async fn get_new_coins(
    scanner: tauri::State<'_, SharedNewCoinsScanner>,
    hours: Option<i64>,
    min_safety_score: Option<i64>,
) -> Result<Vec<NewCoin>, String> {
    let scanner = scanner.read().await;
    scanner
        .get_new_coins(hours, min_safety_score)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_coin_safety_report(
    scanner: tauri::State<'_, SharedNewCoinsScanner>,
    token_address: String,
) -> Result<SafetyReport, String> {
    let scanner = scanner.read().await;
    scanner
        .get_safety_report(&token_address)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn scan_for_new_coins(
    scanner: tauri::State<'_, SharedNewCoinsScanner>,
) -> Result<Vec<NewCoin>, String> {
    let scanner = scanner.read().await;
    scanner
        .scan_for_new_tokens()
        .await
        .map_err(|e| e.to_string())
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
    use chrono::Utc;

    async fn setup_scanner() -> NewCoinsScanner {
        let pool = SqlitePool::connect("sqlite::memory:?cache=shared").await.unwrap();
        let scanner = NewCoinsScanner {
            pool,
            app_handle: None,
        };

        scanner.initialize().await.unwrap();
        scanner
    }

    fn sample_coin(address: &str, safety_score: i64, is_spam: bool) -> NewCoin {
        let now = Utc::now();
        NewCoin {
            address: address.to_string(),
            symbol: format!("SYM{}", address),
            name: format!("Sample Coin {}", address),
            logo_uri: None,
            created_at: now.to_rfc3339(),
            liquidity: 5000.0,
            mint_authority_revoked: true,
            freeze_authority_revoked: true,
            holder_count: 120,
            top_holder_percent: 20.0,
            creator_wallet: format!("Wallet{}", address),
            creator_reputation_score: 0.8,
            safety_score,
            is_spam,
            detected_at: now.to_rfc3339(),
        }
    }

    #[tokio::test]
    async fn stores_and_retrieves_new_coins() {
        let scanner = setup_scanner().await;
        let coin = sample_coin("1", 85, false);

        scanner.store_coin(&coin).await.unwrap();

        let coins = scanner.get_new_coins(Some(24), Some(0)).await.unwrap();
        assert_eq!(coins.len(), 1);
        assert_eq!(coins[0].address, coin.address);
    }

    #[tokio::test]
    async fn filters_by_safety_and_spam() {
        let scanner = setup_scanner().await;
        let safe_coin = sample_coin("safe", 90, false);
        let risky_coin = sample_coin("risky", 40, false);
        let spam_coin = sample_coin("spam", 95, true);

        scanner.store_coin(&safe_coin).await.unwrap();
        scanner.store_coin(&risky_coin).await.unwrap();
        scanner.store_coin(&spam_coin).await.unwrap();

        let coins = scanner.get_new_coins(Some(24), Some(80)).await.unwrap();
        assert_eq!(coins.len(), 1);
        assert_eq!(coins[0].address, safe_coin.address);
    }

    #[tokio::test]
    async fn generates_safety_report() {
        let scanner = setup_scanner().await;
        let coin = sample_coin("report", 82, false);

        scanner.store_coin(&coin).await.unwrap();

        let report = scanner.get_safety_report(&coin.address).await.unwrap();
        assert_eq!(report.address, coin.address);
        assert!(report.checks.mint_authority_revoked);
        assert!(report.checks.freeze_authority_revoked);
        assert!(report.checks.has_minimum_liquidity);
        assert!(report.checks.holder_distribution_healthy);
        assert!(report.checks.creator_reputation_good);
        assert!(report.checks.not_flagged_as_spam);
    }

    #[tokio::test]
    async fn scan_populates_database() {
        let scanner = setup_scanner().await;

        let results = scanner.scan_for_new_tokens().await.unwrap();
        assert!(!results.is_empty());

        let stored = scanner.get_new_coins(Some(24), Some(0)).await.unwrap();
        assert!(!stored.is_empty());
    }
}

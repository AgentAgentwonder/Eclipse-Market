use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{Pool, Row, Sqlite, SqlitePool};
use std::collections::HashMap;
use std::sync::Arc;
use tauri::{AppHandle, State};
use tokio::sync::RwLock;

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct RiskFeatures {
    // Holder concentration features
    pub gini_coefficient: f64,
    pub top_10_percentage: f64,
    pub total_holders: u64,
    
    // Liquidity features
    pub liquidity_usd: f64,
    pub liquidity_to_mcap_ratio: f64,
    
    // Developer features
    pub has_mint_authority: bool,
    pub has_freeze_authority: bool,
    pub verified: bool,
    pub audited: bool,
    
    // Sentiment features
    pub community_trust_score: f64,
    pub sentiment_score: f64,
    
    // Age and activity features
    pub token_age_days: f64,
    pub volume_24h: f64,
    pub price_volatility: f64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct RiskScore {
    pub token_address: String,
    pub score: f64, // 0-100 scale (0 = safe, 100 = very risky)
    pub risk_level: String, // "Low", "Medium", "High", "Critical"
    pub contributing_factors: Vec<RiskFactor>,
    pub timestamp: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct RiskFactor {
    pub factor_name: String,
    pub impact: f64, // Contribution to risk score
    pub severity: String, // "Low", "Medium", "High"
    pub description: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct RiskHistory {
    pub token_address: String,
    pub history: Vec<RiskHistoryPoint>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct RiskHistoryPoint {
    pub timestamp: String,
    pub score: f64,
    pub risk_level: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct RiskModel {
    // Logistic regression weights for each feature
    weights: HashMap<String, f64>,
    intercept: f64,
    threshold: f64,
}

impl RiskModel {
    pub fn new() -> Self {
        // Pre-trained weights based on common rug pull patterns
        let mut weights = HashMap::new();
        
        // High concentration = high risk
        weights.insert("gini_coefficient".to_string(), 30.0);
        weights.insert("top_10_percentage".to_string(), 0.5);
        
        // Low holder count = higher risk
        weights.insert("holder_count_inverse".to_string(), 15.0);
        
        // Low liquidity = high risk
        weights.insert("liquidity_score".to_string(), -20.0);
        
        // Mint/freeze authority = high risk
        weights.insert("mint_authority".to_string(), 25.0);
        weights.insert("freeze_authority".to_string(), 20.0);
        
        // Verification reduces risk
        weights.insert("verified".to_string(), -15.0);
        weights.insert("audited".to_string(), -20.0);
        
        // Community trust reduces risk
        weights.insert("community_trust".to_string(), -10.0);
        
        // Negative sentiment = higher risk
        weights.insert("sentiment".to_string(), -5.0);
        
        // Very new tokens = higher risk
        weights.insert("age_score".to_string(), -8.0);
        
        // High volatility = higher risk
        weights.insert("volatility".to_string(), 12.0);
        
        Self {
            weights,
            intercept: 50.0, // Base risk score
            threshold: 0.5,
        }
    }
    
    pub fn from_weights(weights: HashMap<String, f64>, intercept: f64) -> Self {
        Self {
            weights,
            intercept,
            threshold: 0.5,
        }
    }
    
    pub fn score_token(&self, features: &RiskFeatures) -> (f64, Vec<RiskFactor>) {
        let mut feature_map = HashMap::new();
        let mut contributing_factors = Vec::new();
        
        // Transform features into model inputs
        feature_map.insert("gini_coefficient", features.gini_coefficient.clamp(0.0, 1.0));

        let normalized_top10 = (features.top_10_percentage / 100.0).clamp(0.0, 1.0);
        feature_map.insert("top_10_percentage", normalized_top10);

        let holder_diversity = (((features.total_holders as f64).max(1.0) + 10.0).ln()).max(1.0);
        let holder_count_inverse = (1.0 / holder_diversity).clamp(0.0, 5.0);
        feature_map.insert("holder_count_inverse", holder_count_inverse);

        // Liquidity score (normalized)
        let liquidity_value = features.liquidity_usd.max(1.0);
        let liquidity_score = (liquidity_value.ln() / 20.0).clamp(0.0, 1.0);
        feature_map.insert("liquidity_score", liquidity_score);

        let liquidity_ratio = features.liquidity_to_mcap_ratio.clamp(0.0, 1.0);
        feature_map.insert("liquidity_to_mcap", liquidity_ratio);

        // Authority flags
        feature_map.insert("mint_authority", if features.has_mint_authority { 1.0 } else { 0.0 });
        feature_map.insert("freeze_authority", if features.has_freeze_authority { 1.0 } else { 0.0 });

        // Verification
        feature_map.insert("verified", if features.verified { 1.0 } else { 0.0 });
        feature_map.insert("audited", if features.audited { 1.0 } else { 0.0 });

        // Community and sentiment
        feature_map.insert("community_trust", features.community_trust_score.clamp(0.0, 1.0));
        feature_map.insert("sentiment", features.sentiment_score.clamp(-1.0, 1.0));

        // Age score (tokens older than 30 days get lower risk)
        let age_score = (features.token_age_days / 30.0).clamp(0.0, 1.0);
        feature_map.insert("age_score", age_score);

        // Volatility (normalized)
        let volatility_score = (features.price_volatility / 100.0).clamp(0.0, 1.0);
        feature_map.insert("volatility", volatility_score);
        
        // Calculate weighted score
        let mut score = self.intercept;
        let mut factor_contributions = Vec::new();
        
        for (feature_name, feature_value) in &feature_map {
            if let Some(&weight) = self.weights.get(*feature_name) {
                let contribution = weight * feature_value;
                score += contribution;
                
                factor_contributions.push((
                    feature_name.to_string(),
                    contribution.abs(),
                    contribution,
                ));
            }
        }
        
        // Clamp score to 0-100
        score = score.max(0.0).min(100.0);
        
        // Sort factors by absolute contribution
        factor_contributions.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
        
        // Create top contributing factors
        for (factor_name, abs_contrib, raw_contrib) in factor_contributions.iter().take(5) {
            if *abs_contrib > 1.0 {
                let (description, increases_risk) = match factor_name.as_str() {
                    "gini_coefficient" => ("High holder concentration detected", true),
                    "top_10_percentage" => ("Top 10 holders control significant supply", true),
                    "holder_count_inverse" => ("Low number of holders", true),
                    "liquidity_score" => ("Liquidity level", false),
                    "mint_authority" => ("Mint authority not revoked", true),
                    "freeze_authority" => ("Freeze authority not revoked", true),
                    "verified" => ("Token verification status", false),
                    "audited" => ("Security audit status", false),
                    "community_trust" => ("Community trust score", false),
                    "sentiment" => ("Market sentiment", false),
                    "age_score" => ("Token age", false),
                    "volatility" => ("Price volatility", true),
                    _ => ("Unknown factor", true),
                };
                
                let severity = if *abs_contrib > 15.0 {
                    "High"
                } else if *abs_contrib > 8.0 {
                    "Medium"
                } else {
                    "Low"
                };
                
                contributing_factors.push(RiskFactor {
                    factor_name: factor_name.clone(),
                    impact: *abs_contrib,
                    severity: severity.to_string(),
                    description: description.to_string(),
                });
            }
        }
        
        (score, contributing_factors)
    }
    
    // Serialize model to JSON for persistence
    pub fn to_json(&self) -> Result<String, String> {
        serde_json::to_string(self).map_err(|e| e.to_string())
    }
    
    // Deserialize model from JSON
    pub fn from_json(json: &str) -> Result<Self, String> {
        serde_json::from_str(json).map_err(|e| e.to_string())
    }
}

#[derive(Clone)]
pub struct RiskAnalyzer {
    pool: Pool<Sqlite>,
    model: Arc<RwLock<RiskModel>>,
}

pub type SharedRiskAnalyzer = Arc<RwLock<RiskAnalyzer>>;

impl RiskAnalyzer {
    pub async fn new(app: &AppHandle) -> Result<Self, sqlx::Error> {
        let mut db_path = app
            .path_resolver()
            .app_data_dir()
            .ok_or_else(|| sqlx::Error::Io(std::io::Error::new(
                std::io::ErrorKind::NotFound,
                "App data dir not found"
            )))?;
        
        std::fs::create_dir_all(&db_path).map_err(sqlx::Error::Io)?;
        db_path.push("risk_scores.db");
        
        let db_url = format!("sqlite:{}?mode=rwc", db_path.display());
        let pool = SqlitePool::connect(&db_url).await?;
        
        Self::with_pool(pool).await
    }
    
    pub async fn with_pool(pool: Pool<Sqlite>) -> Result<Self, sqlx::Error> {
        let model = Arc::new(RwLock::new(RiskModel::new()));
        let analyzer = Self { pool, model };
        analyzer.initialize().await?;
        Ok(analyzer)
    }
    
    async fn initialize(&self) -> Result<(), sqlx::Error> {
        // Create risk scores table
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS risk_scores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                token_address TEXT NOT NULL,
                score REAL NOT NULL,
                risk_level TEXT NOT NULL,
                factors TEXT NOT NULL,
                timestamp TEXT NOT NULL
            )
            "#,
        )
        .execute(&self.pool)
        .await?;
        
        // Create index
        sqlx::query(
            r#"
            CREATE INDEX IF NOT EXISTS idx_risk_scores_token_timestamp 
            ON risk_scores(token_address, timestamp DESC);
            "#,
        )
        .execute(&self.pool)
        .await?;
        
        // Create model storage table
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS risk_models (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                version INTEGER NOT NULL,
                model_data TEXT NOT NULL,
                metrics TEXT,
                created_at TEXT NOT NULL,
                is_active INTEGER NOT NULL DEFAULT 0
            )
            "#,
        )
        .execute(&self.pool)
        .await?;
        
        Ok(())
    }
    
    pub async fn score_token(
        &self,
        token_address: &str,
        features: RiskFeatures,
    ) -> Result<RiskScore, sqlx::Error> {
        let model = self.model.read().await;
        let (score, factors) = model.score_token(&features);
        
        let risk_level = if score < 30.0 {
            "Low"
        } else if score < 60.0 {
            "Medium"
        } else if score < 80.0 {
            "High"
        } else {
            "Critical"
        };
        
        let risk_score = RiskScore {
            token_address: token_address.to_string(),
            score,
            risk_level: risk_level.to_string(),
            contributing_factors: factors.clone(),
            timestamp: Utc::now().to_rfc3339(),
        };
        
        // Store in database
        let factors_json = serde_json::to_string(&factors).unwrap_or_default();
        sqlx::query(
            r#"
            INSERT INTO risk_scores (token_address, score, risk_level, factors, timestamp)
            VALUES (?, ?, ?, ?, ?)
            "#,
        )
        .bind(&risk_score.token_address)
        .bind(risk_score.score)
        .bind(&risk_score.risk_level)
        .bind(&factors_json)
        .bind(&risk_score.timestamp)
        .execute(&self.pool)
        .await?;
        
        Ok(risk_score)
    }
    
    pub async fn get_risk_history(
        &self,
        token_address: &str,
        days: u32,
    ) -> Result<RiskHistory, sqlx::Error> {
        let cutoff = Utc::now() - chrono::Duration::days(days as i64);
        let cutoff_str = cutoff.to_rfc3339();
        
        let rows = sqlx::query(
            r#"
            SELECT score, risk_level, timestamp
            FROM risk_scores
            WHERE token_address = ? AND timestamp >= ?
            ORDER BY timestamp ASC
            "#,
        )
        .bind(token_address)
        .bind(&cutoff_str)
        .fetch_all(&self.pool)
        .await?;
        
        let history: Vec<RiskHistoryPoint> = rows
            .iter()
            .map(|row| RiskHistoryPoint {
                timestamp: row.get("timestamp"),
                score: row.get("score"),
                risk_level: row.get("risk_level"),
            })
            .collect();
        
        Ok(RiskHistory {
            token_address: token_address.to_string(),
            history,
        })
    }
    
    pub async fn get_latest_risk_score(
        &self,
        token_address: &str,
    ) -> Result<Option<RiskScore>, sqlx::Error> {
        let row = sqlx::query(
            r#"
            SELECT score, risk_level, factors, timestamp
            FROM risk_scores
            WHERE token_address = ?
            ORDER BY timestamp DESC
            LIMIT 1
            "#,
        )
        .bind(token_address)
        .fetch_optional(&self.pool)
        .await?;
        
        if let Some(row) = row {
            let factors_json: String = row.get("factors");
            let factors: Vec<RiskFactor> = serde_json::from_str(&factors_json).unwrap_or_default();
            
            Ok(Some(RiskScore {
                token_address: token_address.to_string(),
                score: row.get("score"),
                risk_level: row.get("risk_level"),
                contributing_factors: factors,
                timestamp: row.get("timestamp"),
            }))
        } else {
            Ok(None)
        }
    }
    
    pub async fn save_model(&self, metrics: Option<String>) -> Result<(), sqlx::Error> {
        let model = self.model.read().await;
        let model_json = model.to_json().map_err(|e| {
            sqlx::Error::Decode(Box::new(std::io::Error::new(
                std::io::ErrorKind::InvalidData,
                e
            )))
        })?;
        
        // Mark all existing models as inactive
        sqlx::query("UPDATE risk_models SET is_active = 0")
            .execute(&self.pool)
            .await?;
        
        // Insert new model as active
        sqlx::query(
            r#"
            INSERT INTO risk_models (version, model_data, metrics, created_at, is_active)
            VALUES (
                (SELECT COALESCE(MAX(version), 0) + 1 FROM risk_models),
                ?, ?, ?, 1
            )
            "#,
        )
        .bind(&model_json)
        .bind(metrics)
        .bind(Utc::now().to_rfc3339())
        .execute(&self.pool)
        .await?;
        
        Ok(())
    }
    
    pub async fn load_latest_model(&self) -> Result<(), sqlx::Error> {
        let row = sqlx::query(
            r#"
            SELECT model_data FROM risk_models
            WHERE is_active = 1
            ORDER BY created_at DESC
            LIMIT 1
            "#,
        )
        .fetch_optional(&self.pool)
        .await?;
        
        if let Some(row) = row {
            let model_json: String = row.get("model_data");
            let loaded_model = RiskModel::from_json(&model_json).map_err(|e| {
                sqlx::Error::Decode(Box::new(std::io::Error::new(
                    std::io::ErrorKind::InvalidData,
                    e
                )))
            })?;
            
            let mut model = self.model.write().await;
            *model = loaded_model;
        }
        
        Ok(())
    }
}

// Legacy command for backward compatibility
#[tauri::command]
pub async fn assess_risk(features: Vec<f32>) -> Result<f32, String> {
    if features.is_empty() {
        return Err("Features cannot be empty".to_string());
    }

    let model = RiskModel::new();
    let weights = vec![0.3, 0.2, 0.15, 0.15, 0.1, 0.1];

    let score: f32 = features
        .iter()
        .zip(weights.iter())
        .take(features.len().min(weights.len()))
        .map(|(f, w)| f * w)
        .sum();

    Ok(score.max(0.0).min(1.0))
}

// New ML-based commands
#[tauri::command]
pub async fn get_token_risk_score(
    token_address: String,
    risk_analyzer: State<'_, SharedRiskAnalyzer>,
    holder_analyzer: State<'_, crate::market::SharedHolderAnalyzer>,
) -> Result<RiskScore, String> {
    // Gather features from various sources
    let holder_data = {
        let analyzer = holder_analyzer.read().await;
        analyzer.get_holder_distribution(&token_address).await
            .map_err(|e| format!("Failed to get holder data: {}", e))?
    };
    
    let metadata = {
        let analyzer = holder_analyzer.read().await;
        analyzer.get_token_metadata(&token_address).await
            .map_err(|e| format!("Failed to get metadata: {}", e))?
    };
    
    let verification = {
        let analyzer = holder_analyzer.read().await;
        analyzer.get_verification_status(&token_address).await
            .map_err(|e| format!("Failed to get verification: {}", e))?
    };
    
    // Calculate token age
    let token_age_days = {
        let creation_date = chrono::DateTime::parse_from_rfc3339(&metadata.creation_date)
            .map_err(|e| format!("Failed to parse creation date: {}", e))?;
        let now = Utc::now();
        (now - creation_date).num_days() as f64
    };
    
    // Build features
    let features = RiskFeatures {
        gini_coefficient: holder_data.gini_coefficient,
        top_10_percentage: holder_data.top_10_percentage,
        total_holders: holder_data.total_holders,
        liquidity_usd: 100000.0, // Mock - would fetch from market data
        liquidity_to_mcap_ratio: 0.1, // Mock
        has_mint_authority: metadata.mint_authority.is_some(),
        has_freeze_authority: metadata.freeze_authority.is_some(),
        verified: verification.verified,
        audited: verification.audit_status == "Audited",
        community_trust_score: verification.community_votes.trust_score,
        sentiment_score: 0.0, // Mock - would fetch from sentiment analysis
        token_age_days,
        volume_24h: 50000.0, // Mock
        price_volatility: 15.0, // Mock
    };
    
    let analyzer = risk_analyzer.read().await;
    let risk_score = analyzer.score_token(&token_address, features).await
        .map_err(|e| format!("Failed to score token: {}", e))?;
    
    Ok(risk_score)
}

#[tauri::command]
pub async fn get_risk_history(
    token_address: String,
    days: u32,
    risk_analyzer: State<'_, SharedRiskAnalyzer>,
) -> Result<RiskHistory, String> {
    let analyzer = risk_analyzer.read().await;
    analyzer.get_risk_history(&token_address, days).await
        .map_err(|e| format!("Failed to get risk history: {}", e))
}

#[tauri::command]
pub async fn get_latest_risk_score(
    token_address: String,
    risk_analyzer: State<'_, SharedRiskAnalyzer>,
) -> Result<Option<RiskScore>, String> {
    let analyzer = risk_analyzer.read().await;
    analyzer.get_latest_risk_score(&token_address).await
        .map_err(|e| format!("Failed to get latest risk score: {}", e))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_risk_model_scoring() {
        let model = RiskModel::new();
        
        // High risk token features
        let high_risk = RiskFeatures {
            gini_coefficient: 0.95,
            top_10_percentage: 85.0,
            total_holders: 50,
            liquidity_usd: 5000.0,
            liquidity_to_mcap_ratio: 0.01,
            has_mint_authority: true,
            has_freeze_authority: true,
            verified: false,
            audited: false,
            community_trust_score: 0.2,
            sentiment_score: -0.5,
            token_age_days: 2.0,
            volume_24h: 1000.0,
            price_volatility: 50.0,
        };
        
        let (score, factors) = model.score_token(&high_risk);
        assert!(score > 60.0, "High risk token should score > 60");
        assert!(!factors.is_empty(), "Should have contributing factors");
        
        // Low risk token features
        let low_risk = RiskFeatures {
            gini_coefficient: 0.3,
            top_10_percentage: 25.0,
            total_holders: 10000,
            liquidity_usd: 1000000.0,
            liquidity_to_mcap_ratio: 0.2,
            has_mint_authority: false,
            has_freeze_authority: false,
            verified: true,
            audited: true,
            community_trust_score: 0.9,
            sentiment_score: 0.7,
            token_age_days: 180.0,
            volume_24h: 500000.0,
            price_volatility: 5.0,
        };
        
        let (score, _) = model.score_token(&low_risk);
        assert!(score < 40.0, "Low risk token should score < 40");
    }
    
    #[test]
    fn test_model_serialization() {
        let model = RiskModel::new();
        let json = model.to_json().expect("Should serialize");
        let loaded = RiskModel::from_json(&json).expect("Should deserialize");
        
        assert_eq!(model.intercept, loaded.intercept);
        assert_eq!(model.threshold, loaded.threshold);
    }
    
    #[test]
    fn test_feature_extraction() {
        let features = RiskFeatures {
            gini_coefficient: 0.5,
            top_10_percentage: 50.0,
            total_holders: 1000,
            liquidity_usd: 100000.0,
            liquidity_to_mcap_ratio: 0.1,
            has_mint_authority: false,
            has_freeze_authority: false,
            verified: true,
            audited: false,
            community_trust_score: 0.7,
            sentiment_score: 0.3,
            token_age_days: 30.0,
            volume_24h: 50000.0,
            price_volatility: 10.0,
        };
        
        let model = RiskModel::new();
        let (score, factors) = model.score_token(&features);
        
        assert!(score >= 0.0 && score <= 100.0, "Score should be in valid range");
        assert!(factors.len() <= 5, "Should have at most 5 top factors");
    }
}

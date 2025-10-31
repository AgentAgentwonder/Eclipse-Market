use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, Pool, Row, Sqlite, SqlitePool};
use std::collections::{HashMap, HashSet};
use uuid::Uuid;

use crate::insiders::{WalletActivity, WalletMonitorDatabase};
use super::cache::SocialCache;
use super::models::SocialPost;

/// Error type for whale tracking operations
#[derive(Debug, thiserror::Error)]
pub enum WhaleError {
    #[error("database error: {0}")]
    Database(#[from] sqlx::Error),
    #[error("internal error: {0}")]
    Internal(String),
}

/// Represents a cluster of whale wallets grouped by heuristics
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct WhaleCluster {
    pub id: String,
    pub cluster_name: String,
    pub wallet_addresses: String, // JSON array of wallet addresses
    pub shared_tokens: String,    // JSON array of token addresses
    pub cluster_score: f64,
    pub member_count: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Represents a wallet being followed by the user
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct FollowedWallet {
    pub id: String,
    pub wallet_address: String,
    pub label: Option<String>,
    pub cluster_id: Option<String>,
    pub priority: i32,
    pub followed_at: DateTime<Utc>,
}

/// Links social posts to whale wallet activities
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct WhaleSocialMention {
    pub id: String,
    pub wallet_address: String,
    pub post_id: String,
    pub token: String,
    pub source: String,
    pub sentiment_score: f64,
    pub mentioned_at: DateTime<Utc>,
}

/// Stores correlation between social activity and on-chain whale behavior
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct WhaleCorrelation {
    pub id: String,
    pub wallet_address: String,
    pub token: String,
    pub social_mentions_count: i32,
    pub avg_sentiment: f64,
    pub onchain_activity_count: i32,
    pub time_lag_seconds: i64,
    pub correlation_score: f64,
    pub created_at: DateTime<Utc>,
}

/// Whale feed entry combining social and on-chain data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WhaleFeedEntry {
    pub id: String,
    pub wallet_address: String,
    pub wallet_label: Option<String>,
    pub activity_type: String, // "social" | "onchain" | "correlation"
    pub token: Option<String>,
    pub sentiment_score: Option<f64>,
    pub correlation_score: Option<f64>,
    pub social_post: Option<SocialPost>,
    pub onchain_activity: Option<WalletActivity>,
    pub timestamp: DateTime<Utc>,
}

/// Whale behavioral insights
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WhaleInsight {
    pub wallet_address: String,
    pub wallet_label: Option<String>,
    pub cluster_name: Option<String>,
    pub tokens: Vec<String>,
    pub social_activity_score: f64,
    pub onchain_activity_score: f64,
    pub correlation_score: f64,
    pub follower_impact: f64,
    pub recent_actions: Vec<String>,
    pub sentiment_trend: String,
    pub updated_at: DateTime<Utc>,
}

/// Whale clustering and social correlation service
pub struct WhaleService {
    pool: Pool<Sqlite>,
}

impl WhaleService {
    pub fn new(pool: Pool<Sqlite>) -> Self {
        Self { pool }
    }

    /// Initialize whale tracking tables
    pub async fn initialize(&self) -> Result<(), WhaleError> {
        // Whale clusters table
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS whale_clusters (
                id TEXT PRIMARY KEY,
                cluster_name TEXT NOT NULL,
                wallet_addresses TEXT NOT NULL,
                shared_tokens TEXT NOT NULL,
                cluster_score REAL NOT NULL,
                member_count INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        // Followed wallets table
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS followed_wallets (
                id TEXT PRIMARY KEY,
                wallet_address TEXT NOT NULL UNIQUE,
                label TEXT,
                cluster_id TEXT,
                priority INTEGER NOT NULL DEFAULT 0,
                followed_at TEXT NOT NULL,
                FOREIGN KEY (cluster_id) REFERENCES whale_clusters(id) ON DELETE SET NULL
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        // Whale social mentions table
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS whale_social_mentions (
                id TEXT PRIMARY KEY,
                wallet_address TEXT NOT NULL,
                post_id TEXT NOT NULL,
                token TEXT NOT NULL,
                source TEXT NOT NULL,
                sentiment_score REAL NOT NULL,
                mentioned_at TEXT NOT NULL
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        // Whale correlations table
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS whale_correlations (
                id TEXT PRIMARY KEY,
                wallet_address TEXT NOT NULL,
                token TEXT NOT NULL,
                social_mentions_count INTEGER NOT NULL,
                avg_sentiment REAL NOT NULL,
                onchain_activity_count INTEGER NOT NULL,
                time_lag_seconds INTEGER NOT NULL,
                correlation_score REAL NOT NULL,
                created_at TEXT NOT NULL
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        // Create indexes
        sqlx::query(
            r#"
            CREATE INDEX IF NOT EXISTS idx_whale_clusters_updated ON whale_clusters(updated_at);
            CREATE INDEX IF NOT EXISTS idx_followed_wallets_address ON followed_wallets(wallet_address);
            CREATE INDEX IF NOT EXISTS idx_followed_wallets_cluster ON followed_wallets(cluster_id);
            CREATE INDEX IF NOT EXISTS idx_followed_wallets_priority ON followed_wallets(priority);
            CREATE INDEX IF NOT EXISTS idx_whale_mentions_wallet ON whale_social_mentions(wallet_address);
            CREATE INDEX IF NOT EXISTS idx_whale_mentions_token ON whale_social_mentions(token);
            CREATE INDEX IF NOT EXISTS idx_whale_mentions_time ON whale_social_mentions(mentioned_at);
            CREATE INDEX IF NOT EXISTS idx_whale_correlations_wallet ON whale_correlations(wallet_address);
            CREATE INDEX IF NOT EXISTS idx_whale_correlations_token ON whale_correlations(token);
            CREATE INDEX IF NOT EXISTS idx_whale_correlations_score ON whale_correlations(correlation_score);
            "#,
        )
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    /// Cluster whale wallets based on transaction overlap and shared labels
    pub async fn cluster_whales(
        &self,
        wallet_activities: &[WalletActivity],
    ) -> Result<Vec<WhaleCluster>, WhaleError> {
        // Group activities by wallet
        let mut wallet_tokens: HashMap<String, HashSet<String>> = HashMap::new();

        for activity in wallet_activities {
            if activity.is_whale {
                let entry = wallet_tokens
                    .entry(activity.wallet_address.clone())
                    .or_insert_with(HashSet::new);
                
                if let Some(ref token) = activity.input_mint {
                    entry.insert(token.clone());
                }
                if let Some(ref token) = activity.output_mint {
                    entry.insert(token.clone());
                }
            }
        }

        // Find wallets with shared tokens (clustering heuristic)
        let mut clusters: Vec<Vec<String>> = Vec::new();
        let mut assigned_wallets: HashSet<String> = HashSet::new();

        let wallet_list: Vec<String> = wallet_tokens.keys().cloned().collect();

        for i in 0..wallet_list.len() {
            if assigned_wallets.contains(&wallet_list[i]) {
                continue;
            }

            let wallet_a = &wallet_list[i];
            let tokens_a = wallet_tokens.get(wallet_a).unwrap();
            let mut cluster = vec![wallet_a.clone()];
            assigned_wallets.insert(wallet_a.clone());

            for j in (i + 1)..wallet_list.len() {
                if assigned_wallets.contains(&wallet_list[j]) {
                    continue;
                }

                let wallet_b = &wallet_list[j];
                let tokens_b = wallet_tokens.get(wallet_b).unwrap();

                // Calculate overlap
                let overlap: HashSet<_> = tokens_a.intersection(tokens_b).collect();
                let overlap_ratio = overlap.len() as f64 / tokens_a.len().min(tokens_b.len()) as f64;

                // Group wallets with >30% token overlap
                if overlap_ratio > 0.3 {
                    cluster.push(wallet_b.clone());
                    assigned_wallets.insert(wallet_b.clone());
                }
            }

            if cluster.len() >= 1 {
                clusters.push(cluster);
            }
        }

        // Save clusters to database
        let mut result_clusters = Vec::new();
        for (idx, cluster_wallets) in clusters.iter().enumerate() {
            // Collect shared tokens
            let mut shared_tokens: HashSet<String> = HashSet::new();
            let mut first = true;

            for wallet in cluster_wallets {
                if let Some(tokens) = wallet_tokens.get(wallet) {
                    if first {
                        shared_tokens = tokens.clone();
                        first = false;
                    } else {
                        shared_tokens = shared_tokens.intersection(tokens).cloned().collect();
                    }
                }
            }

            let cluster_score = (shared_tokens.len() as f64 * cluster_wallets.len() as f64).sqrt();
            let cluster_name = format!("Cluster {}", idx + 1);

            let cluster = WhaleCluster {
                id: Uuid::new_v4().to_string(),
                cluster_name: cluster_name.clone(),
                wallet_addresses: serde_json::to_string(&cluster_wallets)
                    .map_err(|e| WhaleError::Internal(e.to_string()))?,
                shared_tokens: serde_json::to_string(&shared_tokens.iter().collect::<Vec<_>>())
                    .map_err(|e| WhaleError::Internal(e.to_string()))?,
                cluster_score,
                member_count: cluster_wallets.len() as i32,
                created_at: Utc::now(),
                updated_at: Utc::now(),
            };

            self.save_cluster(&cluster).await?;
            result_clusters.push(cluster);
        }

        Ok(result_clusters)
    }

    async fn save_cluster(&self, cluster: &WhaleCluster) -> Result<(), WhaleError> {
        sqlx::query(
            r#"
            INSERT OR REPLACE INTO whale_clusters 
            (id, cluster_name, wallet_addresses, shared_tokens, cluster_score, member_count, created_at, updated_at)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
            "#,
        )
        .bind(&cluster.id)
        .bind(&cluster.cluster_name)
        .bind(&cluster.wallet_addresses)
        .bind(&cluster.shared_tokens)
        .bind(cluster.cluster_score)
        .bind(cluster.member_count)
        .bind(cluster.created_at.to_rfc3339())
        .bind(cluster.updated_at.to_rfc3339())
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    /// Get all whale clusters
    pub async fn get_clusters(&self) -> Result<Vec<WhaleCluster>, WhaleError> {
        let rows = sqlx::query_as::<_, WhaleCluster>(
            "SELECT * FROM whale_clusters ORDER BY cluster_score DESC, updated_at DESC",
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(rows)
    }

    /// Follow a wallet
    pub async fn follow_wallet(
        &self,
        wallet_address: String,
        label: Option<String>,
        cluster_id: Option<String>,
        priority: i32,
    ) -> Result<FollowedWallet, WhaleError> {
        let followed = FollowedWallet {
            id: Uuid::new_v4().to_string(),
            wallet_address: wallet_address.clone(),
            label,
            cluster_id,
            priority,
            followed_at: Utc::now(),
        };

        sqlx::query(
            r#"
            INSERT INTO followed_wallets (id, wallet_address, label, cluster_id, priority, followed_at)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6)
            ON CONFLICT(wallet_address) DO UPDATE SET
                label = COALESCE(?3, label),
                cluster_id = COALESCE(?4, cluster_id),
                priority = ?5
            "#,
        )
        .bind(&followed.id)
        .bind(&followed.wallet_address)
        .bind(&followed.label)
        .bind(&followed.cluster_id)
        .bind(followed.priority)
        .bind(followed.followed_at.to_rfc3339())
        .execute(&self.pool)
        .await?;

        Ok(followed)
    }

    /// Unfollow a wallet
    pub async fn unfollow_wallet(&self, wallet_address: &str) -> Result<(), WhaleError> {
        sqlx::query("DELETE FROM followed_wallets WHERE wallet_address = ?1")
            .bind(wallet_address)
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    /// Get all followed wallets
    pub async fn get_followed_wallets(&self) -> Result<Vec<FollowedWallet>, WhaleError> {
        let rows = sqlx::query_as::<_, FollowedWallet>(
            "SELECT * FROM followed_wallets ORDER BY priority DESC, followed_at DESC",
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(rows)
    }

    /// Link social posts to whale activities
    pub async fn link_social_mentions(
        &self,
        posts: &[SocialPost],
        followed_wallets: &[String],
    ) -> Result<(), WhaleError> {
        for post in posts {
            // Simple heuristic: check if wallet address appears in post text
            for wallet in followed_wallets {
                let wallet_short = if wallet.len() > 8 {
                    &wallet[..8]
                } else {
                    wallet
                };

                if post.text.contains(wallet) || post.text.contains(wallet_short) {
                    let mention = WhaleSocialMention {
                        id: Uuid::new_v4().to_string(),
                        wallet_address: wallet.clone(),
                        post_id: post.id.clone(),
                        token: post.source.clone(), // Using source as proxy; enhance with token detection
                        source: post.source.clone(),
                        sentiment_score: post.sentiment.score as f64,
                        mentioned_at: DateTime::from_timestamp(post.timestamp, 0)
                            .unwrap_or_else(|| Utc::now()),
                    };

                    self.save_social_mention(&mention).await?;
                }
            }
        }

        Ok(())
    }

    async fn save_social_mention(&self, mention: &WhaleSocialMention) -> Result<(), WhaleError> {
        sqlx::query(
            r#"
            INSERT OR IGNORE INTO whale_social_mentions 
            (id, wallet_address, post_id, token, source, sentiment_score, mentioned_at)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
            "#,
        )
        .bind(&mention.id)
        .bind(&mention.wallet_address)
        .bind(&mention.post_id)
        .bind(&mention.token)
        .bind(&mention.source)
        .bind(mention.sentiment_score)
        .bind(mention.mentioned_at.to_rfc3339())
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    /// Calculate correlation between social mentions and on-chain activity
    pub async fn calculate_whale_correlations(
        &self,
        wallet_address: &str,
        activities: &[WalletActivity],
    ) -> Result<WhaleCorrelation, WhaleError> {
        // Get social mentions for this wallet
        let mentions = sqlx::query_as::<_, WhaleSocialMention>(
            "SELECT * FROM whale_social_mentions WHERE wallet_address = ?1 ORDER BY mentioned_at DESC LIMIT 100",
        )
        .bind(wallet_address)
        .fetch_all(&self.pool)
        .await?;

        if mentions.is_empty() || activities.is_empty() {
            return Ok(WhaleCorrelation {
                id: Uuid::new_v4().to_string(),
                wallet_address: wallet_address.to_string(),
                token: "".to_string(),
                social_mentions_count: 0,
                avg_sentiment: 0.0,
                onchain_activity_count: 0,
                time_lag_seconds: 0,
                correlation_score: 0.0,
                created_at: Utc::now(),
            });
        }

        // Group by token
        let mut token_correlations: HashMap<String, (i32, f64, i32, i64)> = HashMap::new();

        for activity in activities {
            let token = activity
                .output_mint
                .clone()
                .or_else(|| activity.input_mint.clone())
                .unwrap_or_default();

            if token.is_empty() {
                continue;
            }

            // Find mentions within 24 hours before activity
            let activity_time = activity.timestamp;
            let window_start = activity_time - chrono::Duration::hours(24);

            let related_mentions: Vec<_> = mentions
                .iter()
                .filter(|m| {
                    let mention_time = m.mentioned_at;
                    mention_time >= window_start && mention_time <= activity_time
                })
                .collect();

            if !related_mentions.is_empty() {
                let mention_count = related_mentions.len() as i32;
                let avg_sentiment: f64 = related_mentions.iter().map(|m| m.sentiment_score).sum::<f64>()
                    / mention_count as f64;
                
                // Calculate average time lag
                let avg_lag = related_mentions
                    .iter()
                    .map(|m| (activity_time - m.mentioned_at).num_seconds())
                    .sum::<i64>()
                    / related_mentions.len() as i64;

                token_correlations
                    .entry(token.clone())
                    .and_modify(|(mc, sent, ac, lag)| {
                        *mc += mention_count;
                        *sent = (*sent + avg_sentiment) / 2.0;
                        *ac += 1;
                        *lag = (*lag + avg_lag) / 2;
                    })
                    .or_insert((mention_count, avg_sentiment, 1, avg_lag));
            }
        }

        // Find best correlation
        let best_correlation = token_correlations
            .iter()
            .max_by(|(_, a), (_, b)| {
                let score_a = a.0 as f64 * a.1.abs() * (a.2 as f64);
                let score_b = b.0 as f64 * b.1.abs() * (b.2 as f64);
                score_a.partial_cmp(&score_b).unwrap_or(std::cmp::Ordering::Equal)
            });

        if let Some((token, (mention_count, avg_sentiment, activity_count, time_lag))) = best_correlation {
            let correlation_score = (*mention_count as f64 * avg_sentiment.abs() * *activity_count as f64).sqrt();

            let correlation = WhaleCorrelation {
                id: Uuid::new_v4().to_string(),
                wallet_address: wallet_address.to_string(),
                token: token.clone(),
                social_mentions_count: *mention_count,
                avg_sentiment: *avg_sentiment,
                onchain_activity_count: *activity_count,
                time_lag_seconds: *time_lag,
                correlation_score,
                created_at: Utc::now(),
            };

            self.save_correlation(&correlation).await?;
            Ok(correlation)
        } else {
            Ok(WhaleCorrelation {
                id: Uuid::new_v4().to_string(),
                wallet_address: wallet_address.to_string(),
                token: "".to_string(),
                social_mentions_count: 0,
                avg_sentiment: 0.0,
                onchain_activity_count: 0,
                time_lag_seconds: 0,
                correlation_score: 0.0,
                created_at: Utc::now(),
            })
        }
    }

    async fn save_correlation(&self, correlation: &WhaleCorrelation) -> Result<(), WhaleError> {
        sqlx::query(
            r#"
            INSERT OR REPLACE INTO whale_correlations 
            (id, wallet_address, token, social_mentions_count, avg_sentiment, 
             onchain_activity_count, time_lag_seconds, correlation_score, created_at)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
            "#,
        )
        .bind(&correlation.id)
        .bind(&correlation.wallet_address)
        .bind(&correlation.token)
        .bind(correlation.social_mentions_count)
        .bind(correlation.avg_sentiment)
        .bind(correlation.onchain_activity_count)
        .bind(correlation.time_lag_seconds)
        .bind(correlation.correlation_score)
        .bind(correlation.created_at.to_rfc3339())
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    /// Get whale feed combining social and on-chain activity
    pub async fn get_whale_feed(&self, limit: i32) -> Result<Vec<WhaleFeedEntry>, WhaleError> {
        let followed = self.get_followed_wallets().await?;
        let wallet_addresses: Vec<String> = followed.iter().map(|f| f.wallet_address.clone()).collect();

        if wallet_addresses.is_empty() {
            return Ok(vec![]);
        }

        let mut feed_entries = Vec::new();

        // Get recent social mentions
        for wallet in &wallet_addresses {
            let mentions = sqlx::query_as::<_, WhaleSocialMention>(
                "SELECT * FROM whale_social_mentions WHERE wallet_address = ?1 ORDER BY mentioned_at DESC LIMIT ?2",
            )
            .bind(wallet)
            .bind(limit / wallet_addresses.len() as i32)
            .fetch_all(&self.pool)
            .await?;

            for mention in mentions {
                let label = followed
                    .iter()
                    .find(|f| f.wallet_address == wallet.as_str())
                    .and_then(|f| f.label.clone());

                feed_entries.push(WhaleFeedEntry {
                    id: mention.id.clone(),
                    wallet_address: mention.wallet_address.clone(),
                    wallet_label: label,
                    activity_type: "social".to_string(),
                    token: Some(mention.token.clone()),
                    sentiment_score: Some(mention.sentiment_score),
                    correlation_score: None,
                    social_post: None,
                    onchain_activity: None,
                    timestamp: mention.mentioned_at,
                });
            }
        }

        // Sort by timestamp descending
        feed_entries.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
        feed_entries.truncate(limit as usize);

        Ok(feed_entries)
    }

    /// Get whale behavioral insights
    pub async fn get_whale_insights(
        &self,
        wallet_address: &str,
    ) -> Result<WhaleInsight, WhaleError> {
        // Get followed wallet info
        let followed = sqlx::query_as::<_, FollowedWallet>(
            "SELECT * FROM followed_wallets WHERE wallet_address = ?1",
        )
        .bind(wallet_address)
        .fetch_optional(&self.pool)
        .await?;

        // Get cluster info if exists
        let cluster_name = if let Some(ref followed_wallet) = followed {
            if let Some(ref cluster_id) = followed_wallet.cluster_id {
                sqlx::query_scalar::<_, String>(
                    "SELECT cluster_name FROM whale_clusters WHERE id = ?1",
                )
                .bind(cluster_id)
                .fetch_optional(&self.pool)
                .await?
            } else {
                None
            }
        } else {
            None
        };

        // Get social mentions
        let mention_count = sqlx::query_scalar::<_, i32>(
            "SELECT COUNT(*) FROM whale_social_mentions WHERE wallet_address = ?1",
        )
        .bind(wallet_address)
        .fetch_one(&self.pool)
        .await
        .unwrap_or(0);

        // Get correlations
        let correlations = sqlx::query_as::<_, WhaleCorrelation>(
            "SELECT * FROM whale_correlations WHERE wallet_address = ?1 ORDER BY correlation_score DESC LIMIT 5",
        )
        .bind(wallet_address)
        .fetch_all(&self.pool)
        .await?;

        let tokens: Vec<String> = correlations.iter().map(|c| c.token.clone()).collect();
        let avg_correlation = if !correlations.is_empty() {
            correlations.iter().map(|c| c.correlation_score).sum::<f64>() / correlations.len() as f64
        } else {
            0.0
        };

        let insight = WhaleInsight {
            wallet_address: wallet_address.to_string(),
            wallet_label: followed.and_then(|f| f.label),
            cluster_name,
            tokens,
            social_activity_score: mention_count as f64,
            onchain_activity_score: correlations.iter().map(|c| c.onchain_activity_count as f64).sum(),
            correlation_score: avg_correlation,
            follower_impact: (mention_count as f64 * avg_correlation).sqrt(),
            recent_actions: correlations.iter().map(|c| format!("Activity on {}", c.token)).collect(),
            sentiment_trend: if correlations.iter().any(|c| c.avg_sentiment > 0.5) {
                "Bullish".to_string()
            } else if correlations.iter().any(|c| c.avg_sentiment < -0.5) {
                "Bearish".to_string()
            } else {
                "Neutral".to_string()
            },
            updated_at: Utc::now(),
        };

        Ok(insight)
    }
}

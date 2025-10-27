use chrono::{Duration, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::AppHandle;

const DB_NAME: &str = "activity_log.db";
const RETENTION_DAYS: i64 = 90;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivityLog {
    pub log_id: String,
    pub wallet_address: String,
    pub action: String,
    pub details: serde_json::Value,
    pub ip_address: Option<String>,
    pub timestamp: String,
    pub result: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivityStats {
    pub total_actions: u32,
    pub successful_actions: u32,
    pub failed_actions: u32,
    pub action_breakdown: HashMap<String, u32>,
    pub recent_suspicious: Vec<ActivityLog>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SuspiciousActivity {
    pub wallet_address: String,
    pub reason: String,
    pub timestamp: String,
    pub related_logs: Vec<ActivityLog>,
}

pub struct ActivityLogDB {
    pool: sqlx::SqlitePool,
}

impl ActivityLogDB {
    pub async fn initialize(app_handle: &AppHandle) -> Result<Self, String> {
        let app_dir = app_handle
            .path_resolver()
            .app_data_dir()
            .ok_or_else(|| "Failed to get app data directory".to_string())?;

        std::fs::create_dir_all(&app_dir)
            .map_err(|e| format!("Failed to create app directory: {}", e))?;

        let db_path = app_dir.join(DB_NAME);
        let db_url = format!("sqlite://{}?mode=rwc", db_path.display());

        let pool = sqlx::SqlitePool::connect(&db_url)
            .await
            .map_err(|e| format!("Failed to connect to database: {}", e))?;

        let db = Self { pool };

        db.init_tables().await?;
        Ok(db)
    }

    async fn init_tables(&self) -> Result<(), String> {
        let pool = &self.pool;

        sqlx::query(
            "CREATE TABLE IF NOT EXISTS activity_logs (
                log_id TEXT PRIMARY KEY,
                wallet_address TEXT NOT NULL,
                action TEXT NOT NULL,
                details_json TEXT NOT NULL,
                ip_address TEXT,
                timestamp TEXT NOT NULL,
                result TEXT NOT NULL
            )",
        )
        .execute(&pool)
        .await
        .map_err(|e| format!("Failed to create activity_logs table: {}", e))?;

        // Create indexes
        sqlx::query("CREATE INDEX IF NOT EXISTS idx_logs_wallet ON activity_logs(wallet_address)")
            .execute(&pool)
            .await
            .ok();

        sqlx::query("CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON activity_logs(timestamp)")
            .execute(&pool)
            .await
            .ok();

        sqlx::query("CREATE INDEX IF NOT EXISTS idx_logs_action ON activity_logs(action)")
            .execute(&pool)
            .await
            .ok();

        Ok(())
    }

    pub async fn log_activity(
        &self,
        wallet_address: String,
        action: String,
        details: serde_json::Value,
        ip_address: Option<String>,
        result: String,
    ) -> Result<ActivityLog, String> {
        let pool = &self.pool;
        let log_id = uuid::Uuid::new_v4().to_string();
        let timestamp = Utc::now().to_rfc3339();
        let details_json = serde_json::to_string(&details)
            .map_err(|e| format!("Failed to serialize details: {}", e))?;

        sqlx::query(
            "INSERT INTO activity_logs (log_id, wallet_address, action, details_json, ip_address, timestamp, result)
             VALUES (?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(&log_id)
        .bind(&wallet_address)
        .bind(&action)
        .bind(&details_json)
        .bind(&ip_address)
        .bind(&timestamp)
        .bind(&result)
        .execute(&pool)
        .await
        .map_err(|e| format!("Failed to log activity: {}", e))?;

        Ok(ActivityLog {
            log_id,
            wallet_address,
            action,
            details,
            ip_address,
            timestamp,
            result,
        })
    }

    pub async fn get_logs(
        &self,
        wallet_address: Option<String>,
        action_filter: Option<String>,
        result_filter: Option<String>,
        start_date: Option<String>,
        end_date: Option<String>,
        limit: Option<i64>,
        offset: Option<i64>,
    ) -> Result<Vec<ActivityLog>, String> {
        let pool = &self.pool;

        let mut query = "SELECT log_id, wallet_address, action, details_json, ip_address, timestamp, result FROM activity_logs WHERE 1=1".to_string();

        if wallet_address.is_some() {
            query.push_str(" AND wallet_address = ?");
        }
        if action_filter.is_some() {
            query.push_str(" AND action = ?");
        }
        if result_filter.is_some() {
            query.push_str(" AND result = ?");
        }
        if start_date.is_some() {
            query.push_str(" AND timestamp >= ?");
        }
        if end_date.is_some() {
            query.push_str(" AND timestamp <= ?");
        }

        query.push_str(" ORDER BY timestamp DESC");

        if limit.is_some() {
            query.push_str(" LIMIT ?");
        }
        if offset.is_some() {
            query.push_str(" OFFSET ?");
        }

        let mut q = sqlx::query_as::<_, (String, String, String, String, Option<String>, String, String)>(&query);

        if let Some(wa) = &wallet_address {
            q = q.bind(wa);
        }
        if let Some(af) = &action_filter {
            q = q.bind(af);
        }
        if let Some(rf) = &result_filter {
            q = q.bind(rf);
        }
        if let Some(sd) = &start_date {
            q = q.bind(sd);
        }
        if let Some(ed) = &end_date {
            q = q.bind(ed);
        }
        if let Some(lim) = limit {
            q = q.bind(lim);
        }
        if let Some(off) = offset {
            q = q.bind(off);
        }

        let rows = q
            .fetch_all(&pool)
            .await
            .map_err(|e| format!("Failed to get logs: {}", e))?;

        let logs = rows
            .into_iter()
            .filter_map(|(log_id, wallet_address, action, details_json, ip_address, timestamp, result)| {
                let details: serde_json::Value = serde_json::from_str(&details_json).ok()?;
                Some(ActivityLog {
                    log_id,
                    wallet_address,
                    action,
                    details,
                    ip_address,
                    timestamp,
                    result,
                })
            })
            .collect();

        Ok(logs)
    }

    pub async fn get_stats(&self, wallet_address: &str) -> Result<ActivityStats, String> {
        let pool = &self.pool;

        let total = sqlx::query_as::<_, (i64,)>(
            "SELECT COUNT(*) FROM activity_logs WHERE wallet_address = ?",
        )
        .bind(wallet_address)
        .fetch_one(&pool)
        .await
        .map_err(|e| format!("Failed to get total count: {}", e))?;

        let successful = sqlx::query_as::<_, (i64,)>(
            "SELECT COUNT(*) FROM activity_logs WHERE wallet_address = ? AND result = 'success'",
        )
        .bind(wallet_address)
        .fetch_one(&pool)
        .await
        .map_err(|e| format!("Failed to get success count: {}", e))?;

        let failed = sqlx::query_as::<_, (i64,)>(
            "SELECT COUNT(*) FROM activity_logs WHERE wallet_address = ? AND result = 'failure'",
        )
        .bind(wallet_address)
        .fetch_one(&pool)
        .await
        .map_err(|e| format!("Failed to get failure count: {}", e))?;

        let action_counts = sqlx::query_as::<_, (String, i64)>(
            "SELECT action, COUNT(*) FROM activity_logs WHERE wallet_address = ? GROUP BY action",
        )
        .bind(wallet_address)
        .fetch_all(&pool)
        .await
        .map_err(|e| format!("Failed to get action breakdown: {}", e))?;

        let mut action_breakdown = HashMap::new();
        for (action, count) in action_counts {
            action_breakdown.insert(action, count as u32);
        }

        let suspicious = self.check_suspicious_activity(wallet_address).await?;

        Ok(ActivityStats {
            total_actions: total.0 as u32,
            successful_actions: successful.0 as u32,
            failed_actions: failed.0 as u32,
            action_breakdown,
            recent_suspicious: suspicious.into_iter().flat_map(|s| s.related_logs).collect(),
        })
    }

    pub async fn check_suspicious_activity(
        &self,
        wallet_address: &str,
    ) -> Result<Vec<SuspiciousActivity>, String> {
        let pool = &self.pool;
        let mut suspicious = Vec::new();

        let one_minute_ago = (Utc::now() - Duration::minutes(1)).to_rfc3339();
        
        let rapid_connects = sqlx::query_as::<_, (i64,)>(
            "SELECT COUNT(*) FROM activity_logs 
             WHERE wallet_address = ? AND action IN ('connect', 'disconnect') 
             AND timestamp >= ?",
        )
        .bind(wallet_address)
        .bind(&one_minute_ago)
        .fetch_one(&pool)
        .await
        .map_err(|e| format!("Failed to check rapid connects: {}", e))?;

        if rapid_connects.0 > 5 {
            let logs = self.get_logs(
                Some(wallet_address.to_string()),
                None,
                None,
                Some(one_minute_ago.clone()),
                None,
                Some(10),
                None,
            )
            .await?;

            suspicious.push(SuspiciousActivity {
                wallet_address: wallet_address.to_string(),
                reason: "Rapid connect/disconnect cycles detected".to_string(),
                timestamp: Utc::now().to_rfc3339(),
                related_logs: logs,
            });
        }

        let five_minutes_ago = (Utc::now() - Duration::minutes(5)).to_rfc3339();
        
        let failed_signs = sqlx::query_as::<_, (i64,)>(
            "SELECT COUNT(*) FROM activity_logs 
             WHERE wallet_address = ? AND action = 'sign' 
             AND result = 'failure' AND timestamp >= ?",
        )
        .bind(wallet_address)
        .bind(&five_minutes_ago)
        .fetch_one(&pool)
        .await
        .map_err(|e| format!("Failed to check failed signs: {}", e))?;

        if failed_signs.0 > 3 {
            let logs = self.get_logs(
                Some(wallet_address.to_string()),
                Some("sign".to_string()),
                Some("failure".to_string()),
                Some(five_minutes_ago.clone()),
                None,
                Some(10),
                None,
            )
            .await?;

            suspicious.push(SuspiciousActivity {
                wallet_address: wallet_address.to_string(),
                reason: "Multiple failed signature attempts".to_string(),
                timestamp: Utc::now().to_rfc3339(),
                related_logs: logs,
            });
        }

        Ok(suspicious)
    }

    pub async fn cleanup_old_logs(&self) -> Result<u32, String> {
        let pool = &self.pool;
        let cutoff_date = (Utc::now() - Duration::days(RETENTION_DAYS)).to_rfc3339();

        let result = sqlx::query("DELETE FROM activity_logs WHERE timestamp < ?")
            .bind(&cutoff_date)
            .execute(&pool)
            .await
            .map_err(|e| format!("Failed to cleanup old logs: {}", e))?;

        Ok(result.rows_affected() as u32)
    }

    pub async fn export_logs_csv(
        &self,
        wallet_address: Option<String>,
        action_filter: Option<String>,
        result_filter: Option<String>,
        start_date: Option<String>,
        end_date: Option<String>,
    ) -> Result<String, String> {
        let logs = self.get_logs(
            wallet_address,
            action_filter,
            result_filter,
            start_date,
            end_date,
            None,
            None,
        )
        .await?;

        let mut csv = String::from("Timestamp,Wallet Address,Action,Details,IP Address,Result\n");

        for log in logs {
            let details_str = serde_json::to_string(&log.details).unwrap_or_default();
            csv.push_str(&format!(
                "{},{},{},\"{}\",{},{}\n",
                log.timestamp,
                log.wallet_address,
                log.action,
                details_str.replace("\"", "\"\""),
                log.ip_address.unwrap_or_else(|| "N/A".to_string()),
                log.result
            ));
        }

        Ok(csv)
    }
}

// Tauri Commands
#[tauri::command]
pub async fn log_wallet_activity(
    wallet_address: String,
    action: String,
    details: serde_json::Value,
    result: String,
    app_handle: AppHandle,
) -> Result<ActivityLog, String> {
    let db = app_handle.state::<ActivityLogDB>();
    db.log_activity(wallet_address, action, details, None, result)
        .await
}

#[tauri::command]
pub async fn get_activity_logs(
    wallet_address: Option<String>,
    action_filter: Option<String>,
    result_filter: Option<String>,
    start_date: Option<String>,
    end_date: Option<String>,
    limit: Option<i64>,
    offset: Option<i64>,
    app_handle: AppHandle,
) -> Result<Vec<ActivityLog>, String> {
    let db = app_handle.state::<ActivityLogDB>();
    db.get_logs(
        wallet_address,
        action_filter,
        result_filter,
        start_date,
        end_date,
        limit,
        offset,
    )
    .await
}

#[tauri::command]
pub async fn get_activity_stats(
    wallet_address: String,
    app_handle: AppHandle,
) -> Result<ActivityStats, String> {
    let db = app_handle.state::<ActivityLogDB>();
    db.get_stats(&wallet_address).await
}

#[tauri::command]
pub async fn check_suspicious_activity(
    wallet_address: String,
    app_handle: AppHandle,
) -> Result<Vec<SuspiciousActivity>, String> {
    let db = app_handle.state::<ActivityLogDB>();
    db.check_suspicious_activity(&wallet_address).await
}

#[tauri::command]
pub async fn export_activity_logs(
    wallet_address: Option<String>,
    action_filter: Option<String>,
    result_filter: Option<String>,
    start_date: Option<String>,
    end_date: Option<String>,
    app_handle: AppHandle,
) -> Result<String, String> {
    let db = app_handle.state::<ActivityLogDB>();
    db.export_logs_csv(wallet_address, action_filter, result_filter, start_date, end_date)
        .await
}

#[tauri::command]
pub async fn cleanup_old_activity_logs(app_handle: AppHandle) -> Result<u32, String> {
    let db = app_handle.state::<ActivityLogDB>();
    db.cleanup_old_logs().await
}

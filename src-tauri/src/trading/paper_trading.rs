use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{Pool, Sqlite, SqlitePool};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::RwLock;
use std::time::Duration;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaperBalance {
    pub currency: String, // "SOL", "USDC", etc.
    pub amount: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaperTrade {
    pub id: String,
    pub trade_type: String, // "buy", "sell"
    pub input_symbol: String,
    pub output_symbol: String,
    pub input_amount: f64,
    pub output_amount: f64,
    pub price: f64,
    pub fee: f64,
    pub slippage: f64,
    pub realized_pnl: f64,
    pub timestamp: DateTime<Utc>,
    pub order_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaperPosition {
    pub symbol: String,
    pub amount: f64,
    pub average_entry_price: f64,
    pub current_price: f64,
    pub unrealized_pnl: f64,
    pub realized_pnl: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaperAccount {
    pub enabled: bool,
    pub balances: HashMap<String, f64>,
    pub initial_balance: f64,
    pub current_value: f64,
    pub total_pnl: f64,
    pub total_trades: usize,
    pub winning_trades: usize,
    pub losing_trades: usize,
    pub created_at: DateTime<Utc>,
    pub reset_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaperTradingConfig {
    pub slippage_percent: f64,      // 0.1 = 0.1%
    pub fee_percent: f64,            // 0.05 = 0.05%
    pub max_slippage_percent: f64,   // 1.0 = 1%
    pub simulate_failures: bool,
    pub failure_rate: f64,           // 0.01 = 1%
}

impl Default for PaperTradingConfig {
    fn default() -> Self {
        Self {
            slippage_percent: 0.1,
            fee_percent: 0.05,
            max_slippage_percent: 1.0,
            simulate_failures: false,
            failure_rate: 0.01,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LeaderboardEntry {
    pub user_id: String,
    pub username: String,
    pub total_pnl: f64,
    pub total_pnl_percent: f64,
    pub total_trades: usize,
    pub win_rate: f64,
    pub rank: usize,
    pub updated_at: DateTime<Utc>,
}

pub struct PaperTradingEngine {
    pool: Pool<Sqlite>,
    config: Arc<RwLock<PaperTradingConfig>>,
    current_prices: Arc<RwLock<HashMap<String, f64>>>,
}

impl PaperTradingEngine {
    pub async fn new(db_path: PathBuf) -> Result<Self, sqlx::Error> {
        let db_url = format!("sqlite:{}?mode=rwc", db_path.display());
        let pool = SqlitePool::connect(&db_url).await?;
        
        let engine = Self {
            pool,
            config: Arc::new(RwLock::new(PaperTradingConfig::default())),
            current_prices: Arc::new(RwLock::new(HashMap::new())),
        };
        
        engine.initialize().await?;
        
        Ok(engine)
    }

    async fn initialize(&self) -> Result<(), sqlx::Error> {
        // Paper account table
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS paper_account (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                enabled INTEGER NOT NULL DEFAULT 0,
                initial_balance REAL NOT NULL DEFAULT 10000.0,
                current_value REAL NOT NULL DEFAULT 10000.0,
                total_pnl REAL NOT NULL DEFAULT 0.0,
                total_trades INTEGER NOT NULL DEFAULT 0,
                winning_trades INTEGER NOT NULL DEFAULT 0,
                losing_trades INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                reset_count INTEGER NOT NULL DEFAULT 0
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        // Paper balances table
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS paper_balances (
                currency TEXT PRIMARY KEY,
                amount REAL NOT NULL DEFAULT 0.0
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        // Paper trades table
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS paper_trades (
                id TEXT PRIMARY KEY,
                trade_type TEXT NOT NULL,
                input_symbol TEXT NOT NULL,
                output_symbol TEXT NOT NULL,
                input_amount REAL NOT NULL,
                output_amount REAL NOT NULL,
                price REAL NOT NULL,
                fee REAL NOT NULL,
                slippage REAL NOT NULL,
                realized_pnl REAL NOT NULL,
                timestamp TEXT NOT NULL,
                order_id TEXT
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        // Paper positions table
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS paper_positions (
                symbol TEXT PRIMARY KEY,
                amount REAL NOT NULL DEFAULT 0.0,
                average_entry_price REAL NOT NULL DEFAULT 0.0,
                realized_pnl REAL NOT NULL DEFAULT 0.0
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        // Leaderboard table
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS paper_leaderboard (
                user_id TEXT PRIMARY KEY,
                username TEXT NOT NULL,
                total_pnl REAL NOT NULL,
                total_pnl_percent REAL NOT NULL,
                total_trades INTEGER NOT NULL,
                win_rate REAL NOT NULL,
                updated_at TEXT NOT NULL
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        // Indices
        sqlx::query(
            r#"
            CREATE INDEX IF NOT EXISTS idx_paper_trades_timestamp ON paper_trades(timestamp DESC);
            CREATE INDEX IF NOT EXISTS idx_paper_leaderboard_pnl ON paper_leaderboard(total_pnl DESC);
            "#,
        )
        .execute(&self.pool)
        .await?;

        // Initialize default account if not exists
        let existing = sqlx::query("SELECT id FROM paper_account WHERE id = 1")
            .fetch_optional(&self.pool)
            .await?;
        
        if existing.is_none() {
            sqlx::query(
                r#"
                INSERT INTO paper_account (id, enabled, initial_balance, current_value, created_at)
                VALUES (1, 0, 10000.0, 10000.0, ?1)
                "#,
            )
            .bind(Utc::now().to_rfc3339())
            .execute(&self.pool)
            .await?;

            // Initialize default SOL balance
            sqlx::query(
                r#"
                INSERT INTO paper_balances (currency, amount)
                VALUES ('SOL', 10000.0)
                "#,
            )
            .execute(&self.pool)
            .await?;
        }

        Ok(())
    }

    pub async fn is_enabled(&self) -> Result<bool, sqlx::Error> {
        let result: (i64,) = sqlx::query_as("SELECT enabled FROM paper_account WHERE id = 1")
            .fetch_one(&self.pool)
            .await?;
        
        Ok(result.0 == 1)
    }

    pub async fn set_enabled(&self, enabled: bool) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            UPDATE paper_account 
            SET enabled = ?1
            WHERE id = 1
            "#,
        )
        .bind(if enabled { 1 } else { 0 })
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn get_account(&self) -> Result<PaperAccount, sqlx::Error> {
        let row: (i64, f64, f64, f64, i64, i64, i64, String, i64) = sqlx::query_as(
            r#"
            SELECT enabled, initial_balance, current_value, total_pnl,
                   total_trades, winning_trades, losing_trades, created_at, reset_count
            FROM paper_account 
            WHERE id = 1
            "#,
        )
        .fetch_one(&self.pool)
        .await?;

        let balances = self.get_balances().await?;
        let balances_map: HashMap<String, f64> = balances
            .into_iter()
            .map(|b| (b.currency, b.amount))
            .collect();

        Ok(PaperAccount {
            enabled: row.0 == 1,
            balances: balances_map,
            initial_balance: row.1,
            current_value: row.2,
            total_pnl: row.3,
            total_trades: row.4 as usize,
            winning_trades: row.5 as usize,
            losing_trades: row.6 as usize,
            created_at: DateTime::parse_from_rfc3339(&row.7)
                .unwrap()
                .with_timezone(&Utc),
            reset_count: row.8 as u32,
        })
    }

    pub async fn get_balances(&self) -> Result<Vec<PaperBalance>, sqlx::Error> {
        let rows: Vec<(String, f64)> =
            sqlx::query_as("SELECT currency, amount FROM paper_balances")
                .fetch_all(&self.pool)
                .await?;

        Ok(rows
            .into_iter()
            .map(|(currency, amount)| PaperBalance { currency, amount })
            .collect())
    }

    pub async fn get_balance(&self, currency: &str) -> Result<f64, sqlx::Error> {
        let result: Option<(f64,)> =
            sqlx::query_as("SELECT amount FROM paper_balances WHERE currency = ?1")
                .bind(currency)
                .fetch_optional(&self.pool)
                .await?;

        Ok(result.map(|r| r.0).unwrap_or(0.0))
    }

    pub async fn update_balance(&self, currency: &str, amount: f64) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO paper_balances (currency, amount)
            VALUES (?1, ?2)
            ON CONFLICT(currency) DO UPDATE SET amount = ?2
            "#,
        )
        .bind(currency)
        .bind(amount)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn update_price(&self, symbol: &str, price: f64) {
        let mut prices = self.current_prices.write().await;
        prices.insert(symbol.to_string(), price);
    }

    pub async fn get_price(&self, symbol: &str) -> Option<f64> {
        let prices = self.current_prices.read().await;
        prices.get(symbol).copied()
    }

    pub async fn execute_trade(
        &self,
        trade_type: &str,
        input_symbol: &str,
        output_symbol: &str,
        input_amount: f64,
        expected_output_amount: f64,
        order_id: Option<String>,
    ) -> Result<PaperTrade, String> {
        if !self.is_enabled().await.map_err(|e| e.to_string())? {
            return Err("Paper trading mode is not enabled".to_string());
        }

        // Check balance
        let input_balance = self
            .get_balance(input_symbol)
            .await
            .map_err(|e| e.to_string())?;
        if input_balance < input_amount {
            return Err(format!(
                "Insufficient balance: {} {} (have: {}, need: {})",
                input_symbol, input_symbol, input_balance, input_amount
            ));
        }

        // Calculate realistic slippage
        let config = self.config.read().await;
        let slippage_variation = rand::random::<f64>() * config.max_slippage_percent;
        let actual_slippage = config.slippage_percent.min(slippage_variation);
        
        // Apply slippage (negative impact on output)
        let slippage_factor = 1.0 - (actual_slippage / 100.0);
        let output_with_slippage = expected_output_amount * slippage_factor;

        // Calculate fee
        let fee = output_with_slippage * (config.fee_percent / 100.0);
        let final_output = output_with_slippage - fee;

        // Simulate occasional failures
        if config.simulate_failures && rand::random::<f64>() < config.failure_rate {
            return Err("Simulated transaction failure".to_string());
        }

        drop(config);

        // Calculate price
        let price = if input_amount > 0.0 {
            final_output / input_amount
        } else {
            0.0
        };

        // Update balances
        let new_input_balance = input_balance - input_amount;
        self.update_balance(input_symbol, new_input_balance)
            .await
            .map_err(|e| e.to_string())?;

        let output_balance = self
            .get_balance(output_symbol)
            .await
            .map_err(|e| e.to_string())?;
        let new_output_balance = output_balance + final_output;
        self.update_balance(output_symbol, new_output_balance)
            .await
            .map_err(|e| e.to_string())?;

        // Calculate realized P&L
        let realized_pnl = self
            .calculate_realized_pnl(output_symbol, final_output, price)
            .await
            .unwrap_or(0.0);

        // Update position
        self.update_position(output_symbol, final_output, price)
            .await
            .map_err(|e| e.to_string())?;

        // Create trade record
        let trade = PaperTrade {
            id: uuid::Uuid::new_v4().to_string(),
            trade_type: trade_type.to_string(),
            input_symbol: input_symbol.to_string(),
            output_symbol: output_symbol.to_string(),
            input_amount,
            output_amount: final_output,
            price,
            fee,
            slippage: actual_slippage,
            realized_pnl,
            timestamp: Utc::now(),
            order_id,
        };

        // Save trade
        sqlx::query(
            r#"
            INSERT INTO paper_trades (
                id, trade_type, input_symbol, output_symbol,
                input_amount, output_amount, price, fee, slippage,
                realized_pnl, timestamp, order_id
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)
            "#,
        )
        .bind(&trade.id)
        .bind(&trade.trade_type)
        .bind(&trade.input_symbol)
        .bind(&trade.output_symbol)
        .bind(trade.input_amount)
        .bind(trade.output_amount)
        .bind(trade.price)
        .bind(trade.fee)
        .bind(trade.slippage)
        .bind(trade.realized_pnl)
        .bind(trade.timestamp.to_rfc3339())
        .bind(&trade.order_id)
        .execute(&self.pool)
        .await
        .map_err(|e| e.to_string())?;

        // Update account statistics
        self.update_account_stats(&trade).await.map_err(|e| e.to_string())?;

        Ok(trade)
    }

    async fn calculate_realized_pnl(
        &self,
        symbol: &str,
        amount: f64,
        current_price: f64,
    ) -> Result<f64, sqlx::Error> {
        let position: Option<(f64, f64)> = sqlx::query_as(
            "SELECT amount, average_entry_price FROM paper_positions WHERE symbol = ?1",
        )
        .bind(symbol)
        .fetch_optional(&self.pool)
        .await?;

        if let Some((pos_amount, entry_price)) = position {
            if pos_amount < 0.0 && amount > 0.0 {
                // Closing a short position
                let closed_amount = amount.min(-pos_amount);
                Ok(closed_amount * (entry_price - current_price))
            } else {
                Ok(0.0)
            }
        } else {
            Ok(0.0)
        }
    }

    async fn update_position(
        &self,
        symbol: &str,
        amount: f64,
        price: f64,
    ) -> Result<(), sqlx::Error> {
        let existing: Option<(f64, f64, f64)> = sqlx::query_as(
            "SELECT amount, average_entry_price, realized_pnl FROM paper_positions WHERE symbol = ?1",
        )
        .bind(symbol)
        .fetch_optional(&self.pool)
        .await?;

        let (new_amount, new_avg_price, realized_pnl) = if let Some((pos_amount, avg_price, pnl)) = existing {
            let total_amount = pos_amount + amount;
            let new_avg = if total_amount != 0.0 {
                ((pos_amount * avg_price) + (amount * price)) / total_amount
            } else {
                0.0
            };
            (total_amount, new_avg, pnl)
        } else {
            (amount, price, 0.0)
        };

        sqlx::query(
            r#"
            INSERT INTO paper_positions (symbol, amount, average_entry_price, realized_pnl)
            VALUES (?1, ?2, ?3, ?4)
            ON CONFLICT(symbol) DO UPDATE SET
                amount = ?2,
                average_entry_price = ?3
            "#,
        )
        .bind(symbol)
        .bind(new_amount)
        .bind(new_avg_price)
        .bind(realized_pnl)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    async fn update_account_stats(&self, trade: &PaperTrade) -> Result<(), sqlx::Error> {
        let is_winning = trade.realized_pnl > 0.0;

        sqlx::query(
            r#"
            UPDATE paper_account
            SET total_trades = total_trades + 1,
                winning_trades = winning_trades + CASE WHEN ?1 THEN 1 ELSE 0 END,
                losing_trades = losing_trades + CASE WHEN NOT ?1 THEN 1 ELSE 0 END,
                total_pnl = total_pnl + ?2
            WHERE id = 1
            "#,
        )
        .bind(is_winning)
        .bind(trade.realized_pnl)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn get_positions(&self) -> Result<Vec<PaperPosition>, sqlx::Error> {
        let rows: Vec<(String, f64, f64, f64)> = sqlx::query_as(
            "SELECT symbol, amount, average_entry_price, realized_pnl FROM paper_positions WHERE amount != 0",
        )
        .fetch_all(&self.pool)
        .await?;

        let prices = self.current_prices.read().await;

        Ok(rows
            .into_iter()
            .map(|(symbol, amount, avg_price, realized_pnl)| {
                let current_price = prices.get(&symbol).copied().unwrap_or(avg_price);
                let unrealized_pnl = amount * (current_price - avg_price);

                PaperPosition {
                    symbol,
                    amount,
                    average_entry_price: avg_price,
                    current_price,
                    unrealized_pnl,
                    realized_pnl,
                }
            })
            .collect())
    }

    pub async fn get_trade_history(&self, limit: usize) -> Result<Vec<PaperTrade>, sqlx::Error> {
        let rows: Vec<(String, String, String, String, f64, f64, f64, f64, f64, f64, String, Option<String>)> =
            sqlx::query_as(
                r#"
                SELECT id, trade_type, input_symbol, output_symbol,
                       input_amount, output_amount, price, fee, slippage,
                       realized_pnl, timestamp, order_id
                FROM paper_trades
                ORDER BY timestamp DESC
                LIMIT ?1
                "#,
            )
            .bind(limit as i64)
            .fetch_all(&self.pool)
            .await?;

        Ok(rows
            .into_iter()
            .map(|row| PaperTrade {
                id: row.0,
                trade_type: row.1,
                input_symbol: row.2,
                output_symbol: row.3,
                input_amount: row.4,
                output_amount: row.5,
                price: row.6,
                fee: row.7,
                slippage: row.8,
                realized_pnl: row.9,
                timestamp: DateTime::parse_from_rfc3339(&row.10)
                    .unwrap()
                    .with_timezone(&Utc),
                order_id: row.11,
            })
            .collect())
    }

    pub async fn reset_account(&self, initial_balance: f64) -> Result<(), sqlx::Error> {
        // Clear trades
        sqlx::query("DELETE FROM paper_trades")
            .execute(&self.pool)
            .await?;

        // Clear positions
        sqlx::query("DELETE FROM paper_positions")
            .execute(&self.pool)
            .await?;

        // Reset balances
        sqlx::query("DELETE FROM paper_balances")
            .execute(&self.pool)
            .await?;

        sqlx::query(
            r#"
            INSERT INTO paper_balances (currency, amount)
            VALUES ('SOL', ?1)
            "#,
        )
        .bind(initial_balance)
        .execute(&self.pool)
        .await?;

        // Reset account
        sqlx::query(
            r#"
            UPDATE paper_account
            SET initial_balance = ?1,
                current_value = ?1,
                total_pnl = 0.0,
                total_trades = 0,
                winning_trades = 0,
                losing_trades = 0,
                created_at = ?2,
                reset_count = reset_count + 1
            WHERE id = 1
            "#,
        )
        .bind(initial_balance)
        .bind(Utc::now().to_rfc3339())
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn update_config(&self, config: PaperTradingConfig) -> Result<(), String> {
        let mut current_config = self.config.write().await;
        *current_config = config;
        Ok(())
    }

    pub async fn get_config(&self) -> PaperTradingConfig {
        self.config.read().await.clone()
    }

    pub async fn submit_to_leaderboard(
        &self,
        user_id: &str,
        username: &str,
    ) -> Result<(), sqlx::Error> {
        let account = self.get_account().await?;
        
        let pnl_percent = if account.initial_balance > 0.0 {
            (account.total_pnl / account.initial_balance) * 100.0
        } else {
            0.0
        };

        let win_rate = if account.total_trades > 0 {
            (account.winning_trades as f64 / account.total_trades as f64) * 100.0
        } else {
            0.0
        };

        sqlx::query(
            r#"
            INSERT INTO paper_leaderboard (
                user_id, username, total_pnl, total_pnl_percent,
                total_trades, win_rate, updated_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
            ON CONFLICT(user_id) DO UPDATE SET
                username = ?2,
                total_pnl = ?3,
                total_pnl_percent = ?4,
                total_trades = ?5,
                win_rate = ?6,
                updated_at = ?7
            "#,
        )
        .bind(user_id)
        .bind(username)
        .bind(account.total_pnl)
        .bind(pnl_percent)
        .bind(account.total_trades as i64)
        .bind(win_rate)
        .bind(Utc::now().to_rfc3339())
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn get_leaderboard(&self, limit: usize) -> Result<Vec<LeaderboardEntry>, sqlx::Error> {
        let rows: Vec<(String, String, f64, f64, i64, f64, String)> = sqlx::query_as(
            r#"
            SELECT user_id, username, total_pnl, total_pnl_percent,
                   total_trades, win_rate, updated_at
            FROM paper_leaderboard
            ORDER BY total_pnl DESC
            LIMIT ?1
            "#,
        )
        .bind(limit as i64)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows
            .into_iter()
            .enumerate()
            .map(|(idx, row)| LeaderboardEntry {
                user_id: row.0,
                username: row.1,
                total_pnl: row.2,
                total_pnl_percent: row.3,
                total_trades: row.4 as usize,
                win_rate: row.5,
                rank: idx + 1,
                updated_at: DateTime::parse_from_rfc3339(&row.6)
                    .unwrap()
                    .with_timezone(&Utc),
            })
            .collect())
    }
}

pub type SharedPaperTradingEngine = Arc<RwLock<PaperTradingEngine>>;

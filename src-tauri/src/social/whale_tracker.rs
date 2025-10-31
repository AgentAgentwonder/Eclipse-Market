use super::storage::{WhaleTransaction, WhaleWallet};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct WhaleActivity {
    pub token: String,
    pub token_address: String,
    pub recent_transactions: Vec<WhaleTransaction>,
    pub accumulation_score: f32,
    pub distribution_score: f32,
    pub net_flow: f64,
    pub unique_whales: i32,
    pub smart_money_active: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct WhaleProfile {
    pub wallet: WhaleWallet,
    pub recent_transactions: Vec<WhaleTransaction>,
    pub holdings: Vec<TokenHolding>,
    pub performance_stats: PerformanceStats,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct TokenHolding {
    pub token: String,
    pub token_address: String,
    pub amount: f64,
    pub usd_value: f64,
    pub percentage: f32,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PerformanceStats {
    pub total_profit: f64,
    pub win_rate: f32,
    pub avg_hold_duration_hours: f32,
    pub best_trade_profit: f64,
    pub worst_trade_loss: f64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct WhaleInsight {
    pub insight_type: String,
    pub message: String,
    pub token: String,
    pub token_address: String,
    pub whale_count: i32,
    pub significance: String,
    pub timestamp: i64,
}

pub struct WhaleTracker {
    known_whale_addresses: HashMap<String, String>,
}

impl WhaleTracker {
    pub fn new() -> Self {
        let mut known_whale_addresses = HashMap::new();
        
        // Add some well-known whale/smart money addresses
        known_whale_addresses.insert(
            "7BgBvyjrZX1YKz4oh9mjb8ZScatkkwb8DzFx7LoiVkM3".to_string(),
            "Smart Money Trader #1".to_string(),
        );
        known_whale_addresses.insert(
            "GUfCR9mK6azb9vcpsxgXyj7XRPAKJd4KMHTTVvtncGgp".to_string(),
            "Whale Investor".to_string(),
        );

        Self {
            known_whale_addresses,
        }
    }

    pub fn analyze_whale_activity(
        &self,
        token: &str,
        token_address: &str,
        transactions: &[WhaleTransaction],
        all_wallets: &[WhaleWallet],
    ) -> WhaleActivity {
        let mut accumulation_score = 0.0;
        let mut distribution_score = 0.0;
        let mut net_flow = 0.0;
        let mut unique_whales = std::collections::HashSet::new();
        let mut smart_money_count = 0;

        for tx in transactions.iter().take(100) {
            unique_whales.insert(tx.wallet_address.clone());

            if let Some(wallet) = all_wallets.iter().find(|w| w.address == tx.wallet_address) {
                if wallet.smart_money_score > 0.7 {
                    smart_money_count += 1;
                }
            }

            match tx.action.as_str() {
                "BUY" => {
                    accumulation_score += tx.usd_value as f32;
                    net_flow += tx.usd_value;
                }
                "SELL" => {
                    distribution_score += tx.usd_value as f32;
                    net_flow -= tx.usd_value;
                }
                _ => {}
            }
        }

        let unique_whales_count = unique_whales.len() as i32;
        let total_volume = accumulation_score + distribution_score;

        // normalize scores
        accumulation_score = if total_volume > 0.0 {
            (accumulation_score / total_volume) * 100.0
        } else {
            0.0
        };

        distribution_score = if total_volume > 0.0 {
            (distribution_score / total_volume) * 100.0
        } else {
            0.0
        };

        WhaleActivity {
            token: token.to_string(),
            token_address: token_address.to_string(),
            recent_transactions: transactions.to_vec(),
            accumulation_score,
            distribution_score,
            net_flow,
            unique_whales: unique_whales_count,
            smart_money_active: smart_money_count > 0,
        }
    }

    pub fn generate_whale_insights(
        &self,
        token: &str,
        token_address: &str,
        activity: &WhaleActivity,
    ) -> Vec<WhaleInsight> {
        let mut insights = Vec::new();
        let now = Utc::now().timestamp();

        if activity.accumulation_score > 70.0 && activity.unique_whales >= 3 {
            insights.push(WhaleInsight {
                insight_type: "accumulation".to_string(),
                message: format!(
                    "{} whales are actively accumulating {}",
                    activity.unique_whales, token
                ),
                token: token.to_string(),
                token_address: token_address.to_string(),
                whale_count: activity.unique_whales,
                significance: "high".to_string(),
                timestamp: now,
            });
        }

        if activity.distribution_score > 70.0 && activity.unique_whales >= 3 {
            insights.push(WhaleInsight {
                insight_type: "distribution".to_string(),
                message: format!(
                    "{} whales are distributing {}. Distribution phase detected",
                    activity.unique_whales, token
                ),
                token: token.to_string(),
                token_address: token_address.to_string(),
                whale_count: activity.unique_whales,
                significance: "high".to_string(),
                timestamp: now,
            });
        }

        if activity.smart_money_active {
            let action = if activity.accumulation_score > activity.distribution_score {
                "buying"
            } else {
                "selling"
            };
            insights.push(WhaleInsight {
                insight_type: "smart_money".to_string(),
                message: format!("Smart money wallets are {} {}", action, token),
                token: token.to_string(),
                token_address: token_address.to_string(),
                whale_count: activity.unique_whales,
                significance: "high".to_string(),
                timestamp: now,
            });
        }

        if activity.net_flow.abs() > 100_000.0 {
            let direction = if activity.net_flow > 0.0 {
                "inflow"
            } else {
                "outflow"
            };
            insights.push(WhaleInsight {
                insight_type: "flow".to_string(),
                message: format!(
                    "Large whale {} detected: ${:.2}",
                    direction,
                    activity.net_flow.abs()
                ),
                token: token.to_string(),
                token_address: token_address.to_string(),
                whale_count: activity.unique_whales,
                significance: "medium".to_string(),
                timestamp: now,
            });
        }

        insights
    }

    pub fn build_whale_profile(
        &self,
        wallet: WhaleWallet,
        transactions: Vec<WhaleTransaction>,
    ) -> WhaleProfile {
        let mut holdings_map: HashMap<String, TokenHolding> = HashMap::new();
        let mut profitable_trades = 0;
        let mut total_profit = 0.0;

        for tx in &transactions {
            if let Some(profit) = tx.profit {
                total_profit += profit;
                if profit > 0.0 {
                    profitable_trades += 1;
                }
            }

            let holding = holdings_map
                .entry(tx.token_address.clone())
                .or_insert_with(|| TokenHolding {
                    token: tx.token.clone(),
                    token_address: tx.token_address.clone(),
                    amount: 0.0,
                    usd_value: 0.0,
                    percentage: 0.0,
                });

            match tx.action.as_str() {
                "BUY" => {
                    holding.amount += tx.amount;
                    holding.usd_value += tx.usd_value;
                }
                "SELL" => {
                    holding.amount -= tx.amount;
                    holding.usd_value -= tx.usd_value;
                }
                _ => {}
            }
        }

        let holdings: Vec<TokenHolding> = holdings_map
            .into_iter()
            .map(|(_, h)| h)
            .filter(|h| h.amount > 0.0)
            .collect();

        let total_value: f64 = holdings.iter().map(|h| h.usd_value).sum();
        let holdings: Vec<TokenHolding> = holdings
            .into_iter()
            .map(|mut h| {
                h.percentage = if total_value > 0.0 {
                    ((h.usd_value / total_value) * 100.0) as f32
                } else {
                    0.0
                };
                h
            })
            .collect();

        let win_rate = if transactions.len() > 0 {
            (profitable_trades as f32 / transactions.len() as f32) * 100.0
        } else {
            0.0
        };

        let performance_stats = PerformanceStats {
            total_profit,
            win_rate,
            avg_hold_duration_hours: 24.0,
            best_trade_profit: transactions
                .iter()
                .filter_map(|t| t.profit)
                .max_by(|a, b| a.partial_cmp(b).unwrap())
                .unwrap_or(0.0),
            worst_trade_loss: transactions
                .iter()
                .filter_map(|t| t.profit)
                .min_by(|a, b| a.partial_cmp(b).unwrap())
                .unwrap_or(0.0),
        };

        WhaleProfile {
            wallet,
            recent_transactions: transactions.into_iter().take(50).collect(),
            holdings,
            performance_stats,
        }
    }

    pub fn detect_whale(&self, address: &str, total_value: f64) -> Option<WhaleWallet> {
        if total_value < 100_000.0 {
            return None;
        }

        let label = self.known_whale_addresses.get(address).cloned();
        let category = self.categorize_whale(total_value);
        let smart_money_score = self.calculate_smart_money_score(total_value, &label);

        Some(WhaleWallet {
            id: Uuid::new_v4().to_string(),
            address: address.to_string(),
            label,
            total_value,
            category,
            smart_money_score,
            win_rate: 0.0,
            total_trades: 0,
            profitable_trades: 0,
            is_tracked: false,
            first_seen: Utc::now().timestamp(),
        })
    }

    fn categorize_whale(&self, total_value: f64) -> String {
        if total_value >= 10_000_000.0 {
            "mega-whale".to_string()
        } else if total_value >= 1_000_000.0 {
            "whale".to_string()
        } else if total_value >= 500_000.0 {
            "large-holder".to_string()
        } else {
            "medium-holder".to_string()
        }
    }

    fn calculate_smart_money_score(&self, total_value: f64, label: &Option<String>) -> f32 {
        let mut score = 0.5;

        if label.is_some() {
            score += 0.3;
        }

        if total_value >= 1_000_000.0 {
            score += 0.2;
        }

        score.min(1.0)
    }
}

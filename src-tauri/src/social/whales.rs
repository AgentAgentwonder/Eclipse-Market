use super::types::*;
use crate::token_flow::clustering::{perform_louvain_clustering, LouvainConfig};
use crate::token_flow::types::TokenFlowEdge;
use chrono::Utc;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

pub type SharedWhaleTracker = Arc<RwLock<WhaleTracker>>;

pub struct WhaleTracker {
    tracked_whales: HashMap<String, WhaleWallet>,
    followed_wallets: Vec<String>,
    movements: Vec<WhaleMovement>,
    insights: Vec<WhaleBehaviorInsight>,
}

impl WhaleTracker {
    pub fn new() -> Self {
        Self {
            tracked_whales: HashMap::new(),
            followed_wallets: Vec::new(),
            movements: Vec::new(),
            insights: Vec::new(),
        }
    }

    pub fn add_whale(&mut self, whale: WhaleWallet) {
        self.tracked_whales.insert(whale.address.clone(), whale);
    }

    pub fn remove_whale(&mut self, address: &str) {
        self.tracked_whales.remove(address);
    }

    pub fn get_whale(&self, address: &str) -> Option<WhaleWallet> {
        self.tracked_whales.get(address).cloned()
    }

    pub fn get_all_whales(&self) -> Vec<WhaleWallet> {
        self.tracked_whales.values().cloned().collect()
    }

    pub fn follow_wallet(&mut self, address: String) -> Result<(), String> {
        if self.followed_wallets.contains(&address) {
            return Err("Wallet already followed".to_string());
        }
        self.followed_wallets.push(address.clone());
        if let Some(whale) = self.tracked_whales.get_mut(&address) {
            whale.following = true;
        }
        Ok(())
    }

    pub fn unfollow_wallet(&mut self, address: &str) -> Result<(), String> {
        if let Some(pos) = self.followed_wallets.iter().position(|a| a == address) {
            self.followed_wallets.remove(pos);
            if let Some(whale) = self.tracked_whales.get_mut(address) {
                whale.following = false;
            }
            Ok(())
        } else {
            Err("Wallet not found in followed list".to_string())
        }
    }

    pub fn get_followed_wallets(&self) -> Vec<WhaleWallet> {
        self.tracked_whales
            .values()
            .filter(|whale| whale.following)
            .cloned()
            .collect()
    }

    pub fn record_movement(&mut self, movement: WhaleMovement) {
        self.movements.push(movement);
        if self.movements.len() > 1000 {
            self.movements.drain(0..100);
        }
    }

    pub fn get_recent_movements(&self, limit: usize) -> Vec<WhaleMovement> {
        let mut movements = self.movements.clone();
        movements.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
        movements.into_iter().take(limit).collect()
    }

    pub fn get_wallet_follow_events(&self, limit: usize) -> Vec<WalletFollowEvent> {
        let now = Utc::now().timestamp();
        self.movements
            .iter()
            .filter(|m| self.followed_wallets.contains(&m.wallet_address))
            .map(|m| WalletFollowEvent {
                wallet_address: m.wallet_address.clone(),
                title: format!(
                    "{} {} {}",
                    match m.movement_type {
                        MovementType::Buy => "Bought",
                        MovementType::Sell => "Sold",
                        MovementType::Transfer => "Transferred",
                        MovementType::StakeUnstake => "Staked/Unstaked",
                        MovementType::LiquidityAdd => "Added Liquidity",
                        MovementType::LiquidityRemove => "Removed Liquidity",
                    },
                    m.amount,
                    m.token_symbol
                ),
                description: format!(
                    "Transaction value: ${:.2}. Impact score: {:.2}",
                    m.value_usd, m.impact_score
                ),
                impact: m.impact_score,
                timestamp: m.timestamp,
                tokens: vec![m.token_address.clone()],
                action: m.movement_type.clone(),
            })
            .rev()
            .take(limit)
            .collect()
    }

    pub fn add_insight(&mut self, insight: WhaleBehaviorInsight) {
        self.insights.push(insight);
        if self.insights.len() > 500 {
            self.insights.drain(0..50);
        }
    }

    pub fn get_insights(&self, limit: usize) -> Vec<WhaleBehaviorInsight> {
        let mut insights = self.insights.clone();
        insights.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
        insights.into_iter().take(limit).collect()
    }

    pub fn cluster_whales(&mut self, edges: &[TokenFlowEdge]) -> Vec<String> {
        let config = LouvainConfig::default();
        let cluster_map = perform_louvain_clustering(edges, config);
        for (wallet_address, cluster_id) in cluster_map.iter() {
            if let Some(whale) = self.tracked_whales.get_mut(wallet_address) {
                whale.cluster_id = Some(format!("cluster-{}", cluster_id));
            }
        }
        cluster_map.keys().cloned().collect()
    }

    pub fn analyze_behavior(&mut self, wallet_address: &str) -> Result<BehaviorPattern, String> {
        let movements: Vec<&WhaleMovement> = self
            .movements
            .iter()
            .filter(|m| m.wallet_address == wallet_address)
            .collect();

        if movements.is_empty() {
            return Ok(BehaviorPattern::Hodler);
        }

        let mut buy_count = 0;
        let mut sell_count = 0;
        let mut transfer_count = 0;
        let total_volume: f64 = movements.iter().map(|m| m.value_usd).sum();

        for movement in &movements {
            match movement.movement_type {
                MovementType::Buy => buy_count += 1,
                MovementType::Sell => sell_count += 1,
                MovementType::Transfer => transfer_count += 1,
                _ => {}
            }
        }

        let pattern = if buy_count > sell_count * 2 {
            BehaviorPattern::Accumulator
        } else if sell_count > buy_count * 2 {
            BehaviorPattern::Distributor
        } else if buy_count + sell_count > movements.len() / 2 {
            BehaviorPattern::Trader
        } else if transfer_count > movements.len() / 3 {
            BehaviorPattern::Manipulator
        } else {
            BehaviorPattern::Hodler
        };

        if let Some(whale) = self.tracked_whales.get_mut(wallet_address) {
            whale.behavior_pattern = pattern.clone();
        }

        Ok(pattern)
    }

    pub fn generate_mock_whales(&mut self) {
        let now = Utc::now().timestamp();
        let mock_whales = vec![
            WhaleWallet {
                address: "WhaleAddr1111111111111111111111111111111".to_string(),
                label: Some("Alpha Whale".to_string()),
                balance: 15000000.0,
                token_holdings: vec![
                    TokenHolding {
                        token_address: "So11111111111111111111111111111111111111112".to_string(),
                        token_symbol: "SOL".to_string(),
                        amount: 75000.0,
                        value_usd: 10000000.0,
                        percentage: 66.7,
                    },
                    TokenHolding {
                        token_address: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN".to_string(),
                        token_symbol: "JUP".to_string(),
                        amount: 1500000.0,
                        value_usd: 5000000.0,
                        percentage: 33.3,
                    },
                ],
                behavior_pattern: BehaviorPattern::Accumulator,
                last_activity: now - 3600,
                cluster_id: Some("cluster-1".to_string()),
                risk_level: WhaleRiskLevel::Low,
                following: false,
            },
            WhaleWallet {
                address: "WhaleAddr2222222222222222222222222222222".to_string(),
                label: Some("Market Mover".to_string()),
                balance: 8500000.0,
                token_holdings: vec![TokenHolding {
                    token_address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v".to_string(),
                    token_symbol: "USDC".to_string(),
                    amount: 8500000.0,
                    value_usd: 8500000.0,
                    percentage: 100.0,
                }],
                behavior_pattern: BehaviorPattern::Distributor,
                last_activity: now - 1800,
                cluster_id: Some("cluster-2".to_string()),
                risk_level: WhaleRiskLevel::Medium,
                following: false,
            },
        ];

        for whale in mock_whales {
            self.add_whale(whale);
        }

        self.movements.push(WhaleMovement {
            id: uuid::Uuid::new_v4().to_string(),
            wallet_address: "WhaleAddr1111111111111111111111111111111".to_string(),
            transaction_hash: "TxHash111".to_string(),
            token_address: "So11111111111111111111111111111111111111112".to_string(),
            token_symbol: "SOL".to_string(),
            amount: 5000.0,
            value_usd: 650000.0,
            movement_type: MovementType::Buy,
            from_address: Some("Exchange1".to_string()),
            to_address: Some("WhaleAddr1111111111111111111111111111111".to_string()),
            timestamp: now - 1200,
            impact_score: 0.75,
            sentiment_shift: Some(0.15),
        });

        self.insights.push(WhaleBehaviorInsight {
            wallet_address: "WhaleAddr1111111111111111111111111111111".to_string(),
            insight_type: InsightType::AccumulationPhase,
            title: "Alpha Whale accumulating SOL".to_string(),
            description: "Large purchase detected, potential bullish signal".to_string(),
            confidence: 0.85,
            supporting_data: vec!["5000 SOL bought".to_string(), "650K USD value".to_string()],
            timestamp: now - 1200,
        });
    }
}

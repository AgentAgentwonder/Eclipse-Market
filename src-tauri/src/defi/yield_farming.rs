use crate::defi::types::*;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FarmingOpportunity {
    pub farm: YieldFarm,
    pub projected_earnings_24h: f64,
    pub projected_earnings_30d: f64,
    pub risk_adjusted_apy: f64,
}

#[derive(Clone, Default)]
pub struct YieldFarmingAdapter;

impl YieldFarmingAdapter {
    pub fn new() -> Self {
        Self
    }

    pub async fn get_all_farms(&self) -> Result<Vec<YieldFarm>, String> {
        Ok(self.generate_mock_farms())
    }

    pub async fn get_opportunities(&self, min_apy: f64, max_risk: u8) -> Result<Vec<FarmingOpportunity>, String> {
        let farms = self.get_all_farms().await?;
        let opportunities: Vec<FarmingOpportunity> = farms
            .into_iter()
            .filter(|farm| farm.apy >= min_apy && farm.risk_score <= max_risk)
            .map(|farm| FarmingOpportunity {
                projected_earnings_24h: (farm.tvl * farm.apy / 100.0) / 365.0,
                projected_earnings_30d: (farm.tvl * farm.apy / 100.0) / 12.0,
                risk_adjusted_apy: farm.apy * (1.0 - (farm.risk_score as f64 / 100.0) * 0.3),
                farm,
            })
            .collect();
        Ok(opportunities)
    }

    pub async fn get_positions(&self, wallet: &str) -> Result<Vec<DeFiPosition>, String> {
        let positions = self.generate_mock_positions(wallet);
        Ok(positions)
    }

    fn generate_mock_farms(&self) -> Vec<YieldFarm> {
        use rand::Rng;
        let mut rng = rand::thread_rng();

        vec![
            YieldFarm {
                id: "raydium-sol-usdc".to_string(),
                protocol: Protocol::Raydium,
                name: "SOL-USDC LP".to_string(),
                token_a: "SOL".to_string(),
                token_b: "USDC".to_string(),
                apy: rng.gen_range(12.0..25.0),
                tvl: rng.gen_range(20_000_000.0..80_000_000.0),
                rewards_token: vec!["RAY".to_string()],
                risk_score: 45,
            },
            YieldFarm {
                id: "raydium-ray-sol".to_string(),
                protocol: Protocol::Raydium,
                name: "RAY-SOL LP".to_string(),
                token_a: "RAY".to_string(),
                token_b: "SOL".to_string(),
                apy: rng.gen_range(25.0..45.0),
                tvl: rng.gen_range(8_000_000.0..30_000_000.0),
                rewards_token: vec!["RAY".to_string()],
                risk_score: 60,
            },
            YieldFarm {
                id: "orca-sol-usdc".to_string(),
                protocol: Protocol::Orca,
                name: "SOL-USDC Whirlpool".to_string(),
                token_a: "SOL".to_string(),
                token_b: "USDC".to_string(),
                apy: rng.gen_range(15.0..28.0),
                tvl: rng.gen_range(18_000_000.0..70_000_000.0),
                rewards_token: vec!["ORCA".to_string()],
                risk_score: 40,
            },
            YieldFarm {
                id: "orca-orca-usdc".to_string(),
                protocol: Protocol::Orca,
                name: "ORCA-USDC Whirlpool".to_string(),
                token_a: "ORCA".to_string(),
                token_b: "USDC".to_string(),
                apy: rng.gen_range(30.0..55.0),
                tvl: rng.gen_range(5_000_000.0..25_000_000.0),
                rewards_token: vec!["ORCA".to_string()],
                risk_score: 70,
            },
        ]
    }

    fn generate_mock_positions(&self, _wallet: &str) -> Vec<DeFiPosition> {
        use rand::Rng;
        let mut rng = rand::thread_rng();
        let timestamp = chrono::Utc::now().timestamp();

        vec![
            DeFiPosition {
                id: "raydium-sol-usdc-farm".to_string(),
                protocol: Protocol::Raydium,
                position_type: PositionType::Farming,
                asset: "SOL-USDC LP".to_string(),
                amount: rng.gen_range(500.0..5000.0),
                value_usd: rng.gen_range(3000.0..30000.0),
                apy: rng.gen_range(15.0..25.0),
                rewards: vec![
                    Reward {
                        token: "RAY".to_string(),
                        amount: rng.gen_range(5.0..50.0),
                        value_usd: rng.gen_range(10.0..100.0),
                    },
                ],
                health_factor: None,
                created_at: timestamp,
                last_updated: timestamp,
            },
            DeFiPosition {
                id: "orca-sol-usdc-farm".to_string(),
                protocol: Protocol::Orca,
                position_type: PositionType::Farming,
                asset: "SOL-USDC Whirlpool".to_string(),
                amount: rng.gen_range(300.0..3000.0),
                value_usd: rng.gen_range(2000.0..20000.0),
                apy: rng.gen_range(18.0..28.0),
                rewards: vec![
                    Reward {
                        token: "ORCA".to_string(),
                        amount: rng.gen_range(8.0..80.0),
                        value_usd: rng.gen_range(15.0..150.0),
                    },
                ],
                health_factor: None,
                created_at: timestamp,
                last_updated: timestamp,
            },
        ]
    }
}

#[tauri::command]
pub async fn get_yield_farms() -> Result<Vec<YieldFarm>, String> {
    YieldFarmingAdapter::new().get_all_farms().await
}

#[tauri::command]
pub async fn get_farming_opportunities(min_apy: f64, max_risk: u8) -> Result<Vec<FarmingOpportunity>, String> {
    YieldFarmingAdapter::new().get_opportunities(min_apy, max_risk).await
}

#[tauri::command]
pub async fn get_farming_positions(wallet: String) -> Result<Vec<DeFiPosition>, String> {
    YieldFarmingAdapter::new().get_positions(&wallet).await
}

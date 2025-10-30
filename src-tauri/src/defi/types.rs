use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeFiPosition {
    pub id: String,
    pub protocol: Protocol,
    pub position_type: PositionType,
    pub asset: String,
    pub amount: f64,
    pub value_usd: f64,
    pub apy: f64,
    pub rewards: Vec<Reward>,
    pub health_factor: Option<f64>,
    pub created_at: i64,
    pub last_updated: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum Protocol {
    Solend,
    MarginFi,
    Kamino,
    Jupiter,
    Raydium,
    Orca,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum PositionType {
    Lending,
    Borrowing,
    LiquidityPool,
    Staking,
    Farming,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Reward {
    pub token: String,
    pub amount: f64,
    pub value_usd: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LendingPool {
    pub id: String,
    pub protocol: Protocol,
    pub asset: String,
    pub total_supply: f64,
    pub total_borrow: f64,
    pub supply_apy: f64,
    pub borrow_apy: f64,
    pub utilization_rate: f64,
    pub available_liquidity: f64,
    pub collateral_factor: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct YieldFarm {
    pub id: String,
    pub protocol: Protocol,
    pub name: String,
    pub token_a: String,
    pub token_b: String,
    pub apy: f64,
    pub tvl: f64,
    pub rewards_token: Vec<String>,
    pub risk_score: u8,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StakingPool {
    pub id: String,
    pub protocol: Protocol,
    pub asset: String,
    pub apy: f64,
    pub tvl: f64,
    pub lock_period: Option<u64>,
    pub min_stake: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AutoCompoundSettings {
    pub position_id: String,
    pub enabled: bool,
    pub threshold: f64,
    pub frequency: u64,
    pub slippage_tolerance: f64,
    pub gas_limit: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GovernanceProposal {
    pub id: String,
    pub protocol: Protocol,
    pub title: String,
    pub description: String,
    pub proposer: String,
    pub start_time: i64,
    pub end_time: i64,
    pub votes_for: f64,
    pub votes_against: f64,
    pub votes_abstain: f64,
    pub status: ProposalStatus,
    pub quorum: f64,
    pub execution_eta: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ProposalStatus {
    Active,
    Passed,
    Rejected,
    Executed,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RiskMetrics {
    pub position_id: String,
    pub risk_level: RiskLevel,
    pub liquidation_price: Option<f64>,
    pub health_factor: Option<f64>,
    pub collateral_ratio: Option<f64>,
    pub warnings: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum RiskLevel {
    Low,
    Medium,
    High,
    Critical,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProtocolStats {
    pub protocol: Protocol,
    pub tvl: f64,
    pub total_users: u64,
    pub total_volume_24h: f64,
    pub average_apy: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PortfolioSummary {
    pub total_value_usd: f64,
    pub lending_value: f64,
    pub borrowing_value: f64,
    pub lp_value: f64,
    pub staking_value: f64,
    pub farming_value: f64,
    pub total_earnings_24h: f64,
    pub average_apy: f64,
    pub positions: Vec<DeFiPosition>,
}
